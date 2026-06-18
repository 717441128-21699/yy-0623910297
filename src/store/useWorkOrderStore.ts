import { create } from 'zustand';
import type { WorkOrder, WorkOrderStatus, HistoryRecord, SupervisionStatus } from '@/types/workOrder';
import { mockWorkOrders, mockHistoryRecords } from '@/data/mockWorkOrders';
import { WORK_ORDER_STATUS_LABELS, SUPERVISION_STATUS_LABELS } from '@/types/workOrder';

interface WorkOrderState {
  workOrders: Record<string, WorkOrder>;
  historyRecords: Record<string, HistoryRecord[]>;
  createWorkOrder: (eventId: string, data: Partial<WorkOrder>) => void;
  updateWorkOrder: (eventId: string, data: Partial<WorkOrder>, operator?: string) => void;
  updateWorkOrderStatus: (eventId: string, status: WorkOrderStatus, data?: Partial<WorkOrder>, operator?: string) => void;
  advanceWorkOrder: (eventId: string, data?: Partial<WorkOrder>, operator?: string) => boolean;
  updateSupervision: (eventId: string, supervisionStatus: SupervisionStatus, data?: Partial<WorkOrder>, operator?: string) => void;
  submitRectificationFeedback: (eventId: string, feedback: string, feedbackPerson: string, operator?: string) => void;
  closeSupervision: (eventId: string, closer: string, operator?: string) => void;
  addHistoryRecord: (eventId: string, record: Omit<HistoryRecord, 'id' | 'workOrderId'>) => void;
  getWorkOrderByEventId: (eventId: string) => WorkOrder | undefined;
  getHistoryByEventId: (eventId: string) => HistoryRecord[];
  getWorkOrderStatsForEvents: (eventIds: string[]) => { pending: number; processing: number; responded: number };
  subscribe: (listener: (state: WorkOrderState) => void) => () => void;
}

const STORAGE_KEY = 'sentinal_workorders';
const HISTORY_KEY = 'sentinal_history';

