import { create } from 'zustand';
import type { DailyReport, HighFreqIssue, LeaderAttentionItem } from '@/types/report';
import type { Event } from '@/types/event';
import { mockEvents } from '@/data/mockEvents';

interface ReportState {
  currentReport: DailyReport | null;
  generateReport: (date: Date, events: Event[]) => DailyReport;
  updateDispositionNote: (note: string) => void;
  finalizeReport: () => void;
  exportReport: () => string;
}

function generateHighFreqIssues(events: Event[]): HighFreqIssue[] {
  const categoryCounts: Record<string, number> = {};
  const categoryExamples: Record<string, string[]> = {};

  events.forEach(event => {
    categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;
    if (!categoryExamples[event.category]) {
      categoryExamples[event.category] = [];
    }
    if (categoryExamples[event.category].length < 3) {
      categoryExamples[event.category].push(event.title);
    }
  });

  return Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category: category as HighFreqIssue['category'],
      count,
      examples: categoryExamples[category] || [],
    }))
    .sort((a, b) => b.count - a.count);
}

function generateLeaderAttention(events: Event[]): LeaderAttentionItem[] {
  const items: LeaderAttentionItem[] = [];

  const highRiskEvents = events.filter(e => e.riskLevel === 'high');
  highRiskEvents.forEach(event => {
    items.push({
      type: 'highRisk',
      title: event.title,
      description: event.content.substring(0, 100) + '...',
      level: event.riskLevel,
    });
  });

  const crossDeptEvents = events.filter(e => e.category === 'safety' || e.category === 'crowd');
  if (crossDeptEvents.length > 0) {
    items.push({
      type: 'crossDept',
      title: '跨部门协调事项',
      description: `今日有${crossDeptEvents.length}项事件需要多个部门协同处理，请各部门加强配合。`,
      level: 'high',
    });
  }

  if (highRiskEvents.length >= 3) {
    items.push({
      type: 'decision',
      title: '应急预案启动建议',
      description: '今日高风险事件已达3件以上，建议启动节假日应急预案，增派值班人员。',
      level: 'high',
    });
  }

  return items;
}

export const useReportStore = create<ReportState>((set, get) => ({
  currentReport: null,

  generateReport: (date, events) => {
    const highRiskCount = events.filter(e => e.riskLevel === 'high').length;
    const processedCount = events.filter(e => e.riskLevel === 'resolved').length;
    const pendingCount = events.filter(e => e.riskLevel !== 'resolved').length;

    const report: DailyReport = {
      id: `report-${date.getTime()}`,
      date,
      totalEvents: events.length,
      highRiskCount,
      processedCount,
      pendingCount,
      highFreqIssues: generateHighFreqIssues(events),
      leaderAttention: generateLeaderAttention(events),
      dispositionNote: '',
      status: 'draft',
      createdAt: new Date(),
    };

    set({ currentReport: report });
    return report;
  },

  updateDispositionNote: (note) => {
    set((state) => {
      if (!state.currentReport) return state;
      return {
        currentReport: {
          ...state.currentReport,
          dispositionNote: note,
        },
      };
    });
  },

  finalizeReport: () => {
    set((state) => {
      if (!state.currentReport) return state;
      return {
        currentReport: {
          ...state.currentReport,
          status: 'final',
        },
      };
    });
  },

  exportReport: () => {
    const report = get().currentReport;
    if (!report) return '';

    const dateStr = report.date.toLocaleDateString('zh-CN');
    let content = `# 景区舆情日报 - ${dateStr}\n\n`;
    content += `## 一、数据概览\n\n`;
    content += `- 今日舆情总数：${report.totalEvents} 条\n`;
    content += `- 高风险事件：${report.highRiskCount} 条\n`;
    content += `- 已处理：${report.processedCount} 条\n`;
    content += `- 待处理：${report.pendingCount} 条\n\n`;
    content += `## 二、高频问题\n\n`;
    report.highFreqIssues.forEach((issue, index) => {
      const categoryMap: Record<string, string> = {
        complaint: '投诉',
        crowd: '拥堵',
        overcharge: '宰客',
        service: '服务态度',
        safety: '安全隐患',
      };
      content += `${index + 1}. ${categoryMap[issue.category]}（${issue.count}条）\n`;
      issue.examples.forEach(example => {
        content += `   - ${example}\n`;
      });
      content += '\n';
    });
    content += `## 三、领导关注\n\n`;
    report.leaderAttention.forEach((item, index) => {
      const typeMap: Record<string, string> = {
        highRisk: '高风险事件',
        crossDept: '跨部门协调',
        decision: '需决策事项',
      };
      content += `${index + 1}. 【${typeMap[item.type]}】${item.title}\n`;
      content += `   ${item.description}\n\n`;
    });
    content += `## 四、处置说明\n\n`;
    content += `${report.dispositionNote || '暂无'}\n\n`;
    content += `---\n`;
    content += `生成时间：${new Date().toLocaleString('zh-CN')}\n`;

    return content;
  },
}));
