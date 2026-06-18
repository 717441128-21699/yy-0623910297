import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { DailyReport, HighFreqIssue } from '@/types/report';
import { CATEGORY_LABELS } from '@/types/event';
import { getCategoryColor } from '@/utils/riskLevel';
import { BarChart3, AlertCircle } from 'lucide-react';

interface HighFreqIssuesProps {
  report: DailyReport | null;
}

export function HighFreqIssues({ report }: HighFreqIssuesProps) {
  const maxCount = useMemo(() => {
    if (!report || report.highFreqIssues.length === 0) return 1;
    return Math.max(...report.highFreqIssues.map(i => i.count));
  }, [report]);

  return (
    <Card className="h-full animate-slide-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-tech-blue" />
          高频问题
        </Card.Title>
      </Card.Header>
      <Card.Content>
        {!report || report.highFreqIssues.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            暂无数据
          </div>
        ) : (
          <div className="space-y-4">
            {report.highFreqIssues.map((issue, index) => (
              <IssueBar key={issue.category} issue={issue} maxCount={maxCount} index={index} />
            ))}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

function IssueBar({ issue, maxCount, index }: { issue: HighFreqIssue; maxCount: number; index: number }) {
  const percentage = (issue.count / maxCount) * 100;
  const colorClass = getCategoryColor(issue.category);

  return (
    <div
      className="animate-slide-in-up"
      style={{ animationDelay: `${0.3 + index * 0.1}s`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="default" className={colorClass}>
            {CATEGORY_LABELS[issue.category]}
          </Badge>
          <span className={`font-mono font-bold ${colorClass}`}>
            {issue.count} 条
          </span>
        </div>
        <span className="text-xs text-text-muted">
          {Math.round(percentage)}%
        </span>
      </div>
      
      <div className="h-2 bg-deep-blue-600 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${colorClass.replace('text-', 'bg-')} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="space-y-1">
        {issue.examples.map((example, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <AlertCircle className="w-3 h-3 text-text-muted mt-0.5 flex-shrink-0" />
            <span className="text-text-secondary line-clamp-1">{example}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
