import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { formatDateTime } from '@/utils/date';
import { History, User, Clock, FileText, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface HistoryTimelineProps {
  eventId: string;
}

export function HistoryTimeline({ eventId }: HistoryTimelineProps) {
  const { getHistoryByEventId } = useWorkOrderStore();
  const history = useMemo(() => getHistoryByEventId(eventId), [eventId, getHistoryByEventId]);

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [history]);

  const getActionIcon = (action: string) => {
    if (action.includes('创建')) return FileText;
    if (action.includes('核实')) return AlertTriangle;
    if (action.includes('完成') || action.includes('回应')) return CheckCircle;
    if (action.includes('督办') || action.includes('上报') || action.includes('批示')) return AlertTriangle;
    return ArrowRight;
  };

  const getActionColor = (action: string) => {
    if (action.includes('完成') || action.includes('回应')) return 'text-risk-resolved';
    if (action.includes('核实') || action.includes('创建')) return 'text-tech-blue';
    if (action.includes('督办') || action.includes('需要报领导')) return 'text-risk-high';
    if (action.includes('已上报')) return 'text-risk-medium';
    if (action.includes('批示')) return 'text-tech-blue';
    return 'text-risk-medium';
  };

  return (
    <Card className="animate-slide-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <History className="w-4 h-4 text-tech-blue" />
          处置记录
        </Card.Title>
        <span className="text-xs text-text-muted">{sortedHistory.length} 条记录</span>
      </Card.Header>
      <Card.Content>
        {sortedHistory.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            暂无处置记录
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-card-border" />
            
            <div className="space-y-4">
              {sortedHistory.map((record, index) => {
                const Icon = getActionIcon(record.action);
                const colorClass = getActionColor(record.action);
                
                return (
                  <div key={record.id} className="relative pl-10">
                    <div className={`absolute left-0 w-8 h-8 rounded-full bg-card-bg border-2 ${
                      index === sortedHistory.length - 1 
                        ? 'border-tech-blue' 
                        : 'border-card-border'
                    } flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${index === sortedHistory.length - 1 ? colorClass : 'text-text-muted'}`} />
                    </div>
                    
                    <div className={`bg-deep-blue-600/50 rounded-lg p-3 border ${
                      index === sortedHistory.length - 1 
                        ? 'border-tech-blue/30' 
                        : 'border-card-border'
                    } transition-all hover:bg-deep-blue-600`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium text-sm ${colorClass}`}>
                          {record.action}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-text-muted">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(record.timestamp)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-text-secondary mb-2">
                        {record.remark}
                      </p>
                      
                      {record.verifyResult && (
                        <div className="text-xs text-text-secondary mb-1 bg-deep-blue-600/50 rounded p-2">
                          <span className="text-text-muted">核实情况：</span>{record.verifyResult}
                        </div>
                      )}
                      
                      {record.responsibleDept && (
                        <div className="text-xs text-text-secondary mb-1">
                          <span className="text-text-muted">责任部门：</span>{record.responsibleDept}
                        </div>
                      )}
                      
                      {record.expectedFeedbackTime && (
                        <div className="text-xs text-text-secondary mb-1">
                          <span className="text-text-muted">预计反馈：</span>
                          {formatDateTime(record.expectedFeedbackTime)}
                        </div>
                      )}
                      
                      {record.dispositionSummary && (
                        <div className="text-xs text-text-secondary mb-1 bg-risk-resolved/10 rounded p-2">
                          <span className="text-risk-resolved">处置摘要：</span>{record.dispositionSummary}
                        </div>
                      )}
                      
                      {record.leaderComment && (
                        <div className="text-xs text-text-secondary mb-1 bg-tech-blue/10 border border-tech-blue/30 rounded p-2">
                          <span className="text-tech-blue font-medium">领导批示：</span>{record.leaderComment}
                        </div>
                      )}
                      
                      {record.leaderFeedbackDeadline && (
                        <div className="text-xs text-text-secondary mb-1">
                          <span className="text-text-muted">要求反馈：</span>
                          {formatDateTime(record.leaderFeedbackDeadline)}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-xs text-text-muted mt-2 pt-2 border-t border-card-border">
                        <User className="w-3 h-3" />
                        <span>{record.operator}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
