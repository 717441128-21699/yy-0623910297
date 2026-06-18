import { create } from 'zustand';
import type { DailyReport, HighFreqIssue, LeaderAttentionGroup, LeaderAttentionItem, RespondedItem, WorkOrderSummaryItem, SupervisionGroup, SupervisionItem, ReportFilter } from '@/types/report';
import type { Event, RiskCategory, Platform } from '@/types/event';
import type { WorkOrder, SupervisionStatus } from '@/types/workOrder';
import { CATEGORY_LABELS, PLATFORM_LABELS, SCENIC_OPTIONS } from '@/types/event';
import { DEPARTMENT_OPTIONS, SUPERVISION_STATUS_LABELS } from '@/types/workOrder';
import { useWorkOrderStore } from './useWorkOrderStore';
import { mockEvents } from '@/data/mockEvents';

interface ReportState {
  currentReport: DailyReport | null;
  filter: ReportFilter;
  setFilter: (filter: Partial<ReportFilter>) => void;
  generateReport: (date: Date, events: Event[], workOrders: Record<string, WorkOrder>) => DailyReport;
  regenerateReport: () => void;
  updateDispositionNote: (note: string) => void;
  finalizeReport: () => void;
  exportReport: () => string;
  _autoRegenerateUnsubscribe?: () => void;
  initAutoRegenerate: () => void;
  cleanupAutoRegenerate: () => void;
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
        supervisionStatus: wo?.supervisionStatus || 'none',
      });
    }
  });

  const sortedByViews = [...events].sort((a, b) => b.viewCount - a.viewCount);
  const topEvents = sortedByViews.slice(0, 5);
  
  topEvents.forEach(event => {
    if (event.viewCount > 50000) {
      const wo = workOrders[event.id];
      fastSpreading.push({
        eventId: event.id,
        title: event.title,
        description: `浏览量${(event.viewCount / 10000).toFixed(1)}万，传播速度快，需密切关注`,
        level: event.riskLevel,
        viewCount: event.viewCount,
        spreadSpeed: Math.floor(event.viewCount / 1000),
        scenic: event.scenic,
        platform: event.platform,
        supervisionStatus: wo?.supervisionStatus || 'none',
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
            supervisionStatus: wo?.supervisionStatus || 'none',
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

function generateSupervision(events: Event[], workOrders: Record<string, WorkOrder>): SupervisionGroup {
  const needReport: SupervisionItem[] = [];
  const reported: SupervisionItem[] = [];
  const leaderCommented: SupervisionItem[] = [];

  events.forEach(event => {
    const wo = workOrders[event.id];
    if (!wo) return;

    const item: SupervisionItem = {
      eventId: event.id,
      title: event.title,
      level: event.riskLevel,
      viewCount: event.viewCount,
      scenic: event.scenic,
      platform: event.platform,
      supervisionStatus: wo.supervisionStatus,
      reportTime: wo.reportTime,
      leaderComment: wo.leaderComment,
      leaderFeedbackDeadline: wo.leaderFeedbackDeadline,
      responsibleDept: wo.responsibleDept || '未指派',
      handler: wo.handler || '未指定',
    };

    if (wo.supervisionStatus === 'needReport') {
      needReport.push(item);
    } else if (wo.supervisionStatus === 'reported') {
      reported.push(item);
    } else if (wo.supervisionStatus === 'leaderCommented') {
      leaderCommented.push(item);
    }
  });

  const sortFn = (a: SupervisionItem, b: SupervisionItem) => {
    const levelOrder = { high: 0, medium: 1, low: 2, resolved: 3 };
    if (levelOrder[a.level] !== levelOrder[b.level]) {
      return levelOrder[a.level] - levelOrder[b.level];
    }
    return b.viewCount - a.viewCount;
  };

  return {
    needReport: needReport.sort(sortFn),
    reported: reported.sort(sortFn),
    leaderCommented: leaderCommented.sort(sortFn),
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
        supervisionStatus: wo.supervisionStatus,
        leaderComment: wo.leaderComment,
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
        supervisionStatus: wo.supervisionStatus,
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

function filterEventsByReportFilter(events: Event[], filter: ReportFilter): Event[] {
  return events.filter(event => {
    if (filter.scenic && filter.scenic !== 'all' && event.scenic !== filter.scenic) {
      return false;
    }
    if (filter.platforms && filter.platforms.length > 0 && !filter.platforms.includes(event.platform as Platform)) {
      return false;
    }
    return true;
  });
}

export const useReportStore = create<ReportState>((set, get) => ({
  currentReport: null,
  filter: {
    scenic: 'all',
    platforms: [],
  },

  setFilter: (newFilter) => {
    set((state) => ({
      filter: { ...state.filter, ...newFilter },
    }));
    get().regenerateReport();
  },

  generateReport: (date, events, workOrders) => {
    const filter = get().filter;
    const filteredEvents = filterEventsByReportFilter(events, filter);
    
    const highRiskCount = filteredEvents.filter(e => e.riskLevel === 'high').length;
    
    const eventIds = filteredEvents.map(e => e.id);
    let pendingCount = 0;
    let processingCount = 0;
    let respondedCount = 0;

    eventIds.forEach(eventId => {
      const wo = workOrders[eventId];
      if (wo) {
        if (wo.status === 'pending') pendingCount++;
        else if (wo.status === 'processing') processingCount++;
        else if (wo.status === 'responded') respondedCount++;
      } else {
        pendingCount++;
      }
    });

    const report: DailyReport = {
      id: `report-${date.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
      date,
      filter: { ...filter },
      totalEvents: filteredEvents.length,
      highRiskCount,
      pendingCount,
      processingCount,
      respondedCount,
      highFreqIssues: generateHighFreqIssues(filteredEvents),
      leaderAttention: generateLeaderAttention(filteredEvents, workOrders),
      supervision: generateSupervision(filteredEvents, workOrders),
      respondedItems: generateRespondedItems(filteredEvents, workOrders),
      processingItems: generateWorkOrderSummaryItems(filteredEvents, workOrders, 'processing'),
      pendingItems: generateWorkOrderSummaryItems(filteredEvents, workOrders, 'pending'),
      dispositionNote: get().currentReport?.dispositionNote || '',
      status: 'draft',
      createdAt: new Date(),
    };

    set({ currentReport: report });
    return report;
  },

  regenerateReport: () => {
    const { currentReport, filter } = get();
    if (!currentReport) return;

    const workOrders = useWorkOrderStore.getState().workOrders;
    get().generateReport(currentReport.date, mockEvents, workOrders);
  },

  initAutoRegenerate: () => {
    const existingUnsub = get()._autoRegenerateUnsubscribe;
    if (existingUnsub) {
      existingUnsub();
    }

    const unsubscribe = useWorkOrderStore.subscribe(() => {
      if (get().currentReport) {
        get().regenerateReport();
      }
    });

    set({ _autoRegenerateUnsubscribe: unsubscribe });
  },

  cleanupAutoRegenerate: () => {
    const unsub = get()._autoRegenerateUnsubscribe;
    if (unsub) {
      unsub();
      set({ _autoRegenerateUnsubscribe: undefined });
    }
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
    const filter = report.filter;
    let filterStr = '';
    if (filter.scenic && filter.scenic !== 'all') {
      filterStr += `【${getScenicLabel(filter.scenic)}】`;
    }
    if (filter.platforms && filter.platforms.length > 0) {
      filterStr += `【${filter.platforms.map(p => PLATFORM_LABELS[p]).join('/')}】`;
    }

    let content = `# 景区舆情交班日报 - ${dateStr}${filterStr}\n\n`;

    if (filterStr) {
      content += `> 筛选范围：${filterStr.replace(/【/g, '').replace(/】/g, ' / ').replace(/\/ $/, '')}\n\n`;
    }

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

    content += `## 三、重点督办事项\n\n`;

    content += `### 3.1 需要报领导（${report.supervision.needReport.length}件）\n\n`;
    if (report.supervision.needReport.length > 0) {
      report.supervision.needReport.forEach((item, index) => {
        content += `${index + 1}. 【${getScenicLabel(item.scenic)}】${item.title}\n`;
        content += `   平台：${PLATFORM_LABELS[item.platform as keyof typeof PLATFORM_LABELS]}\n`;
        content += `   浏览量：${(item.viewCount / 10000).toFixed(1)}万\n`;
        content += `   责任部门：${getDepartmentLabel(item.responsibleDept)}\n`;
        content += `   处置人：${item.handler}\n`;
        if (item.reportTime) {
          content += `   上报时间：${item.reportTime.toLocaleString('zh-CN')}\n`;
        }
        content += '\n';
      });
    } else {
      content += `暂无需要报领导的事项。\n\n`;
    }

    content += `### 3.2 已上报（${report.supervision.reported.length}件）\n\n`;
    if (report.supervision.reported.length > 0) {
      report.supervision.reported.forEach((item, index) => {
        content += `${index + 1}. 【${getScenicLabel(item.scenic)}】${item.title}\n`;
        content += `   平台：${PLATFORM_LABELS[item.platform as keyof typeof PLATFORM_LABELS]}\n`;
        content += `   浏览量：${(item.viewCount / 10000).toFixed(1)}万\n`;
        content += `   责任部门：${getDepartmentLabel(item.responsibleDept)}\n`;
        content += `   处置人：${item.handler}\n`;
        if (item.reportTime) {
          content += `   上报时间：${item.reportTime.toLocaleString('zh-CN')}\n`;
        }
        content += '\n';
      });
    } else {
      content += `暂无已上报待批示的事项。\n\n`;
    }

    content += `### 3.3 领导已批示（${report.supervision.leaderCommented.length}件）\n\n`;
    if (report.supervision.leaderCommented.length > 0) {
      report.supervision.leaderCommented.forEach((item, index) => {
        content += `${index + 1}. 【${getScenicLabel(item.scenic)}】${item.title}\n`;
        content += `   平台：${PLATFORM_LABELS[item.platform as keyof typeof PLATFORM_LABELS]}\n`;
        content += `   浏览量：${(item.viewCount / 10000).toFixed(1)}万\n`;
        content += `   责任部门：${getDepartmentLabel(item.responsibleDept)}\n`;
        content += `   处置人：${item.handler}\n`;
        if (item.leaderComment) {
          content += `   领导批示：${item.leaderComment}\n`;
        }
        if (item.leaderFeedbackDeadline) {
          content += `   反馈截止时间：${item.leaderFeedbackDeadline.toLocaleString('zh-CN')}\n`;
        }
        content += '\n';
      });
    } else {
      content += `暂无领导批示的事项。\n\n`;
    }

    content += `## 四、领导关注事项\n\n`;
    
    content += `### 4.1 高风险未回应（${report.leaderAttention.highRiskUnresponded.length}件）\n\n`;
    if (report.leaderAttention.highRiskUnresponded.length > 0) {
      report.leaderAttention.highRiskUnresponded.forEach((item, index) => {
        content += `${index + 1}. 【${getScenicLabel(item.scenic)}】${item.title}\n`;
        content += `   平台：${PLATFORM_LABELS[item.platform as keyof typeof PLATFORM_LABELS]}\n`;
        content += `   浏览量：${(item.viewCount / 10000).toFixed(1)}万\n`;
        content += `   督办状态：${SUPERVISION_STATUS_LABELS[item.supervisionStatus]}\n`;
        content += `   说明：${item.description}\n\n`;
      });
    } else {
      content += `暂无高风险未回应事项。\n\n`;
    }

    content += `### 4.2 传播上涨快（${report.leaderAttention.fastSpreading.length}件）\n\n`;
    if (report.leaderAttention.fastSpreading.length > 0) {
      report.leaderAttention.fastSpreading.forEach((item, index) => {
        content += `${index + 1}. ${item.title}\n`;
        content += `   平台：${PLATFORM_LABELS[item.platform as keyof typeof PLATFORM_LABELS]}\n`;
        content += `   浏览量：${(item.viewCount / 10000).toFixed(1)}万\n\n`;
      });
    } else {
      content += `暂无传播速度过快的事件。\n\n`;
    }

    content += `## 五、已回应事项（${report.respondedItems.length}件）\n\n`;
    if (report.respondedItems.length > 0) {
      report.respondedItems.forEach((item, index) => {
        content += `${index + 1}. ${item.title}\n`;
        content += `   责任部门：${getDepartmentLabel(item.responsibleDept)}\n`;
        content += `   处置人：${item.responder}\n`;
        content += `   处置摘要：${item.dispositionSummary}\n`;
        if (item.leaderComment) {
          content += `   领导批示：${item.leaderComment}\n`;
        }
        content += `   回应时间：${item.respondedAt.toLocaleString('zh-CN')}\n\n`;
      });
    } else {
      content += `今日暂无已回应事项。\n\n`;
    }

    content += `## 六、处置说明\n\n`;
    content += `${report.dispositionNote || '暂无'}\n\n`;

    content += `---\n`;
    content += `生成时间：${new Date().toLocaleString('zh-CN')}\n`;

    return content;
  },
}));
