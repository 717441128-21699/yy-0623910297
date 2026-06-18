export type WorkOrderStatus = 'pending' | 'processing' | 'responded';

export interface WorkOrder {
  id: string;
  eventId: string;
  status: WorkOrderStatus;
  verifyResult: string;
  responsibleDept: string;
  expectedFeedbackTime: Date;
  handler: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoryRecord {
  id: string;
  workOrderId: string;
  action: string;
  operator: string;
  remark: string;
  timestamp: Date;
}

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  pending: '待核实',
  processing: '处理中',
  responded: '已回应',
};

export const DEPARTMENT_OPTIONS = [
  { value: 'tourism', label: '旅游管理处' },
  { value: 'security', label: '安全保卫处' },
  { value: 'transport', label: '交通运输处' },
  { value: 'market', label: '市场监管处' },
  { value: 'service', label: '游客服务中心' },
  { value: 'environment', label: '环境卫生处' },
];
