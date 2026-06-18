import { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useReportStore } from '@/store/useReportStore';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { Calendar, RefreshCw, FileText, Filter, MapPin, Globe, Clock, User, History, Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { DataSummary } from './DataSummary';
import { HighFreqIssues } from './HighFreqIssues';
import { LeaderAttention } from './LeaderAttention';
import { SupervisionView } from './SupervisionView';
import { ReportPreview } from './ReportPreview';
import { formatDate, formatDateTime } from '@/utils/date';
import { SCENIC_OPTIONS, PLATFORM_OPTIONS, type Platform } from '@/types/event';
import { SHIFT_OPTIONS, type ShiftType } from '@/types/report';
import { SUPERVISION_STATUS_COLORS } from '@/types/workOrder';

export default function DailyReport() {
  const { events, selectedDate } = useDashboardStore();
  const { workOrders } = useWorkOrderStore();
  const { 
    currentReport, 
    generateReport, 
    filter, 
    setFilter,
    shift,
    setShift,
    initAutoRegenerate,
    cleanupAutoRegenerate,
    reportHistory,
    getReportsForDate,
    loadReport,
    deleteReport,
    updateReportMeta,
  } = useReportStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    initAutoRegenerate();
    return () => cleanupAutoRegenerate();
  }, [initAutoRegenerate, cleanupAutoRegenerate]);

  useEffect(() => {
    if (currentReport) {
      const workOrdersObj = { ...workOrders } as any;
      if (workOrdersObj) {
      }
    }
  }, [workOrders, currentReport]);

  const historyReports = useMemo(() => getReportsForDate(selectedDate), [selectedDate, reportHistory, getReportsForDate]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      const workOrdersObj = { ...workOrders } as any;
      generateReport(selectedDate, events, workOrdersObj);
      setIsGenerating(false);
    }, 800);
  };

  const handleScenicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter({ scenic: e.target.value });
  };

  const handlePlatformToggle = (platform: Platform) => {
    const currentPlatforms = filter.platforms || [];
    if (currentPlatforms.includes(platform)) {
      setFilter({ platforms: currentPlatforms.filter(p => p !== platform) });
    } else {
      setFilter({ platforms: [...currentPlatforms, platform] });
    }
  };

  const handleShiftChange = (newShift: ShiftType) => {
    setShift(newShift);
    if (currentReport) {
      setTimeout(() => {
        const workOrdersObj = { ...workOrders } as any;
        generateReport(selectedDate, events, workOrdersObj, currentReport.id);
      }, 50);
    }
  };

  const getFilterLabel = () => {
    const parts = [];
    if (filter.scenic && filter.scenic !== 'all') {
      const scenic = SCENIC_OPTIONS.find(s => s.value === filter.scenic);
      parts.push(scenic?.label || filter.scenic);
    }
    if (filter.platforms && filter.platforms.length > 0) {
      parts.push(filter.platforms.map(p => {
        const plat = PLATFORM_OPTIONS.find(pl => pl.value === p);
        return plat?.label || p;
      }).join('/'));
    }
    return parts.length > 0 ? parts.join(' · ') : '全部';
  };

  return (
    <PageContainer>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary mb-1">日报中心</h1>
          <p className="text-sm text-text-muted flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4" />
            {formatDate(selectedDate)}
            <span className="flex items-center gap-1 ml-2">
              <Clock className="w-3.5 h-3.5" />
              当前班次：
              {SHIFT_OPTIONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => handleShiftChange(s.value)}
                  className={`ml-1 px-2 py-0.5 rounded text-xs transition-all ${
                    shift === s.value
                      ? 'bg-tech-blue/20 text-tech-blue font-medium'
                      : 'text-text-muted hover:text-text-secondary hover:bg-deep-blue-600/30'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </span>
            {currentReport && (
              <span className="text-tech-blue ml-2">
                <Filter className="w-3 h-3 inline mr-1" />
                筛选范围：{getFilterLabel()}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {historyReports.length > 0 && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4" />
              历史记录
              <span className="text-xs ml-1 bg-deep-blue-600 px-1.5 py-0.5 rounded">{historyReports.length}</span>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
          {currentReport && (
            <div className="flex flex-wrap items-center gap-2 bg-deep-blue-600/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-text-muted" />
                <select
                  value={filter.scenic}
                  onChange={handleScenicChange}
                  className="bg-transparent text-sm text-text-primary focus:outline-none cursor-pointer"
                >
                  <option value="all">全部景区</option>
                  {SCENIC_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="w-px h-5 bg-card-border" />
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-text-muted" />
                <div className="flex gap-1">
                  {PLATFORM_OPTIONS.map(p => {
                    const isActive = filter.platforms?.includes(p.value as Platform);
                    return (
                      <button
                        key={p.value}
                        onClick={() => handlePlatformToggle(p.value as Platform)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          isActive
                            ? 'bg-tech-blue/20 text-tech-blue'
                            : 'text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={handleGenerateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                生成中
              </>
            ) : currentReport ? (
              <>
                <RefreshCw className="w-4 h-4" />
                更新统计数据
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                生成今日日报
              </>
            )}
          </Button>
        </div>
      </div>

      {showHistory && historyReports.length > 0 && (
        <Card className="mb-6 animate-slide-in-up">
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <History className="w-4 h-4 text-tech-blue" />
              今日历史交班记录
              <span className="text-xs text-text-muted ml-2">
                （可点击加载继续编辑，或基于上一版补充）
              </span>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {historyReports.map(report => {
                const isCurrent = currentReport?.id === report.id;
                const supervisionCount = 
                  report.supervision.needReport.length + 
                  report.supervision.reported.length + 
                  report.supervision.leaderCommented.length;
                
                return (
                  <div
                    key={report.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer group ${
                      isCurrent
                        ? 'border-tech-blue bg-tech-blue/10'
                        : 'border-card-border bg-deep-blue-600/30 hover:bg-deep-blue-600/50 hover:border-tech-blue/50'
                    }`}
                    onClick={() => loadReport(report.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-tech-blue/20 text-tech-blue text-xs rounded font-medium">
                          {report.shiftLabel}
                        </span>
                        {report.status === 'final' ? (
                          <span className="px-2 py-0.5 bg-risk-resolved/20 text-risk-resolved text-xs rounded">
                            已定稿
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-risk-medium/20 text-risk-medium text-xs rounded">
                            草稿
                          </span>
                        )}
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-tech-blue/30 text-tech-blue text-xs rounded animate-pulse">
                            当前查看
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const workOrdersObj = { ...workOrders } as any;
                            generateReport(selectedDate, events, workOrdersObj, report.id);
                          }}
                          className="p-1.5 rounded hover:bg-deep-blue-600 text-text-muted hover:text-tech-blue transition-colors"
                          title="基于此版本继续编辑"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('确定要删除这份交班记录吗？')) {
                              deleteReport(report.id);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-risk-high/10 text-text-muted hover:text-risk-high transition-colors"
                          title="删除此记录"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium text-text-primary mb-2 line-clamp-1">
                      {report.totalEvents}条舆情 · {report.respondedItems.length}条已回应
                      {supervisionCount > 0 && (
                        <span className="text-risk-high ml-1">（{supervisionCount}项督办）</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(report.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 max-w-[40%]">
                        {report.onDutyPerson && (
                          <>
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{report.onDutyPerson}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {report.finalizedAt && (
                      <div className="mt-2 pt-2 border-t border-card-border text-[10px] text-risk-resolved flex items-center gap-1">
                        ✓ 定稿于 {formatDateTime(report.finalizedAt)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card.Content>
        </Card>
      )}

      {currentReport && (
        <Card className="mb-6 animate-slide-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <Card.Content className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5 flex items-center gap-1">
                <User className="w-3 h-3" />
                值班人
              </label>
              <input
                type="text"
                value={currentReport.onDutyPerson}
                onChange={(e) => updateReportMeta({ onDutyPerson: e.target.value })}
                placeholder="请输入值班人姓名"
                className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-tech-blue"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5 flex items-center gap-1">
                <User className="w-3 h-3" />
                交接给（下一班）
              </label>
              <input
                type="text"
                value={currentReport.handoverTo}
                onChange={(e) => updateReportMeta({ handoverTo: e.target.value })}
                placeholder="请输入接班人姓名"
                className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-tech-blue"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">
                💡 上班遗留问题（需要下一班关注）
              </label>
              <input
                type="text"
                value={currentReport.previousIssues}
                onChange={(e) => updateReportMeta({ previousIssues: e.target.value })}
                placeholder="简述需要下一班继续跟进的事项..."
                className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-tech-blue"
              />
            </div>
          </Card.Content>
        </Card>
      )}

      <DataSummary report={currentReport} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <HighFreqIssues report={currentReport} />
        <LeaderAttention report={currentReport} />
      </div>

      <div className="mb-6">
        <SupervisionView report={currentReport} />
      </div>

      <ReportPreview report={currentReport} />
    </PageContainer>
  );
}
