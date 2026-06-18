import type { RiskCategory, RiskLevel, Event, Platform } from './event';
import type { WorkOrderStatus, SupervisionStatus } from './workOrder';

export type ShiftType = 'morning' | 'afternoon' | 'evening';

export const SHIFT_OPTIONS: { value: ShiftType; label: string; timeRange: string }[] = [
  { value: 'morning', label: '早班', timeRange: '08:00-14:00' },
  { value: 'afternoon', label: '中班', timeRange: '14:00-20:00' },
  { value: 'evening', label: '晚班', timeRange: '20:00-次日08:00' },
];

export interface ReportFilter {
  scenic: string;
  platforms: Platform[];
}

export type DeadlineStatus = 'upcoming' | 'overdue' | 'feedbackPending' | 'normal';

export interface DeadlineItem {
  eventId: string;
  title: string;
  level: RiskLevel;
  scenic: string;
  platform: string;
  supervisionStatus: SupervisionStatus;
  leaderFeedbackDeadline?: Date;
  feedbackTime?: Date;
  responsibleDept: string;
  handler: string;
  feedbackPerson?: string;
  deadlineStatus: DeadlineStatus;
  daysOverdue?: number;
  daysRemaining?: number;
}

export interface DeadlineGroup {
  upcoming: DeadlineItem[];
  overdue: DeadlineItem[];
  feedbackPending: DeadlineItem[];
  normal: DeadlineItem[];
}

export interface HandoverMeta {
  keyPoints: string;
  unresolvedItems: string;
  successorConfirmed: boolean;
  successorName: string;
  confirmedAt?: Date;
}

export interface DailyReport {
  id: string;
  date: Date;
  shift: ShiftType;
  shiftLabel: string;
  shiftTimeRange: string;
  onDutyPerson: string;
  handoverTo: string;
  filter: ReportFilter;
  totalEvents: number;
  highRiskCount: number;
  pendingCount: number;
  processingCount: number;
  respondedCount: number;
  highFreqIssues: HighFreqIssue[];
  leaderAttention: LeaderAttentionGroup;
  supervision: SupervisionGroup;
  deadlineBoard: DeadlineGroup;
  respondedItems: RespondedItem[];
  processingItems: WorkOrderSummaryItem[];
  pendingItems: WorkOrderSummaryItem[];
  dispositionNote: string;
  previousIssues: string;
  handoverMeta: HandoverMeta;
  status: 'draft' | 'final';
  createdAt: Date;
  finalizedAt?: Date;
  basedOnReportId?: string;
  autoSavedAt?: Date;
}

export interface HighFreqIssue {
  category: RiskCategory;
  count: number;
  examples: string[];
}

export interface LeaderAttentionGroup {
  highRiskUnresponded: LeaderAttentionItem[];
  fastSpreading: LeaderAttentionItem[];
  crossDept: LeaderAttentionItem[];
}

export interface SupervisionGroup {
  needReport: SupervisionItem[];
  reported: SupervisionItem[];
  leaderCommented: SupervisionItem[];
  feedbackSubmitted: SupervisionItem[];
  closed: SupervisionItem[];
}

export interface LeaderAttentionItem {
  eventId: string;
  title: string;
  description: string;
  level: RiskLevel;
  viewCount: number;
  spreadSpeed?: number;
  scenic: string;
  platform: string;
  supervisionStatus: SupervisionStatus;
  leaderFeedbackDeadline?: Date;
  deadlineStatus?: DeadlineStatus;
  daysOverdue?: number;
  daysRemaining?: number;
  isReported: boolean;
  isFeedbackPending: boolean;
  isOverdue: boolean;
}

export interface SupervisionItem {
  eventId: string;
  title: string;
  level: RiskLevel;
  viewCount: number;
  scenic: string;
  platform: string;
  supervisionStatus: SupervisionStatus;
  reportTime?: Date;
  leaderComment?: string;
  leaderFeedbackDeadline?: Date;
  rectificationFeedback?: string;
  feedbackPerson?: string;
  feedbackTime?: Date;
  closeTime?: Date;
  closer?: string;
  responsibleDept: string;
  handler: string;
}

export interface RespondedItem {
  eventId: string;
  title: string;
  category: RiskCategory;
  responsibleDept: string;
  dispositionSummary: string;
  responder: string;
  respondedAt: Date;
  supervisionStatus: SupervisionStatus;
  leaderComment?: string;
  rectificationFeedback?: string;
}

export interface WorkOrderSummaryItem {
  eventId: string;
  title: string;
  category: RiskCategory;
  level: RiskLevel;
  status: WorkOrderStatus;
  responsibleDept: string;
  expectedFeedbackTime?: Date;
  supervisionStatus: SupervisionStatus;
}

export const LEADER_ATTENTION_TYPE_LABELS: Record<keyof LeaderAttentionGroup, string> = {
  highRiskUnresponded: '高风险未回应',
  fastSpreading: '传播上涨快',
  crossDept: '跨部门协调',
};

export const SUPERVISION_TYPE_LABELS: Record<keyof SupervisionGroup, string> = {
  needReport: '需要报领导',
  reported: '已上报',
  leaderCommented: '待整改反馈',
  feedbackSubmitted: '整改已反馈',
  closed: '督办办结',
};

export const DEADLINE_STATUS_LABELS: Record<DeadlineStatus, string> = {
  upcoming: '即将到期',
  overdue: '已逾期',
  feedbackPending: '已反馈待确认',
  normal: '正常办理',
};

export const DEADLINE_TYPE_LABELS: Record<keyof DeadlineGroup, string> = {
  upcoming: '即将到期（3天内）',
  overdue: '已逾期',
  feedbackPending: '已反馈待确认',
  normal: '正常办理',
};
