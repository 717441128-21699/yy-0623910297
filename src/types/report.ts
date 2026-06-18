import type { RiskCategory, RiskLevel } from './event';

export interface DailyReport {
  id: string;
  date: Date;
  totalEvents: number;
  highRiskCount: number;
  processedCount: number;
  pendingCount: number;
  highFreqIssues: HighFreqIssue[];
  leaderAttention: LeaderAttentionItem[];
  dispositionNote: string;
  status: 'draft' | 'final';
  createdAt: Date;
}

export interface HighFreqIssue {
  category: RiskCategory;
  count: number;
  examples: string[];
}

export interface LeaderAttentionItem {
  type: 'highRisk' | 'crossDept' | 'decision';
  title: string;
  description: string;
  level: RiskLevel;
}

export const LEADER_ATTENTION_TYPE_LABELS: Record<LeaderAttentionItem['type'], string> = {
  highRisk: '高风险事件',
  crossDept: '跨部门协调',
  decision: '需决策事项',
};
