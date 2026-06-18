import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { useCountUp } from '@/hooks/useCountUp';
import { TrendingUp, TrendingDown, AlertTriangle, Clock, CheckCircle, MessageSquare } from 'lucide-react';
import type { Event } from '@/types/event';
import type { WorkOrder } from '@/types/workOrder';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { formatNumber } from '@/utils/date';

interface RiskOverviewProps {
  events: Event[];
}

interface StatCard {
  label: string;
  value: number;
  icon: typeof AlertTriangle;
  color: string;
  borderColor: string;
  trend?: 'up' | 'down';
  trendValue?: number;
}

export function RiskOverview({ events }: RiskOverviewProps) {
  const { workOrders } = useWorkOrderStore();

  const stats = useMemo(() => {
    const totalEvents = events.length;
    const highRiskCount = events.filter(e => e.riskLevel === 'high').length;
    
    const workOrderList = Object.values(workOrders);
    const pendingCount = workOrderList.filter(wo => wo.status === 'pending').length;
    const processingCount = workOrderList.filter(wo => wo.status === 'processing').length;
    const respondedCount = workOrderList.filter(wo => wo.status === 'responded').length;

    const cards: StatCard[] = [
      {
        label: '今日舆情总数',
        value: totalEvents,
        icon: MessageSquare,
        color: 'text-tech-blue',
        borderColor: 'border-tech-blue/30',
        trend: 'up',
        trendValue: 12,
      },
      {
        label: '高风险事件',
        value: highRiskCount,
        icon: AlertTriangle,
        color: 'text-risk-high',
        borderColor: 'border-risk-high/30',
        trend: 'up',
        trendValue: 3,
      },
      {
        label: '待核实',
        value: pendingCount,
        icon: Clock,
        color: 'text-risk-low',
        borderColor: 'border-risk-low/30',
        trend: 'down',
        trendValue: 2,
      },
      {
        label: '处理中',
        value: processingCount,
        icon: TrendingUp,
        color: 'text-risk-medium',
        borderColor: 'border-risk-medium/30',
      },
      {
        label: '已回应',
        value: respondedCount,
        icon: CheckCircle,
        color: 'text-risk-resolved',
        borderColor: 'border-risk-resolved/30',
        trend: 'up',
        trendValue: 5,
      },
    ];

    return cards;
  }, [events, workOrders]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {stats.map((stat, index) => (
        <StatCardItem key={stat.label} stat={stat} delay={index * 0.1} />
      ))}
    </div>
  );
}

function StatCardItem({ stat, delay }: { stat: StatCard; delay: number }) {
  const { count } = useCountUp(stat.value, 1000);
  const Icon = stat.icon;

  return (
    <Card
      className={`border-l-4 ${stat.borderColor} animate-slide-in-up`}
      style={{ animationDelay: `${delay}s`, animationFillMode: 'both' }}
      glow
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-xs mb-1">{stat.label}</p>
          <p className={`text-3xl font-bold font-mono ${stat.color} animate-count-up`}>
            {formatNumber(count)}
          </p>
          {stat.trend && (
            <div className="flex items-center gap-1 mt-2">
              {stat.trend === 'up' ? (
                <TrendingUp className="w-3 h-3 text-risk-high" />
              ) : (
                <TrendingDown className="w-3 h-3 text-risk-resolved" />
              )}
              <span className={`text-xs ${stat.trend === 'up' ? 'text-risk-high' : 'text-risk-resolved'}`}>
                {stat.trendValue}% 较昨日
              </span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg bg-current/10 ${stat.color}`}>
          <Icon className={`w-5 h-5 ${stat.color}`} />
        </div>
      </div>
    </Card>
  );
}
