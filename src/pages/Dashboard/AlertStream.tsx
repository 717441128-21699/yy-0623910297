import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Event } from '@/types/event';
import { RISK_LEVEL_LABELS, PLATFORM_LABELS } from '@/types/event';
import { getRiskLevelColor, getRiskLevelBgColor } from '@/utils/riskLevel';
import { formatRelativeTime } from '@/utils/date';
import { AlertTriangle, Bell } from 'lucide-react';

interface AlertStreamProps {
  events: Event[];
}

export function AlertStream({ events }: AlertStreamProps) {
  const navigate = useNavigate();
  const [displayedEvents, setDisplayedEvents] = useState<Event[]>([]);

  const highRiskEvents = useMemo(() => {
    return events
      .filter(e => e.riskLevel === 'high' || e.riskLevel === 'medium')
      .sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime())
      .slice(0, 10);
  }, [events]);

  useEffect(() => {
    setDisplayedEvents(highRiskEvents);
    
    const interval = setInterval(() => {
      setDisplayedEvents(prev => {
        if (prev.length <= 1) return highRiskEvents;
        const [first, ...rest] = prev;
        return [...rest, first];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [highRiskEvents]);

  return (
    <Card className="h-full animate-slide-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-risk-high animate-pulse-fast" />
          实时告警
        </Card.Title>
        <Badge variant="high">{highRiskEvents.length} 条</Badge>
      </Card.Header>
      <Card.Content>
        <div className="h-64 overflow-hidden relative">
          <div className="space-y-2">
            {displayedEvents.map((event, index) => (
              <div
                key={`${event.id}-${index}`}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-deep-blue-600 ${
                  getRiskLevelBgColor(event.riskLevel)
                }`}
                onClick={() => navigate(`/event/${event.id}`)}
                style={{
                  animation: index === 0 ? 'slideInRight 0.3s ease-out' : 'none',
                }}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getRiskLevelColor(event.riskLevel)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={event.riskLevel} pulse={event.riskLevel === 'high'}>
                        {RISK_LEVEL_LABELS[event.riskLevel]}
                      </Badge>
                      <span className="text-xs text-text-muted">
                        {PLATFORM_LABELS[event.platform]}
                      </span>
                    </div>
                    <p className={`text-sm font-medium truncate ${getRiskLevelColor(event.riskLevel)}`}>
                      {event.title}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {formatRelativeTime(event.publishTime)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
