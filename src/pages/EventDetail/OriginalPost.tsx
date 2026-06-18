import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Event } from '@/types/event';
import { CATEGORY_LABELS, RISK_LEVEL_LABELS, PLATFORM_LABELS } from '@/types/event';
import { getRiskLevelColor, getSentimentLabel, getSentimentColor } from '@/utils/riskLevel';
import { formatDateTime, formatNumber } from '@/utils/date';
import { User, ExternalLink, Eye, MessageCircle, Share2, Calendar } from 'lucide-react';

interface OriginalPostProps {
  event: Event;
}

export function OriginalPost({ event }: OriginalPostProps) {
  return (
    <Card className="animate-slide-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
      <Card.Header>
        <Card.Title>舆情原文</Card.Title>
        <div className="flex items-center gap-2">
          <Badge variant={event.riskLevel} pulse={event.riskLevel === 'high'}>
            {RISK_LEVEL_LABELS[event.riskLevel]}
          </Badge>
          <Badge variant="default">
            {CATEGORY_LABELS[event.category]}
          </Badge>
          <Badge variant="default">
            {PLATFORM_LABELS[event.platform]}
          </Badge>
        </div>
      </Card.Header>
      <Card.Content>
        <h2 className={`text-xl font-bold mb-4 ${getRiskLevelColor(event.riskLevel)}`}>
          {event.title}
        </h2>

        <div className="flex items-center gap-6 mb-4 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {event.author}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDateTime(event.publishTime)}
          </div>
        </div>

        <div className="bg-deep-blue-600/50 rounded-lg p-4 mb-4 border border-card-border">
          <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
            {event.content}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-text-secondary">
              <Eye className="w-4 h-4" />
              <span className="font-mono">{formatNumber(event.viewCount)}</span>
              <span className="text-xs">浏览</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <MessageCircle className="w-4 h-4" />
              <span className="font-mono">{formatNumber(event.commentCount)}</span>
              <span className="text-xs">评论</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Share2 className="w-4 h-4" />
              <span className="font-mono">{formatNumber(event.shareCount)}</span>
              <span className="text-xs">转发</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">情绪倾向：</span>
            <span className={`font-medium ${getSentimentColor(event.sentiment)}`}>
              {getSentimentLabel(event.sentiment)}
            </span>
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-tech-blue hover:text-tech-blue/80 text-sm transition-colors"
            >
              查看原帖
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
