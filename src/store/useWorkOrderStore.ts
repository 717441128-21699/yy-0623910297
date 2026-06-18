import { create } from 'zustand';
import type { WorkOrder, WorkOrderStatus, HistoryRecord } from '@/types/workOrder';
import { mockWorkOrders, mockHistoryRecords } from '@/data/mockWorkOrders';
import { WORK_ORDER_STATUS_LABELS } from '@/types/workOrder';

interface WorkOrderState {
  workOrders: Record<string, WorkOrder>;
  historyRecords: Record<string, HistoryRecord[]>;
  createWorkOrder: (eventId: string, data: Partial<WorkOrder>) => void;
  updateWorkOrder: (eventId: string, data: Partial<WorkOrder>, operator?: string) => void;
  updateWorkOrderStatus: (eventId: string, status: WorkOrderStatus, data?: Partial<WorkOrder>, operator?: string) => void;
  addHistoryRecord: (eventId: string, record: Omit<HistoryRecord, 'id' | 'workOrderId'>) => void;
  getWorkOrderByEventId: (eventId: string) => WorkOrder | undefined;
  getHistoryByEventId: (eventId: string) => HistoryRecord[];
  getWorkOrderStatsForEvents: (eventIds: string[]) => { pending: number; processing: number; responded: number };
}

const STORAGE_KEY = 'sentinal_workorders';
const HISTORY_KEY = 'sentinal_history';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, any>;
      if (typeof parsed === 'object' && parsed !== null) {
        const result: Record<string, any> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (v && typeof v === 'object') {
            if (Array.isArray(v)) {
              result[k] = v.map(item => ({
                ...item,
                timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
                expectedFeedbackTime: item.expectedFeedbackTime ? new Date(item.expectedFeedbackTime) : undefined,
              }));
            } else {
              const vObj = v as Record<string, any>;
              result[k] = {
                ...vObj,
                createdAt: vObj.createdAt ? new Date(vObj.createdAt) : new Date(),
                updatedAt: vObj.updatedAt ? new Date(vObj.updatedAt) : new Date(),
                expectedFeedbackTime: vObj.expectedFeedbackTime ? new Date(vObj.expectedFeedbackTime) : new Date(),
              };
            }
          } else {
            result[k] = v;
          }
        }
        return result as T;
      }
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
      dispositionSummary: '',
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
      status: 'pending',
    });
  },

  updateWorkOrder: (eventId, data, operator = '值班员') => {
    const existing = get().workOrders[eventId];
    if (!existing) return;

    const hasStatusChange = data.status && data.status !== existing.status;

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

    let action = '更新工单';
    let remark = '更新工单信息';

    if (hasStatusChange && data.status) {
      action = `状态变更为「${WORK_ORDER_STATUS_LABELS[data.status]}」`;
      remark = `工单状态从「${WORK_ORDER_STATUS_LABELS[existing.status]}」变更为「${WORK_ORDER_STATUS_LABELS[data.status]}」`;
    } else if (data.responsibleDept && data.responsibleDept !== existing.responsibleDept) {
      action = '指派责任部门';
      remark = `指派责任部门处理`;
    } else if (data.verifyResult) {
      action = '核实情况';
      remark = '补充核实情况说明';
    } else if (data.dispositionSummary) {
      action = '更新处置摘要';
      remark = '更新处置措施摘要';
    }

    get().addHistoryRecord(eventId, {
      action,
      operator,
      remark,
      timestamp: new Date(),
      status: data.status || existing.status,
      verifyResult: data.verifyResult || undefined,
      responsibleDept: data.responsibleDept || undefined,
      expectedFeedbackTime: data.expectedFeedbackTime || undefined,
      dispositionSummary: data.dispositionSummary || undefined,
    });
  },

  updateWorkOrderStatus: (eventId, status, data, operator = '值班员') => {
    const existing = get().workOrders[eventId];
    
    if (!existing) {
      get().createWorkOrder(eventId, { status, ...data });
      return;
    }

    get().updateWorkOrder(eventId, { status, ...data }, operator);
  },

  addHistoryRecord: (eventId, record) => {
    set((state) => {
      const workOrder = state.workOrders[eventId];
      if (!workOrder) return state;

      const workOrderId = workOrder.id;
      const newRecord: HistoryRecord = {
        id: `hr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

  getWorkOrderStatsForEvents: (eventIds) => {
    const { workOrders } = get();
    let pending = 0;
    let processing = 0;
    let responded = 0;

    eventIds.forEach(eventId => {
      const wo = workOrders[eventId];
      if (wo) {
        if (wo.status === 'pending') pending++;
        else if (wo.status === 'processing') processing++;
        else if (wo.status === 'responded') responded++;
      }
    });

    return { pending, processing, responded };
  },
}));
