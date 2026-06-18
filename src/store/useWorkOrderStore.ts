import { create } from 'zustand';
import type { WorkOrder, WorkOrderStatus, HistoryRecord } from '@/types/workOrder';
import { mockWorkOrders, mockHistoryRecords } from '@/data/mockWorkOrders';

interface WorkOrderState {
  workOrders: Record<string, WorkOrder>;
  historyRecords: Record<string, HistoryRecord[]>;
  createWorkOrder: (eventId: string, data: Partial<WorkOrder>) => void;
  updateWorkOrder: (eventId: string, data: Partial<WorkOrder>) => void;
  addHistoryRecord: (eventId: string, record: Omit<HistoryRecord, 'id' | 'workOrderId'>) => void;
  getWorkOrderByEventId: (eventId: string) => WorkOrder | undefined;
  getHistoryByEventId: (eventId: string) => HistoryRecord[];
}

const STORAGE_KEY = 'sentinal_workorders';
const HISTORY_KEY = 'sentinal_history';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed as T;
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

export const useWorkOrderStore = create<WorkOrderState>((set, get) => ({
  workOrders: loadFromStorage(STORAGE_KEY, mockWorkOrders),
  historyRecords: loadFromStorage(HISTORY_KEY, mockHistoryRecords),

  createWorkOrder: (eventId, data) => {
    const now = new Date();
    const workOrderId = `wo-${Date.now()}`;
    const newWorkOrder: WorkOrder = {
      id: workOrderId,
      eventId,
      status: 'pending',
      verifyResult: '',
      responsibleDept: '',
      expectedFeedbackTime: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      handler: '',
      createdAt: now,
      updatedAt: now,
      ...data,
    };

    set((state) => {
      const newWorkOrders = { ...state.workOrders, [eventId]: newWorkOrder };
      saveToStorage(STORAGE_KEY, newWorkOrders);
      return { workOrders: newWorkOrders };
    });

    get().addHistoryRecord(eventId, {
      action: '创建工单',
      operator: '值班员',
      remark: '人工创建工单',
      timestamp: now,
    });
  },

  updateWorkOrder: (eventId, data) => {
    set((state) => {
      const existing = state.workOrders[eventId];
      if (!existing) return state;

      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };

      const newWorkOrders = { ...state.workOrders, [eventId]: updated };
      saveToStorage(STORAGE_KEY, newWorkOrders);
      return { workOrders: newWorkOrders };
    });
  },

  addHistoryRecord: (eventId, record) => {
    set((state) => {
      const workOrder = state.workOrders[eventId];
      if (!workOrder) return state;

      const workOrderId = workOrder.id;
      const newRecord: HistoryRecord = {
        id: `hr-${Date.now()}`,
        workOrderId,
        ...record,
      };

      const existingHistory = state.historyRecords[workOrderId] || [];
      const newHistory = [...existingHistory, newRecord];
      const newHistoryRecords = { ...state.historyRecords, [workOrderId]: newHistory };
      saveToStorage(HISTORY_KEY, newHistoryRecords);
      return { historyRecords: newHistoryRecords };
    });
  },

  getWorkOrderByEventId: (eventId) => {
    return get().workOrders[eventId];
  },

  getHistoryByEventId: (eventId) => {
    const workOrder = get().workOrders[eventId];
    if (!workOrder) return [];
    return get().historyRecords[workOrder.id] || [];
  },
}));
