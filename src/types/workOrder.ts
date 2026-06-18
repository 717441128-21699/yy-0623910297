export type WorkOrderStatus = 'pending' | 'processing' | 'responded';

export type SupervisionStatus = 'none' | 'needReport' | 'reported' | 'leaderCommented' | 'feedbackSubmitted' | 'closed';

export interface WorkOrder {
  id: string;
  eventId: string;
  status: WorkOrderStatus;
  verifyResult: string;
  responsibleDept: string;
  expectedFeedbackTime: Date;
  handler: string;
  dispositionSummary: string;
  supervisionStatus: SupervisionStatus;
  reportTime?: Date;
  leaderComment?: string;
  leaderFeedbackDeadline?: Date;
  rectificationFeedback?: string;
  feedbackPerson?: string;
  feedbackTime?: Date;
  closeTime?: Date;
  closer?: string;
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
  status?: WorkOrderStatus;
  verifyResult?: string;
  responsibleDept?: string;
  expectedFeedbackTime?: Date;
  dispositionSummary?: string;
  supervisionStatus?: SupervisionStatus;
  leaderComment?: string;
  leaderFeedbackDeadline?: Date;
  rectificationFeedback?: string;
  feedbackPerson?: string;
  feedbackTime?: Date;
  closeTime?: Date;
  closer?: string;
}

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  pending: '待核实',
  processing: '处理中',
  responded: '已回应',
};

export const SUPERVISION_STATUS_LABELS: Record<SupervisionStatus, string> = {
  none: '无需督办',
  needReport: '需要报领导',
  reported: '已上报',
  leaderCommented: '待整改反馈',
  feedbackSubmitted: '整改已反馈',
  closed: '督办办结',
};

export const SUPERVISION_STATUS_COLORS: Record<SupervisionStatus, string> = {
  none: 'text-text-muted',
  needReport: 'text-risk-high',
  reported: 'text-risk-medium',
  leaderCommented: 'text-tech-blue',
  feedbackSubmitted: 'text-risk-low',
  closed: 'text-risk-resolved',
};

export const DEPARTMENT_OPTIONS = [
  { value: 'tourism', label: '旅游管理处' },
  { value: 'security', label: '安全保卫处' },
  { value: 'transport', label: '交通运输处' },
  { value: 'market', label: '市场监管处' },
  { value: 'service', label: '游客服务中心' },
  { value: 'environment', label: '环境卫生处' },
];
