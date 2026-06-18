import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { useReportStore } from '@/store/useReportStore';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { Calendar, RefreshCw, FileText, Filter, MapPin, Globe } from 'lucide-react';
import { DataSummary } from './DataSummary';
import { HighFreqIssues } from './HighFreqIssues';
import { LeaderAttention } from './LeaderAttention';
import { SupervisionView } from './SupervisionView';
import { ReportPreview } from './ReportPreview';
import { formatDate } from '@/utils/date';
import { SCENIC_OPTIONS, PLATFORM_OPTIONS, type Platform } from '@/types/event';

export default function DailyReport() {
  const { events, selectedDate } = useDashboardStore();
  const { workOrders } = useWorkOrderStore();
  const { 
    currentReport, 
    generateReport, 
    filter, 
    setFilter,
    initAutoRegenerate,
    cleanupAutoRegenerate
  } = useReportStore();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    initAutoRegenerate();
    return () => cleanupAutoRegenerate();
  }, [initAutoRegenerate, cleanupAutoRegenerate]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      generateReport(selectedDate, events, workOrders);
      setIsGenerating(false);
    }, 1000);
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
          <p className="text-sm text-text-muted flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(selectedDate)}
            {currentReport && (
              <span className="text-tech-blue ml-2">
                <Filter className="w-3 h-3 inline mr-1" />
                筛选范围：{getFilterLabel()}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
            ) : (
              <>
                <FileText className="w-4 h-4" />
                {currentReport ? '重新生成日报' : '生成今日日报'}
              </>
            )}
          </Button>
        </div>
      </div>

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
