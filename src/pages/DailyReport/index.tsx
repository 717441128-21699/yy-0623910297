import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { useReportStore } from '@/store/useReportStore';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { Calendar, RefreshCw, FileText } from 'lucide-react';
import { DataSummary } from './DataSummary';
import { HighFreqIssues } from './HighFreqIssues';
import { LeaderAttention } from './LeaderAttention';
import { ReportPreview } from './ReportPreview';
import { formatDate } from '@/utils/date';

export default function DailyReport() {
  const { events, selectedDate } = useDashboardStore();
  const { workOrders } = useWorkOrderStore();
  const { currentReport, generateReport } = useReportStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      generateReport(selectedDate, events, workOrders);
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary mb-1">日报中心</h1>
          <p className="text-sm text-text-muted flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(selectedDate)}
          </p>
        </div>
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

      <DataSummary report={currentReport} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <HighFreqIssues report={currentReport} />
        <LeaderAttention report={currentReport} />
      </div>

      <ReportPreview report={currentReport} />
    </PageContainer>
  );
}
