import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useReportStore } from '@/store/useReportStore';
import type { DailyReport } from '@/types/report';
import { CATEGORY_LABELS } from '@/types/event';
import { DEPARTMENT_OPTIONS } from '@/types/workOrder';
import { FileText, Download, Edit3, Check, Loader2, CheckCircle, Clock, AlertTriangle, AlertCircle, Lock, FileCheck } from 'lucide-react';
import { formatDate, formatDateTime } from '@/utils/date';
import { useNavigate } from 'react-router-dom';

interface ReportPreviewProps {
  report: DailyReport | null;
}

export function ReportPreview({ report }: ReportPreviewProps) {
  const { updateDispositionNote, finalizeReport, exportReport } = useReportStore();
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(report?.dispositionNote || '');
  const [isExporting, setIsExporting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const navigate = useNavigate();

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

  const getDeptLabel = (value: string) => {
    const dept = DEPARTMENT_OPTIONS.find(d => d.value === value);
    return dept ? dept.label : value;
  };

  const handleViewEvent = (eventId: string) => {
    navigate(`/event/${eventId}`);
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
          <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
            report.status === 'final' 
              ? 'bg-risk-resolved/20 text-risk-resolved border border-risk-resolved/30' 
              : 'bg-risk-low/20 text-risk-low border border-risk-low/30'
          }`}>
            {report.status === 'final' ? (
              <>
                <Lock className="w-3 h-3" />
                已定稿
              </>
            ) : (
              <>
                <FileCheck className="w-3 h-3" />
                草稿
              </>
            )}
          </span>
        </div>
      </Card.Header>
      <Card.Content>
        <div className="bg-white/5 rounded-lg p-6 border border-card-border mb-6 max-h-[500px] overflow-y-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-text-primary mb-2">景区舆情日报</h2>
            <p className="text-sm text-text-muted">{formatDate(report.date)}</p>
          </div>

          <div className="space-y-6">
            {report.deadlineBoard && (report.deadlineBoard.overdue.length > 0 || report.deadlineBoard.upcoming.length > 0 || report.deadlineBoard.feedbackPending.length > 0) && (
              <section className="mb-6">
                <h3 className="font-semibold text-text-primary mb-3 border-b border-card-border pb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-risk-high" />
                  ⚠ 督办时限提醒
                </h3>
                <div className="space-y-2">
                  {report.deadlineBoard.overdue.length > 0 && (
                    <div className="bg-risk-high/10 border border-risk-high/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-risk-high font-medium mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        已逾期（{report.deadlineBoard.overdue.length}件）
                      </div>
                      <div className="space-y-1">
                        {report.deadlineBoard.overdue.slice(0, 3).map((item, i) => (
                          <div key={i} className="text-sm text-text-secondary flex items-start gap-2">
                            <span className="text-risk-high font-mono text-xs mt-0.5">{item.daysOverdue}天</span>
                            <span className="line-clamp-1">{item.title}</span>
                            <span className="text-text-muted text-xs flex-shrink-0">- {getDeptLabel(item.responsibleDept)}</span>
                          </div>
                        ))}
                        {report.deadlineBoard.overdue.length > 3 && (
                          <p className="text-xs text-text-muted">还有 {report.deadlineBoard.overdue.length - 3} 项逾期事项...</p>
                        )}
                      </div>
                    </div>
                  )}
                  {report.deadlineBoard.upcoming.length > 0 && (
                    <div className="bg-risk-medium/10 border border-risk-medium/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-risk-medium font-medium mb-2">
                        <Clock className="w-4 h-4" />
                        即将到期（3天内，{report.deadlineBoard.upcoming.length}件）
                      </div>
                      <div className="space-y-1">
                        {report.deadlineBoard.upcoming.slice(0, 3).map((item, i) => (
                          <div key={i} className="text-sm text-text-secondary flex items-start gap-2">
                            <span className="text-risk-medium font-mono text-xs mt-0.5">{item.daysRemaining}天</span>
                            <span className="line-clamp-1">{item.title}</span>
                            <span className="text-text-muted text-xs flex-shrink-0">- {getDeptLabel(item.responsibleDept)}</span>
                          </div>
                        ))}
                        {report.deadlineBoard.upcoming.length > 3 && (
                          <p className="text-xs text-text-muted">还有 {report.deadlineBoard.upcoming.length - 3} 项即将到期...</p>
                        )}
                      </div>
                    </div>
                  )}
                  {report.deadlineBoard.feedbackPending.length > 0 && (
                    <div className="bg-risk-low/10 border border-risk-low/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-risk-low font-medium mb-2">
                        <Clock className="w-4 h-4" />
                        已反馈待确认（{report.deadlineBoard.feedbackPending.length}件）
                      </div>
                      <div className="space-y-1">
                        {report.deadlineBoard.feedbackPending.slice(0, 3).map((item, i) => (
                          <div key={i} className="text-sm text-text-secondary flex items-start gap-2">
                            <span className="line-clamp-1">{item.title}</span>
                            <span className="text-text-muted text-xs flex-shrink-0">- {item.feedbackPerson || '未填写'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section>
              <h3 className="font-semibold text-text-primary mb-3 border-b border-card-border pb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-tech-blue rounded-full"></span>
                一、数据概览
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-deep-blue-600/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold font-mono text-tech-blue">{report.totalEvents}</p>
                  <p className="text-xs text-text-muted mt-1">舆情总数</p>
                </div>
                <div className="bg-deep-blue-600/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold font-mono text-risk-high">{report.highRiskCount}</p>
                  <p className="text-xs text-text-muted mt-1">高风险</p>
                </div>
                <div className="bg-deep-blue-600/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold font-mono text-risk-medium">{report.processingCount}</p>
                  <p className="text-xs text-text-muted mt-1">处理中</p>
                </div>
                <div className="bg-deep-blue-600/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold font-mono text-risk-resolved">{report.respondedCount}</p>
                  <p className="text-xs text-text-muted mt-1">已回应</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-text-primary mb-3 border-b border-card-border pb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-risk-resolved rounded-full"></span>
                二、已回应事项（{report.respondedItems.length}件）
              </h3>
              {report.respondedItems.length > 0 ? (
                <div className="space-y-3">
                  {report.respondedItems.map((item, i) => (
                    <div 
                      key={item.eventId} 
                      className="bg-risk-resolved/5 border border-risk-resolved/20 rounded-lg p-3 cursor-pointer hover:bg-risk-resolved/10 transition-colors"
                      onClick={() => handleViewEvent(item.eventId)}
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-risk-resolved flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-text-primary text-sm">{item.title}</span>
                            <Badge variant="default" size="sm" className="text-xs">
                              {CATEGORY_LABELS[item.category]}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-text-muted mb-2">
                            <span>责任部门：{getDeptLabel(item.responsibleDept)}</span>
                            <span>处置人：{item.responder}</span>
                          </div>
                          <div className="text-xs text-text-secondary bg-deep-blue-600/50 rounded p-2">
                            <span className="text-risk-resolved font-medium">处置摘要：</span>
                            {item.dispositionSummary}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted text-center py-4">今日暂无已回应事项</p>
              )}
            </section>

            <section>
              <h3 className="font-semibold text-text-primary mb-3 border-b border-card-border pb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-risk-medium rounded-full"></span>
                三、处理中事项（{report.processingItems.length}件）
              </h3>
              {report.processingItems.length > 0 ? (
                <div className="space-y-2">
                  {report.processingItems.map((item, i) => (
                    <div 
                      key={item.eventId} 
                      className="bg-risk-medium/5 border border-risk-medium/20 rounded-lg p-3 cursor-pointer hover:bg-risk-medium/10 transition-colors"
                      onClick={() => handleViewEvent(item.eventId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-risk-medium" />
                          <span className="text-sm text-text-primary line-clamp-1">{item.title}</span>
                        </div>
                        <span className="text-xs text-text-muted flex-shrink-0 ml-2">
                          {getDeptLabel(item.responsibleDept)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted text-center py-4">暂无处理中事项</p>
              )}
            </section>

            <section>
              <h3 className="font-semibold text-text-primary mb-3 border-b border-card-border pb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-risk-low rounded-full"></span>
                四、待核实事项（{report.pendingItems.length}件）
              </h3>
              {report.pendingItems.length > 0 ? (
                <div className="space-y-2">
                  {report.pendingItems.slice(0, 5).map((item, i) => (
                    <div 
                      key={item.eventId} 
                      className="bg-risk-low/5 border border-risk-low/20 rounded-lg p-3 cursor-pointer hover:bg-risk-low/10 transition-colors"
                      onClick={() => handleViewEvent(item.eventId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-risk-low" />
                          <span className="text-sm text-text-primary line-clamp-1">{item.title}</span>
                        </div>
                        <Badge variant="low" size="sm">待核实</Badge>
                      </div>
                    </div>
                  ))}
                  {report.pendingItems.length > 5 && (
                    <p className="text-xs text-text-muted text-center">
                      还有 {report.pendingItems.length - 5} 项待核实事项...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-muted text-center py-4">暂无待核实事项</p>
              )}
            </section>

            <section>
              <h3 className="font-semibold text-text-primary mb-3 border-b border-card-border pb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-tech-blue rounded-full"></span>
                五、处置说明
              </h3>
              {isEditing && report.status !== 'final' ? (
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
                    {report.dispositionNote || '暂无处置说明'}
                    {report.status !== 'final' && !report.dispositionNote && (
                      <span className="text-text-muted">，点击编辑按钮添加</span>
                    )}
                  </p>
                  {report.status !== 'final' && (
                    <button
                      onClick={() => {
                        setNote(report.dispositionNote || '');
                        setIsEditing(true);
                      }}
                      className="absolute top-0 right-0 p-1 text-text-muted hover:text-tech-blue transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </section>

            {(report.handoverMeta?.keyPoints || report.handoverMeta?.unresolvedItems) && (
              <section>
                <h3 className="font-semibold text-text-primary mb-3 border-b border-card-border pb-2 flex items-center gap-2">
                  <span className="w-1 h-4 bg-risk-medium rounded-full"></span>
                  六、交班信息
                </h3>
                <div className="space-y-4">
                  {report.handoverMeta.keyPoints && (
                    <div>
                      <h4 className="text-sm font-medium text-text-primary mb-2 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-tech-blue" />
                        交接重点
                      </h4>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap bg-deep-blue-600/50 rounded-lg p-3">
                        {report.handoverMeta.keyPoints}
                      </p>
                    </div>
                  )}
                  {report.handoverMeta.unresolvedItems && (
                    <div>
                      <h4 className="text-sm font-medium text-text-primary mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-risk-medium" />
                        未结事项
                      </h4>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap bg-risk-medium/5 rounded-lg p-3 border border-risk-medium/20">
                        {report.handoverMeta.unresolvedItems}
                      </p>
                    </div>
                  )}
                  {report.handoverMeta.successorConfirmed && (
                    <div className="bg-risk-resolved/10 border border-risk-resolved/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-risk-resolved text-sm font-medium mb-1">
                        <CheckCircle className="w-4 h-4" />
                        接班人已确认
                      </div>
                      <p className="text-xs text-text-secondary">
                        接班人：{report.handoverMeta.successorName}
                        {report.handoverMeta.confirmedAt && (
                          <span className="ml-2">确认时间：{formatDateTime(report.handoverMeta.confirmedAt)}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {report.status === 'final' && (
              <div className="bg-risk-resolved/5 border border-risk-resolved/20 rounded-lg p-4 flex items-center gap-3">
                <div className="p-2 bg-risk-resolved/10 rounded-full">
                  <Lock className="w-5 h-5 text-risk-resolved" />
                </div>
                <div>
                  <p className="text-sm font-medium text-risk-resolved">此版本已定稿，不可修改</p>
                  <p className="text-xs text-text-muted">
                    定稿时间：{report.finalizedAt ? formatDateTime(report.finalizedAt) : '-'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-card-border text-right text-xs text-text-muted">
            生成时间：{formatDateTime(report.createdAt)}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {report.autoSavedAt && (
            <div className="text-xs text-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              最后自动保存：{formatDateTime(report.autoSavedAt)}
            </div>
          )}
          <div className="flex gap-3 ml-auto">
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
        </div>
      </Card.Content>
    </Card>
  );
}
