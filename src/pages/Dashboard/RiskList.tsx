import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TrendChart } from '@/components/charts/TrendChart';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { getMockSpreadData } from '@/data/mockEvents';
import { getRiskLevelColor, getRiskLevelBgColor, getRiskLevelGlow, getRiskLevelAnimation, getWorkOrderStatusBgColor, getWorkOrderStatusColor } from '@/utils/riskLevel';
import { formatRelativeTime, formatNumber } from '@/utils/date';
import { CATEGORY_LABELS, RISK_LEVEL_LABELS, PLATFORM_LABELS, type RiskCategory, type Event } from '@/types/event';
import { WORK_ORDER_STATUS_LABELS } from '@/types/workOrder';
import { Eye, MessageCircle, Share2, TrendingUp, ExternalLink, ClipboardCheck } from 'lucide-react';

interface RiskListProps {
  events: Event[];
}

const categories: (RiskCategory | 'all')[] = ['all', 'complaint', 'crowd', 'overcharge', 'service', 'safety'];

export function RiskList({ events }: RiskListProps) {
  const { selectedCategory, setSelectedCategory } = useDashboardStore();
  const navigate = useNavigate();

  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return events;
    return events.filter(e => e.category === selectedCategory);
  }, [events, selectedCategory]);

  const sortedEvents = useMemo(() => {
    const riskPriority = { high: 0, medium: 1, low: 2, resolved: 3 };
    return [...filteredEvents].sort((a, b) => {
      if (riskPriority[a.riskLevel] !== riskPriority[b.riskLevel]) {
        return riskPriority[a.riskLevel] - riskPriority[b.riskLevel];
      }
      return new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime();
    });
  }, [filteredEvents]);

  return (
    <Card className="animate-slide-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
      <Card.Header>
        <Card.Title>风险事件列表</Card.Title>
        <div className="flex gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded transition-all ${
                selectedCategory === cat
                  ? 'bg-tech-blue text-white'
                  : 'bg-deep-blue-600 text-text-secondary hover:bg-card-border'
              }`}
            >
              {cat === 'all' ? '全部' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </Card.Header>
      <Card.Content>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {sortedEvents.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              暂无相关事件
            </div>
          ) : (
            sortedEvents.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                index={index}
                onClick={() => navigate(`/event/${event.id}`)}
              />
            ))
          )}
        </div>
      </Card.Content>
    </Card>
  );
}

interface EventCardProps {
  event: Event;
  index: number;
  onClick: () => void;
}

function EventCard({ event, index, onClick }: EventCardProps) {
  const { workOrders } = useWorkOrderStore();
  const spreadData = useMemo(() => getMockSpreadData(event.id), [event.id]);
  const miniData = useMemo(() => spreadData.slice(-8), [spreadData]);
  
  const workOrder = workOrders[event.id];
  const hasWorkOrder = !!workOrder;

  return (
    <div
      className={`bg-deep-blue-600/50 border rounded-lg p-4 cursor-pointer transition-all hover:bg-deep-blue-600 hover:-translate-y-0.5 ${
        getRiskLevelBgColor(event.riskLevel)
      } ${getRiskLevelGlow(event.riskLevel)} ${getRiskLevelAnimation(event.riskLevel)}`}
      style={{ animationDelay: `${0.5 + index * 0.1}s` }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant={event.riskLevel} pulse={event.riskLevel === 'high'}>
              {RISK_LEVEL_LABELS[event.riskLevel]}
            </Badge>
            <Badge variant="default">
              {CATEGORY_LABELS[event.category]}
            </Badge>
            <span className="text-xs text-text-muted">
              {PLATFORM_LABELS[event.platform]}
            </span>
            {hasWorkOrder && (
              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getWorkOrderStatusBgColor(workOrder.status)} ${getWorkOrderStatusColor(workOrder.status)}`}>
                <ClipboardCheck className="w-3 h-3" />
                {WORK_ORDER_STATUS_LABELS[workOrder.status]}
              </span>
            )}
          </div>
          <h4 className={`font-medium mb-1 truncate ${getRiskLevelColor(event.riskLevel)}`}>
            {event.title}
          </h4>
          <p className="text-sm text-text-secondary line-clamp-2 mb-2">
            {event.content}
          </p>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatNumber(event.viewCount)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {formatNumber(event.commentCount)}
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="w-3 h-3" />
              {formatNumber(event.shareCount)}
            </span>
            <span>{formatRelativeTime(event.publishTime)}</span>
          </div>
        </div>

        <div className="w-32 flex-shrink-0">
          <div className="text-xs text-text-muted mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            传播趋势
          </div>
          <TrendChart data={miniData} height={60} />
        </div>

        <ExternalLink className="w-4 h-4 text-text-muted flex-shrink-0 mt-1" />
      </div>
    </div>
  );
}
