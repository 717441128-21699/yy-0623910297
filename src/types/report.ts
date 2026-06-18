import type { RiskCategory, RiskLevel, Event, Platform } from './event';
import type { WorkOrderStatus, SupervisionStatus } from './workOrder';

export interface ReportFilter {
  scenic: string;
  platforms: Platform[];
}

export interface DailyReport {
  id: string;
  date: Date;
  filter: ReportFilter;
  totalEvents: number;
  highRiskCount: number;
  pendingCount: number;
  processingCount: number;
  respondedCount: number;
  highFreqIssues: HighFreqIssue[];
  leaderAttention: LeaderAttentionGroup;
  supervision: SupervisionGroup;
  respondedItems: RespondedItem[];
  processingItems: WorkOrderSummaryItem[];
  pendingItems: WorkOrderSummaryItem[];
  dispositionNote: string;
  status: 'draft' | 'final';
  createdAt: Date;
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
  leaderCommented: '领导已批示',
};
