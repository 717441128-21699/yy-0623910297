import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { DailyReport } from '@/types/report';
import { LEADER_ATTENTION_TYPE_LABELS } from '@/types/report';
import { getRiskLevelColor, getRiskLevelBgColor } from '@/utils/riskLevel';
import { RISK_LEVEL_LABELS } from '@/types/event';
import { AlertTriangle, Users, FileCheck, Flag } from 'lucide-react';

interface LeaderAttentionProps {
  report: DailyReport | null;
}

const typeIcons = {
  highRisk: AlertTriangle,
  crossDept: Users,
  decision: FileCheck,
};

const typeColors = {
  highRisk: 'text-risk-high',
  crossDept: 'text-risk-medium',
  decision: 'text-tech-blue',
};

export function LeaderAttention({ report }: LeaderAttentionProps) {
  return (
    <Card className="animate-slide-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-risk-high" />
          领导关注
        </Card.Title>
      </Card.Header>
      <Card.Content>
        {!report || report.leaderAttention.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            暂无需要领导关注的事项
          </div>
        ) : (
          <div className="space-y-3">
            {report.leaderAttention.map((item, index) => {
              const Icon = typeIcons[item.type];
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getRiskLevelBgColor(item.level)} animate-slide-in-up`}
                  style={{ animationDelay: `${0.4 + index * 0.1}s`, animationFillMode: 'both' }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-current/10 ${typeColors[item.type]}`}>
                      <Icon className={`w-5 h-5 ${typeColors[item.type]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${typeColors[item.type]} bg-current/10`}>
                          {LEADER_ATTENTION_TYPE_LABELS[item.type]}
                        </span>
                        <Badge variant={item.level}>
                          {RISK_LEVEL_LABELS[item.level]}
                        </Badge>
                      </div>
                      <h4 className={`font-medium mb-1 ${getRiskLevelColor(item.level)}`}>
                        {item.title}
                      </h4>
                      <p className="text-sm text-text-secondary">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
