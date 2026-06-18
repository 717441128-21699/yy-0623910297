import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SpreadDataPoint } from '@/types/event';
import { formatNumber } from '@/utils/date';

interface TrendChartProps {
  data: SpreadDataPoint[];
  height?: number;
}

export function TrendChart({ data, height = 200 }: TrendChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      time: new Date(point.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      views: point.viewCount,
      comments: point.commentCount,
      shares: point.shareCount,
    }));
  }, [data]);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F97316" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="time"
            stroke="#64748B"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748B"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatNumber(value)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#F1F5F9',
            }}
            labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
            formatter={(value: number) => [formatNumber(value), '']}
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#colorViews)"
            name="浏览量"
          />
          <Area
            type="monotone"
            dataKey="comments"
            stroke="#F97316"
            strokeWidth={2}
            fill="url(#colorComments)"
            name="评论数"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
