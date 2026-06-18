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
    return ArrowRight;
  };

  const getActionColor = (action: string) => {
    if (action.includes('完成') || action.includes('回应')) return 'text-risk-resolved';
    if (action.includes('核实') || action.includes('创建')) return 'text-tech-blue';
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
                      
                      <div className="flex items-center gap-1 text-xs text-text-muted">
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
