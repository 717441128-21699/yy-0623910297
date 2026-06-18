import { create } from 'zustand';
import type { DailyReport, HighFreqIssue, LeaderAttentionGroup, LeaderAttentionItem, RespondedItem, WorkOrderSummaryItem, SupervisionGroup, SupervisionItem, ReportFilter, ShiftType } from '@/types/report';
import { SHIFT_OPTIONS } from '@/types/report';
import type { Event, RiskCategory, Platform } from '@/types/event';
import type { WorkOrder, SupervisionStatus } from '@/types/workOrder';
import { CATEGORY_LABELS, PLATFORM_LABELS, SCENIC_OPTIONS } from '@/types/event';
import { DEPARTMENT_OPTIONS, SUPERVISION_STATUS_LABELS } from '@/types/workOrder';
import { useWorkOrderStore } from './useWorkOrderStore';
import { mockEvents } from '@/data/mockEvents';

const REPORTS_STORAGE_KEY = 'sentinal_reports_history';

function deserializeReportDates(reports: DailyReport[]): DailyReport[] {
  return reports.map(report => {
    const result: any = { ...report };
    const dateFields = ['date', 'createdAt', 'finalizedAt'];
    
    dateFields.forEach(field => {
      if (result[field]) {
        result[field] = new Date(result[field]);
      }
    });

    if (report.highFreqIssues) {
      result.highFreqIssues = report.highFreqIssues;
    }

    const deserializeItemDates = (items: any[]) => {
      if (!items) return items;
      return items.map(item => {
        const r: any = { ...item };
        if (r.respondedAt) r.respondedAt = new Date(r.respondedAt);
        if (r.expectedFeedbackTime) r.expectedFeedbackTime = new Date(r.expectedFeedbackTime);
        if (r.reportTime) r.reportTime = new Date(r.reportTime);
        if (r.leaderFeedbackDeadline) r.leaderFeedbackDeadline = new Date(r.leaderFeedbackDeadline);
        if (r.feedbackTime) r.feedbackTime = new Date(r.feedbackTime);
        if (r.closeTime) r.closeTime = new Date(r.closeTime);
        return r;
      });
    };

    if (report.supervision) {
      result.supervision = {
        needReport: deserializeItemDates(report.supervision.needReport),
        reported: deserializeItemDates(report.supervision.reported),
        leaderCommented: deserializeItemDates(report.supervision.leaderCommented),
        feedbackSubmitted: deserializeItemDates(report.supervision.feedbackSubmitted || []),
        closed: deserializeItemDates(report.supervision.closed || []),
      };
    }

    if (report.respondedItems) {
      result.respondedItems = deserializeItemDates(report.respondedItems);
    }
    if (report.processingItems) {
      result.processingItems = deserializeItemDates(report.processingItems);
    }
    if (report.pendingItems) {
      result.pendingItems = deserializeItemDates(report.pendingItems);
    }
    if (report.leaderAttention) {
      result.leaderAttention = {
        highRiskUnresponded: report.leaderAttention.highRiskUnresponded,
        fastSpreading: report.leaderAttention.fastSpreading,
        crossDept: report.leaderAttention.crossDept,
      };
    }

    return result as DailyReport;
  });
}

function loadReportHistory(): DailyReport[] {
  try {
    const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return deserializeReportDates(parsed);
      }
    }
  } catch (e) {
    console.error('Failed to load report history:', e);
  }
  return [];
}

function saveReportHistory(reports: DailyReport[]): void {
  try {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save report history:', e);
  }
}

