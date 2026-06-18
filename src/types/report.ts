import type { RiskCategory, RiskLevel, Event } from './event';
import type { WorkOrderStatus } from './workOrder';

export interface DailyReport {
  id: string;
  date: Date;
  totalEvents: number;
  highRiskCount: number;
  pendingCount: number;
  processingCount: number;
  respondedCount: number;
  highFreqIssues: HighFreqIssue[];
  leaderAttention: LeaderAttentionGroup;
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

export interface LeaderAttentionItem {
  eventId: string;
  title: string;
  description: string;
  level: RiskLevel;
  viewCount: number;
  spreadSpeed?: number;
  scenic: string;
  platform: string;
}

export interface RespondedItem {
  eventId: string;
  title: string;
  category: RiskCategory;
  responsibleDept: string;
  dispositionSummary: string;
  responder: string;
  respondedAt: Date;
}

export interface WorkOrderSummaryItem {
  eventId: string;
  title: string;
  category: RiskCategory;
  level: RiskLevel;
  status: WorkOrderStatus;
  responsibleDept: string;
  expectedFeedbackTime?: Date;
}

export const LEADER_ATTENTION_TYPE_LABELS: Record<keyof LeaderAttentionGroup, string> = {
  highRiskUnresponded: '高风险未回应',
  fastSpreading: '传播上涨快',
  crossDept: '跨部门协调',
};