function deserializeDateFields(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = { ...obj };
  const dateFields = ['createdAt', 'updatedAt', 'expectedFeedbackTime', 'timestamp', 'reportTime', 'leaderFeedbackDeadline', 'feedbackTime', 'closeTime'];
  
  dateFields.forEach(field => {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = new Date(result[field]);
    }
  });
  
  return result;
}

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
              result[k] = v.map(item => deserializeDateFields(item));
            } else {
              const vObj = v as Record<string, any>;
              result[k] = deserializeDateFields(vObj);
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

  subscribe: (listener) => {
    return useWorkOrderStore.subscribe(listener);
  },

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
      supervisionStatus: 'none',
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
      supervisionStatus: 'none',
    });
  },

  updateWorkOrder: (eventId, data, operator = '值班员') => {
    const existing = get().workOrders[eventId];
    if (!existing) return;

    const hasStatusChange = data.status && data.status !== existing.status;
    const hasSupervisionChange = data.supervisionStatus && data.supervisionStatus !== existing.supervisionStatus;

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
    } else if (hasSupervisionChange && data.supervisionStatus) {
      action = `督办状态变更为「${SUPERVISION_STATUS_LABELS[data.supervisionStatus]}」`;
      if (data.supervisionStatus === 'needReport') {
        remark = '标记为需要向领导汇报';
      } else if (data.supervisionStatus === 'reported') {
        remark = '已向领导上报';
      } else if (data.supervisionStatus === 'leaderCommented') {
        remark = '领导已批示，待整改反馈';
      } else if (data.supervisionStatus === 'feedbackSubmitted') {
        remark = '已提交整改反馈，待领导审核';
      } else if (data.supervisionStatus === 'closed') {
        remark = '督办事项已办结';
      }
    } else if (data.rectificationFeedback) {
      action = '整改反馈';
      remark = '提交整改反馈内容';
    } else if (data.responsibleDept && data.responsibleDept !== existing.responsibleDept) {
      action = '指派责任部门';
      remark = `指派责任部门处理`;
    } else if (data.verifyResult) {
      action = '核实情况';
      remark = '补充核实情况说明';
    } else if (data.dispositionSummary) {
      action = '更新处置摘要';
      remark = '更新处置措施摘要';
    } else if (data.leaderComment) {
      action = '领导批示';
      remark = data.leaderComment;
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
      supervisionStatus: data.supervisionStatus || undefined,
      leaderComment: data.leaderComment || undefined,
      leaderFeedbackDeadline: data.leaderFeedbackDeadline || undefined,
      rectificationFeedback: data.rectificationFeedback || undefined,
      feedbackPerson: data.feedbackPerson || undefined,
      feedbackTime: data.feedbackTime || undefined,
      closeTime: data.closeTime || undefined,
      closer: data.closer || undefined,
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

  advanceWorkOrder: (eventId, data, operator = '值班员'): boolean => {
    const existing = get().workOrders[eventId];
    const now = new Date();
    
    if (!existing) {
      if (!data?.verifyResult?.trim()) return false;
      
      get().createWorkOrder(eventId, {
        status: 'processing',
        verifyResult: data.verifyResult,
        responsibleDept: data.responsibleDept || '',
        expectedFeedbackTime: data.expectedFeedbackTime || new Date(now.getTime() + 4 * 60 * 60 * 1000),
        handler: data.handler || operator,
        dispositionSummary: data.dispositionSummary || undefined,
        supervisionStatus: data.supervisionStatus || 'none',
      });
      return true;
    }

    const currentStatus = existing.status;
    
    const updateData: Partial<WorkOrder> = { ...existing, ...data };
    
    if (currentStatus === 'pending') {
      if (!updateData.verifyResult?.trim()) return false;
      get().updateWorkOrderStatus(eventId, 'processing', {
        verifyResult: updateData.verifyResult,
        responsibleDept: updateData.responsibleDept || existing.responsibleDept,
        expectedFeedbackTime: updateData.expectedFeedbackTime || existing.expectedFeedbackTime,
        handler: updateData.handler || operator,
        dispositionSummary: updateData.dispositionSummary || undefined,
        supervisionStatus: updateData.supervisionStatus || existing.supervisionStatus,
      }, operator);
      return true;
    }
    
    if (currentStatus === 'processing') {
      if (!updateData.verifyResult?.trim() || !updateData.responsibleDept) return false;
      get().updateWorkOrderStatus(eventId, 'responded', {
        verifyResult: updateData.verifyResult,
        responsibleDept: updateData.responsibleDept,
        handler: updateData.handler || operator,
        dispositionSummary: updateData.dispositionSummary || existing.dispositionSummary || '已妥善处置',
        supervisionStatus: updateData.supervisionStatus || existing.supervisionStatus,
      }, operator);
      return true;
    }
    
    return false;
  },

  updateSupervision: (eventId, supervisionStatus, data, operator = '值班员') => {
    const existing = get().workOrders[eventId];
    if (!existing) return;

    const updateData: Partial<WorkOrder> = {
      supervisionStatus,
      ...data,
    };

    if (supervisionStatus === 'needReport' || supervisionStatus === 'reported') {
      updateData.reportTime = new Date();
    }

    get().updateWorkOrder(eventId, updateData, operator);
  },

  submitRectificationFeedback: (eventId, feedback, feedbackPerson, operator = '值班员') => {
    const existing = get().workOrders[eventId];
    if (!existing) return;

    const now = new Date();
    get().updateWorkOrder(eventId, {
      supervisionStatus: 'feedbackSubmitted',
      rectificationFeedback: feedback,
      feedbackPerson,
      feedbackTime: now,
    }, operator);
  },

  closeSupervision: (eventId, closer, operator = '值班员') => {
    const existing = get().workOrders[eventId];
    if (!existing) return;

    const now = new Date();
    get().updateWorkOrder(eventId, {
      supervisionStatus: 'closed',
      closer,
      closeTime: now,
    }, operator);
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
      } else {
        pending++;
      }
    });

    return { pending, processing, responded };
  },
}));