interface ReportState {
  currentReport: DailyReport | null;
  reportHistory: DailyReport[];
  filter: ReportFilter;
  shift: ShiftType;
  setFilter: (filter: Partial<ReportFilter>) => void;
  setShift: (shift: ShiftType) => void;
  loadReport: (reportId: string) => void;
  saveCurrentReport: () => void;
  deleteReport: (reportId: string) => void;
  getReportsForDate: (date: Date) => DailyReport[];
  generateReport: (date: Date, events: Event[], workOrders: Record<string, WorkOrder>, basedOnReportId?: string) => DailyReport;
  regenerateReport: () => void;
  updateDispositionNote: (note: string) => void;
  updateReportMeta: (meta: Partial<Pick<DailyReport, 'onDutyPerson' | 'handoverTo' | 'previousIssues'>>) => void;
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
  const feedbackSubmitted: SupervisionItem[] = [];
  const closed: SupervisionItem[] = [];

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
      rectificationFeedback: wo.rectificationFeedback,
      feedbackPerson: wo.feedbackPerson,
      feedbackTime: wo.feedbackTime,
      closeTime: wo.closeTime,
      closer: wo.closer,
      responsibleDept: wo.responsibleDept || '未指派',
      handler: wo.handler || '未指定',
    };

    if (wo.supervisionStatus === 'needReport') {
      needReport.push(item);
    } else if (wo.supervisionStatus === 'reported') {
      reported.push(item);
    } else if (wo.supervisionStatus === 'leaderCommented') {
      leaderCommented.push(item);
    } else if (wo.supervisionStatus === 'feedbackSubmitted') {
      feedbackSubmitted.push(item);
    } else if (wo.supervisionStatus === 'closed') {
      closed.push(item);
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
    feedbackSubmitted: feedbackSubmitted.sort(sortFn),
    closed: closed.sort((a, b) => {
      if (a.closeTime && b.closeTime) {
        return b.closeTime.getTime() - a.closeTime.getTime();
      }
      return sortFn(a, b);
    }),
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
        rectificationFeedback: wo.rectificationFeedback,
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

function getCurrentShift(): ShiftType {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 14) return 'morning';
  if (hour >= 14 && hour < 20) return 'afternoon';
  return 'evening';
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

function normalizeDate(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const useReportStore = create<ReportState>((set, get) => ({
  currentReport: null,
  reportHistory: loadReportHistory(),
  filter: {
    scenic: 'all',
    platforms: [],
  },
  shift: getCurrentShift(),

  setShift: (shift) => {
    set({ shift });
  },

  setFilter: (newFilter) => {
    set((state) => ({
      filter: { ...state.filter, ...newFilter },
    }));
    if (get().currentReport) {
      get().regenerateReport();
    }
  },

  loadReport: (reportId) => {
    const { reportHistory } = get();
    const report = reportHistory.find(r => r.id === reportId);
    if (report) {
      set({ 
        currentReport: report,
        filter: { ...report.filter },
        shift: report.shift,
      });
    }
  },

  saveCurrentReport: () => {
    const { currentReport, reportHistory } = get();
    if (!currentReport) return;

    const reportToSave = { ...currentReport, updatedAt: new Date() };
    
    const existingIndex = reportHistory.findIndex(r => r.id === currentReport.id);
    let newHistory: DailyReport[];
    
    if (existingIndex >= 0) {
      newHistory = [...reportHistory];
      newHistory[existingIndex] = reportToSave;
    } else {
      newHistory = [...reportHistory, reportToSave];
    }

    saveReportHistory(newHistory);
    set({ reportHistory: newHistory, currentReport: reportToSave });
  },

  deleteReport: (reportId) => {
    const { reportHistory, currentReport } = get();
    const newHistory = reportHistory.filter(r => r.id !== reportId);
    saveReportHistory(newHistory);
    set({
      reportHistory: newHistory,
      currentReport: currentReport?.id === reportId ? null : currentReport,
    });
  },

  getReportsForDate: (date) => {
    const dateStr = normalizeDate(date);
    return get().reportHistory
      .filter(r => normalizeDate(r.date) === dateStr)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  generateReport: (date, events, workOrders, basedOnReportId) => {
    const filter = get().filter;
    const shift = get().shift;
    const filteredEvents = filterEventsByReportFilter(events, filter);
    const shiftOption = SHIFT_OPTIONS.find(s => s.value === shift) || SHIFT_OPTIONS[2];
    
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

    const existingReport = get().currentReport;
    const isSameDateShift = 
      existingReport && 
      normalizeDate(existingReport.date) === normalizeDate(date) &&
      existingReport.shift === shift;

    const reportId = isSameDateShift 
      ? existingReport.id 
      : `report-${date.getTime()}-${shift}-${Math.random().toString(36).substr(2, 9)}`;

    const basedOnReport = basedOnReportId 
      ? get().reportHistory.find(r => r.id === basedOnReportId)
      : null;

    const report: DailyReport = {
      id: reportId,
      date,
      shift,
      shiftLabel: shiftOption.label,
      shiftTimeRange: shiftOption.timeRange,
      onDutyPerson: existingReport?.onDutyPerson || basedOnReport?.onDutyPerson || '',
      handoverTo: existingReport?.handoverTo || basedOnReport?.handoverTo || '',
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
      dispositionNote: existingReport?.dispositionNote || basedOnReport?.dispositionNote || '',
      previousIssues: existingReport?.previousIssues || basedOnReport?.previousIssues || '',
      status: isSameDateShift ? existingReport.status : 'draft',
      createdAt: isSameDateShift ? existingReport.createdAt : new Date(),
      finalizedAt: isSameDateShift ? existingReport.finalizedAt : undefined,
      basedOnReportId: basedOnReportId || undefined,
    };

    set({ currentReport: report });
    get().saveCurrentReport();
    return report;
  },

  regenerateReport: () => {
    const { currentReport } = get();
    if (!currentReport) return;

    const workOrders = useWorkOrderStore.getState().workOrders;
    const workOrdersObj = { ...workOrders } as Record<string, WorkOrder>;
    const filter = get().filter;
    const shift = get().shift;
    const filteredEvents = filterEventsByReportFilter(mockEvents, filter);
    const shiftOption = SHIFT_OPTIONS.find(s => s.value === shift) || SHIFT_OPTIONS[2];
    
    const highRiskCount = filteredEvents.filter(e => e.riskLevel === 'high').length;
    
    const eventIds = filteredEvents.map(e => e.id);
    let pendingCount = 0;
    let processingCount = 0;
    let respondedCount = 0;

    eventIds.forEach(eventId => {
      const wo = workOrdersObj[eventId];
      if (wo) {
        if (wo.status === 'pending') pendingCount++;
        else if (wo.status === 'processing') processingCount++;
        else if (wo.status === 'responded') respondedCount++;
      } else {
        pendingCount++;
      }
    });

    const updatedReport: DailyReport = {
      ...currentReport,
      shift,
      shiftLabel: shiftOption.label,
      shiftTimeRange: shiftOption.timeRange,
      filter: { ...filter },
      totalEvents: filteredEvents.length,
      highRiskCount,
      pendingCount,
      processingCount,
      respondedCount,
      highFreqIssues: generateHighFreqIssues(filteredEvents),
      leaderAttention: generateLeaderAttention(filteredEvents, workOrdersObj),
      supervision: generateSupervision(filteredEvents, workOrdersObj),
      respondedItems: generateRespondedItems(filteredEvents, workOrdersObj),
      processingItems: generateWorkOrderSummaryItems(filteredEvents, workOrdersObj, 'processing'),
      pendingItems: generateWorkOrderSummaryItems(filteredEvents, workOrdersObj, 'pending'),
    };

    set({ currentReport: updatedReport });
    get().saveCurrentReport();
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
    setTimeout(() => get().saveCurrentReport(), 100);
  },

  updateReportMeta: (meta) => {
    set((state) => {
      if (!state.currentReport) return state;
      return {
        currentReport: {
          ...state.currentReport,
          ...meta,
        },
      };
    });
    setTimeout(() => get().saveCurrentReport(), 100);
  },

  finalizeReport: () => {
    set((state) => {
      if (!state.currentReport) return state;
      return {
        currentReport: {
          ...state.currentReport,
          status: 'final',
          finalizedAt: new Date(),
        },
      };
    });
    setTimeout(() => get().saveCurrentReport(), 100);
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

    let content = `# 景区舆情交班日报 - ${dateStr} ${report.shiftLabel}${filterStr}\n\n`;
    content += `> 交班时段：${report.shiftTimeRange}\n`;
    if (report.onDutyPerson) content += `> 值班人：${report.onDutyPerson}\n`;
    if (report.handoverTo) content += `> 交接给：${report.handoverTo}\n`;

    if (filterStr) {
      content += `> 筛选范围：${filterStr.replace(/【/g, '').replace(/】/g, ' / ').replace(/\/ $/, '')}\n`;
    }
    content += '\n';

    if (report.previousIssues) {
      content += `## ★ 上班遗留问题\n\n${report.previousIssues}\n\n`;
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

    const totalSupervision = 
      report.supervision.needReport.length + 
      report.supervision.reported.length + 
      report.supervision.leaderCommented.length + 
      report.supervision.feedbackSubmitted.length +
      report.supervision.closed.length;

    if (totalSupervision > 0) {
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

      content += `### 3.3 待整改反馈（${report.supervision.leaderCommented.length}件）\n\n`;
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
            content += `   要求反馈：${item.leaderFeedbackDeadline.toLocaleString('zh-CN')}\n`;
          }
          content += '\n';
        });
      } else {
        content += `暂无待整改反馈的事项。\n\n`;
      }

      content += `### 3.4 整改已反馈（${report.supervision.feedbackSubmitted.length}件）\n\n`;
      if (report.supervision.feedbackSubmitted.length > 0) {
        report.supervision.feedbackSubmitted.forEach((item, index) => {
          content += `${index + 1}. 【${getScenicLabel(item.scenic)}】${item.title}\n`;
          content += `   平台：${PLATFORM_LABELS[item.platform as keyof typeof PLATFORM_LABELS]}\n`;
          content += `   责任部门：${getDepartmentLabel(item.responsibleDept)}\n`;
          content += `   反馈人：${item.feedbackPerson || '未填写'}\n`;
          if (item.rectificationFeedback) {
            content += `   整改反馈：${item.rectificationFeedback}\n`;
          }
          if (item.feedbackTime) {
            content += `   反馈时间：${item.feedbackTime.toLocaleString('zh-CN')}\n`;
          }
          content += '\n';
        });
      } else {
        content += `暂无整改已反馈的事项。\n\n`;
      }

      content += `### 3.5 督办办结（${report.supervision.closed.length}件）\n\n`;
      if (report.supervision.closed.length > 0) {
        report.supervision.closed.forEach((item, index) => {
          content += `${index + 1}. 【${getScenicLabel(item.scenic)}】${item.title}\n`;
          content += `   平台：${PLATFORM_LABELS[item.platform as keyof typeof PLATFORM_LABELS]}\n`;
          content += `   责任部门：${getDepartmentLabel(item.responsibleDept)}\n`;
          if (item.rectificationFeedback) {
            content += `   整改反馈：${item.rectificationFeedback}\n`;
          }
          if (item.closer) {
            content += `   办结人：${item.closer}\n`;
          }
          if (item.closeTime) {
            content += `   办结时间：${item.closeTime.toLocaleString('zh-CN')}\n`;
          }
          content += '\n';
        });
      } else {
        content += `暂无办结的督办事项。\n\n`;
      }
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
        if (item.rectificationFeedback) {
          content += `   整改反馈：${item.rectificationFeedback}\n`;
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
    if (report.finalizedAt) {
      content += `定稿时间：${report.finalizedAt.toLocaleString('zh-CN')}\n`;
    }

    return content;
  },
}));
