import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useReportStore } from '@/store/useReportStore';
import type { DailyReport } from '@/types/report';
import { CATEGORY_LABELS } from '@/types/event';
import { LEADER_ATTENTION_TYPE_LABELS } from '@/types/report';
import { FileText, Download, Edit3, Check, Loader2 } from 'lucide-react';
import { formatDate, formatDateTime } from '@/utils/date';

interface ReportPreviewProps {
  report: DailyReport | null;
}

export function ReportPreview({ report }: ReportPreviewProps) {
  const { updateDispositionNote, finalizeReport, exportReport } = useReportStore();
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(report?.dispositionNote || '');
  const [isExporting, setIsExporting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const handleSaveNote = () => {
    updateDispositionNote(note);
    setIsEditing(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    const content = exportReport();
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `舆情日报_${formatDate(new Date())}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setTimeout(() => setIsExporting(false), 1000);
  };

  const handleFinalize = async () => {
    setIsFinalizing(true);
    finalizeReport();
    setTimeout(() => setIsFinalizing(false), 1000);
  };

  if (!report) {
    return (
      <Card className="animate-slide-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-tech-blue" />
            日报预览
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="text-center py-12 text-text-muted">
            请先点击"生成日报"按钮
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-tech-blue" />
          日报预览
        </Card.Title>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded ${
            report.status === 'final' 
              ? 'bg-risk-resolved/20 text-risk-resolved border border-risk-resolved/30' 
              : 'bg-risk-low/20 text-risk-low border border-risk-low/30'
          }`}>
            {report.status === 'final' ? '已定稿' : '草稿'}
          </span>
        </div>
      </Card.Header>
      <Card.Content>
        <div className="bg-white/5 rounded-lg p-6 border border-card-border mb-6 max-h-96 overflow-y-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-text-primary mb-2">景区舆情日报</h2>
            <p className="text-sm text-text-muted">{formatDate(report.date)}</p>
          </div>

          <div className="space-y-4">
            <section>
              <h3 className="font-semibold text-text-primary mb-2 border-b border-card-border pb-1">一、数据概览</h3>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li>• 今日舆情总数：<span className="text-tech-blue font-mono">{report.totalEvents}</span> 条</li>
                <li>• 高风险事件：<span className="text-risk-high font-mono">{report.highRiskCount}</span> 条</li>
                <li>• 已处理：<span className="text-risk-resolved font-mono">{report.processedCount}</span> 条</li>
                <li>• 待处理：<span className="text-risk-medium font-mono">{report.pendingCount}</span> 条</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-text-primary mb-2 border-b border-card-border pb-1">二、高频问题</h3>
              <ol className="space-y-2 text-sm text-text-secondary">
                {report.highFreqIssues.map((issue, i) => (
                  <li key={i}>
                    <span className="font-medium">{i + 1}. {CATEGORY_LABELS[issue.category]}（{issue.count}条）</span>
                    <ul className="mt-1 ml-4 space-y-1">
                      {issue.examples.map((ex, j) => (
                        <li key={j} className="text-xs text-text-muted">• {ex}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-text-primary mb-2 border-b border-card-border pb-1">三、领导关注</h3>
              <ol className="space-y-2 text-sm text-text-secondary">
                {report.leaderAttention.map((item, i) => (
                  <li key={i}>
                    <span className="font-medium">{i + 1}. 【{LEADER_ATTENTION_TYPE_LABELS[item.type]}】{item.title}</span>
                    <p className="text-xs text-text-muted mt-1 ml-2">{item.description}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-text-primary mb-2 border-b border-card-border pb-1">四、处置说明</h3>
              {isEditing ? (
                <div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="请输入处置说明..."
                    className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-tech-blue resize-none h-24 mb-2"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                      取消
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSaveNote}>
                      <Check className="w-4 h-4" />
                      保存
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {report.dispositionNote || '暂无处置说明，点击编辑按钮添加'}
                  </p>
                  <button
                    onClick={() => {
                      setNote(report.dispositionNote || '');
                      setIsEditing(true);
                    }}
                    className="absolute top-0 right-0 p-1 text-text-muted hover:text-tech-blue transition-colors"
                    disabled={report.status === 'final'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </section>
          </div>

          <div className="mt-6 pt-4 border-t border-card-border text-right text-xs text-text-muted">
            生成时间：{formatDateTime(report.createdAt)}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                导出中
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                导出日报
              </>
            )}
          </Button>
          {report.status !== 'final' && (
            <Button
              variant="success"
              size="md"
              onClick={handleFinalize}
              disabled={isFinalizing}
            >
              {isFinalizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  定稿中
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  定稿
                </>
              )}
            </Button>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
