import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { useCountUp } from '@/hooks/useCountUp';
import type { DailyReport } from '@/types/report';
import { FileText, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDate } from '@/utils/date';

interface DataSummaryProps {
  report: DailyReport | null;
}

export function DataSummary({ report }: DataSummaryProps) {
  const stats = useMemo(() => {
    if (!report) return [];
    
    return [
      {
        label: '今日舆情总数',
        value: report.totalEvents,
        icon: FileText,
        color: 'text-tech-blue',
        borderColor: 'border-tech-blue/30',
        trend: 'up' as const,
        trendValue: 8,
      },
      {
        label: '高风险事件',
        value: report.highRiskCount,
        icon: AlertTriangle,
        color: 'text-risk-high',
        borderColor: 'border-risk-high/30',
        trend: 'up' as const,
        trendValue: 3,
      },
      {
        label: '已处理',
        value: report.processedCount,
        icon: CheckCircle,
        color: 'text-risk-resolved',
        borderColor: 'border-risk-resolved/30',
        trend: 'up' as const,
        trendValue: 15,
      },
      {
        label: '待处理',
        value: report.pendingCount,
        icon: Clock,
        color: 'text-risk-medium',
        borderColor: 'border-risk-medium/30',
        trend: 'down' as const,
        trendValue: 5,
      },
    ];
  }, [report]);

  return (
    <Card className="animate-slide-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
      <Card.Header>
        <Card.Title>数据概览</Card.Title>
        <span className="text-sm text-text-muted">
          {report ? formatDate(report.date) : '暂无数据'}
        </span>
      </Card.Header>
      <Card.Content>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} delay={index * 0.1} />
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}

interface StatItem {
  label: string;
  value: number;
  icon: typeof FileText;
  color: string;
  borderColor: string;
  trend: 'up' | 'down';
  trendValue: number;
}

function StatCard({ stat, delay }: { stat: StatItem; delay: number }) {
  const { count } = useCountUp(stat.value, 1000);
  const Icon = stat.icon;

  return (
    <div
      className={`bg-deep-blue-600/30 rounded-lg p-4 border-l-4 ${stat.borderColor} animate-slide-in-up`}
      style={{ animationDelay: `${delay}s`, animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted mb-1">{stat.label}</p>
          <p className={`text-2xl font-bold font-mono ${stat.color}`}>
            {count}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {stat.trend === 'up' ? (
              <TrendingUp className={`w-3 h-3 ${stat.trendValue > 0 ? 'text-risk-high' : 'text-risk-resolved'}`} />
            ) : (
              <TrendingDown className="w-3 h-3 text-risk-resolved" />
            )}
            <span className={`text-xs ${stat.trend === 'up' && stat.trendValue > 0 ? 'text-risk-high' : 'text-risk-resolved'}`}>
              {stat.trendValue}% 较昨日
            </span>
          </div>
        </div>
        <div className={`p-2 rounded-lg bg-current/10 ${stat.color}`}>
          <Icon className={`w-5 h-5 ${stat.color}`} />
        </div>
      </div>
    </div>
  );
}
