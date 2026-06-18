import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { TrendChart } from '@/components/charts/TrendChart';
import type { SpreadDataPoint } from '@/types/event';
import { getMockSpreadData } from '@/data/mockEvents';
import { TrendingUp, Users, MessageSquare, Share2 } from 'lucide-react';
import { formatNumber } from '@/utils/date';

interface SpreadAnalysisProps {
  eventId: string;
}

export function SpreadAnalysis({ eventId }: SpreadAnalysisProps) {
  const spreadData = useMemo(() => getMockSpreadData(eventId), [eventId]);

  const stats = useMemo(() => {
    if (spreadData.length === 0) return { views: 0, comments: 0, shares: 0, growth: 0 };
    
    const latest = spreadData[spreadData.length - 1];
    const first = spreadData[0];
    const growth = first.viewCount > 0 
      ? Math.round(((latest.viewCount - first.viewCount) / first.viewCount) * 100)
      : 0;

    return {
      views: latest.viewCount,
      comments: latest.commentCount,
      shares: latest.shareCount,
      growth,
    };
  }, [spreadData]);

  return (
    <Card className="animate-slide-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-tech-blue" />
          传播分析
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <StatCard
            icon={Users}
            label="浏览量"
            value={stats.views}
            color="text-tech-blue"
          />
          <StatCard
            icon={MessageSquare}
            label="评论数"
            value={stats.comments}
            color="text-risk-medium"
          />
          <StatCard
            icon={Share2}
            label="转发数"
            value={stats.shares}
            color="text-risk-low"
          />
          <StatCard
            icon={TrendingUp}
            label="增长率"
            value={stats.growth}
            color={stats.growth >= 0 ? 'text-risk-high' : 'text-risk-resolved'}
            suffix="%"
          />
        </div>

        <div className="h-64">
          <TrendChart data={spreadData} height={250} />
        </div>

        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-tech-blue" />
            <span className="text-text-secondary">浏览量</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-risk-medium" />
            <span className="text-text-secondary">评论数</span>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

interface StatCardProps {
  icon: typeof Users;
  label: string;
  value: number;
  color: string;
  suffix?: string;
}

function StatCard({ icon: Icon, label, value, color, suffix = '' }: StatCardProps) {
  return (
    <div className="bg-deep-blue-600/30 rounded-lg p-3 border border-card-border">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <p className={`text-xl font-bold font-mono ${color}`}>
        {formatNumber(value)}{suffix}
      </p>
    </div>
  );
}
