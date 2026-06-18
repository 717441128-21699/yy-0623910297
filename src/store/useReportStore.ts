import { create } from 'zustand';
import type { DailyReport, HighFreqIssue, LeaderAttentionGroup, LeaderAttentionItem, RespondedItem, WorkOrderSummaryItem } from '@/types/report';
import type { Event, RiskCategory } from '@/types/event';
import type { WorkOrder } from '@/types/workOrder';
import { CATEGORY_LABELS, PLATFORM_LABELS, SCENIC_OPTIONS } from '@/types/event';
import { DEPARTMENT_OPTIONS } from '@/types/workOrder';

interface ReportState {
  currentReport: DailyReport | null;
  generateReport: (date: Date, events: Event[], workOrders: Record<string, WorkOrder>) => DailyReport;
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

function generateLeaderAttention(events: Event[], workOrders: Record<string, WorkOrder>): LeaderAttentionGroup {
  const highRiskUnresponded: LeaderAttentionItem[] = [];
  const fastSpreading: LeaderAttentionItem[] = [];
  const crossDept: LeaderAttentionItem[] = [];

  const highRiskEvents = events.filter(e => e.riskLevel === 'high');
  
  highRiskEvents.forEach(event => {
    const wo = workOrders[event.id];
    if (!wo || wo.status !== 'responded') {
      highRiskUnresponded.push({
        eventId: event.id,
        title: event.title,
        description: event.content.substring(0, 80) + '...',
        level: event.riskLevel,
        viewCount: event.viewCount,
        scenic: event.scenic,
        platform: event.platform,
      });
    }
  });

  const sortedByViews = [...events].sort((a, b) => b.viewCount - a.viewCount);
  const topEvents = sortedByViews.slice(0, 5);
  
  topEvents.forEach(event => {
    if (event.viewCount > 50000) {
      fastSpreading.push({
        eventId: event.id,
        title: event.title,
        description: `浏览量${(event.viewCount / 10000).toFixed(1)}万，传播速度快，需密切关注`,
        level: event.riskLevel,
        viewCount: event.viewCount,
        spreadSpeed: Math.floor(event.viewCount / 1000),
        scenic: event.scenic,
        platform: event.platform,
      });
    }
  });

  const crossDeptCategories: RiskCategory[] = ['safety', 'crowd'];
  events.forEach(event => {
    if (crossDeptCategories.includes(event.category)) {
      const wo = workOrders[event.id];
      if (!wo || wo.status !== 'responded') {
        const exists = crossDept.some(item => item.eventId === event.id);
        if (!exists) {
          crossDept.push({
            eventId: event.id,
            title: event.title,
            description: `${CATEGORY_LABELS[event.category]}类事件，需多部门协同处理`,
            level: event.riskLevel,
            viewCount: event.viewCount,
            scenic: event.scenic,
            platform: event.platform,
          });
        }
      }
    }
  });

  return {
    highRiskUnresponded: highRiskUnresponded.sort((a, b) => b.viewCount - a.viewCount),
    fastSpreading: fastSpreading.sort((a, b) => b.viewCount - a.viewCount),
    crossDept: crossDept.sort((a, b) => b.viewCount - a.viewCount),
  };
}

function generateRespondedItems(events: Event[], workOrders: Record<string, WorkOrder>): RespondedItem[] {
  const respondedItems: RespondedItem[] = [];

  events.forEach(event => {
    const wo = workOrders[event.id];
    if (wo && wo.status === 'responded') {
      respondedItems.push({
        eventId: event.id,
        title: event.title,
        category: event.category,
        responsibleDept: wo.responsibleDept,
        dispositionSummary: wo.dispositionSummary || '已妥善处置',
        responder: wo.handler || '值班员',
        respondedAt: wo.updatedAt,
      });
    }
  });

  return respondedItems.sort((a, b) => b.respondedAt.getTime() - a.respondedAt.getTime());
}

function generateWorkOrderSummaryItems(events: Event[], workOrders: Record<string, WorkOrder>, status: 'pending' | 'processing'): WorkOrderSummaryItem[] {
  const items: WorkOrderSummaryItem[] = [];

  events.forEach(event => {
    const wo = workOrders[event.id];
    if (wo && wo.status === status) {
      items.push({
        eventId: event.id,
        title: event.title,
        category: event.category,
        level: event.riskLevel,
        status: wo.status,
        responsibleDept: wo.responsibleDept || '未指派',
        expectedFeedbackTime: wo.expectedFeedbackTime,
      });
    }
  });

  return items.sort((a, b) => {
    const levelOrder = { high: 0, medium: 1, low: 2, resolved: 3 };
    return levelOrder[a.level] - levelOrder[b.level];
  });
}

function getDepartmentLabel(value: string): string {
  const dept = DEPARTMENT_OPTIONS.find(d => d.value === value);
  return dept ? dept.label : value;
}

function getScenicLabel(value: string): string {
  const scenic = SCENIC_OPTIONS.find(s => s.value === value);
  return scenic ? scenic.label : value;
}

export const useReportStore = create<ReportState>((set, get) => ({
  currentReport: null,

  generateReport: (date, events, workOrders) => {
    const highRiskCount = events.filter(e => e.riskLevel === 'high').length;
    
    const eventIds = events.map(e => e.id);
    let pendingCount = 0;
    let processingCount = 0;
    let respondedCount = 0;

    eventIds.forEach(eventId => {
      const wo = workOrders[eventId];
      if (wo) {
        if (wo.status === 'pending') pendingCount++;
        else if (wo.status === 'processing') processingCount++;
        else if (wo.status === 'responded') respondedCount++;
      }
    });

    const noWorkOrderCount = events.length - (pendingCount + processingCount + respondedCount);
    pendingCount += noWorkOrderCount;

    const report: DailyReport = {
      id: `report-${date.getTime()}`,
      date,
      totalEvents: events.length,
      highRiskCount,
      pendingCount,
      processingCount,
      respondedCount,
      highFreqIssues: generateHighFreqIssues(events),
      leaderAttention: generateLeaderAttention(events, workOrders),
      respondedItems: generateRespondedItems(events, workOrders),
      processingItems: generateWorkOrderSummaryItems(events, workOrders, 'processing'),
      pendingItems: generateWorkOrderSummaryItems(events, workOrders, 'pending'),
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
    content += `- 待核实：${report.pendingCount} 条\n`;
    content += `- 处理中：${report.processingCount} 条\n`;
    content += `- 已回应：${report.respondedCount} 条\n\n`;

    content += `## 二、高频问题\n\n`;
    report.highFreqIssues.forEach((issue, index) => {
      content += `${index + 1}. ${CATEGORY_LABELS[issue.category]}（${issue.count}条）\n`;
      issue.examples.forEach(example => {
        content += `   - ${example}\n`;
      });
      content += '\n';
    });

    content += `## 三、领导关注事项\n\n`;
    
    content += `### 3.1 高风险未回应（${report.leaderAttention.highRiskUnresponded.length}件）\n\n`;
    if (report.leaderAttention.highRiskUnresponded.length > 0) {
      report.leaderAttention.highRiskUnresponded.forEach((item, index) => {
        content += `${index + 1}. 【${getScenicLabel(item.scenic)}】${item.title}\n`;
        content += `   平台：${PLATFORM_LABELS[item.platform as keyof typeof PLATFORM_LABELS]}\n`;
        content += `   浏览量：${(item.viewCount / 10000).toFixed(1)}万\n`;
        content += `   说明：${item.description}\n\n`;
      });
    } else {
      content += `暂无高风险未回应事项。\n\n`;
    }

    content += `### 3.2 传播上涨快（${report.leaderAttention.fastSpreading.length}件）\n\n`;
    if (report.leaderAttention.fastSpreading.length > 0) {
      report.leaderAttention.fastSpreading.forEach((item, index) => {
        content += `${index + 1}. ${item.title}\n`;
        content += `   平台：${PLATFORM_LABELS[item.platform as keyof typeof PLATFORM_LABELS]}\n`;
        content += `   浏览量：${(item.viewCount / 10000).toFixed(1)}万\n\n`;
      });
    } else {
      content += `暂无传播速度过快的事件。\n\n`;
    }

    content += `### 3.3 跨部门协调（${report.leaderAttention.crossDept.length}件）\n\n`;
    if (report.leaderAttention.crossDept.length > 0) {
      report.leaderAttention.crossDept.forEach((item, index) => {
        content += `${index + 1}. ${item.title}\n`;
        content += `   说明：${item.description}\n\n`;
      });
    } else {
      content += `暂无需要跨部门协调的事项。\n\n`;
    }

    content += `## 四、已回应事项（${report.respondedItems.length}件）\n\n`;
    if (report.respondedItems.length > 0) {
      report.respondedItems.forEach((item, index) => {
        content += `${index + 1}. ${item.title}\n`;
        content += `   责任部门：${getDepartmentLabel(item.responsibleDept)}\n`;
        content += `   处置人：${item.responder}\n`;
        content += `   处置摘要：${item.dispositionSummary}\n`;
        content += `   回应时间：${item.respondedAt.toLocaleString('zh-CN')}\n\n`;
      });
    } else {
      content += `今日暂无已回应事项。\n\n`;
    }

    content += `## 五、处置说明\n\n`;
    content += `${report.dispositionNote || '暂无'}\n\n`;

    content += `---\n`;
    content += `生成时间：${new Date().toLocaleString('zh-CN')}\n`;

    return content;
  },
}));
