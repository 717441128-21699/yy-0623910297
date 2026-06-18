import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { DailyReport, LeaderAttentionGroup } from '@/types/report';
import { LEADER_ATTENTION_TYPE_LABELS } from '@/types/report';
import { getRiskLevelColor, getRiskLevelBgColor } from '@/utils/riskLevel';
import { RISK_LEVEL_LABELS, PLATFORM_LABELS, SCENIC_OPTIONS } from '@/types/event';
import { AlertTriangle, Zap, Users, Flag, Eye, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeaderAttentionProps {
  report: DailyReport | null;
}

type TabKey = keyof LeaderAttentionGroup;

const tabConfigs: Record<TabKey, { icon: typeof AlertTriangle; color: string; label: string }> = {
  highRiskUnresponded: {
    icon: AlertTriangle,
    color: 'text-risk-high',
    label: '高风险未回应',
  },
  fastSpreading: {
    icon: Zap,
    color: 'text-risk-medium',
    label: '传播上涨快',
  },
  crossDept: {
    icon: Users,
    color: 'text-tech-blue',
    label: '跨部门协调',
  },
};

export function LeaderAttention({ report }: LeaderAttentionProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('highRiskUnresponded');
  const navigate = useNavigate();

  const items = report?.leaderAttention[activeTab] || [];
  const config = tabConfigs[activeTab];
  const Icon = config.icon;

  const getScenicLabel = (value: string) => {
    const scenic = SCENIC_OPTIONS.find(s => s.value === value);
    return scenic ? scenic.label : value;
  };

  const handleViewDetail = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  return (
    <Card className="animate-slide-in-up h-full" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-risk-high" />
          领导关注
        </Card.Title>
      </Card.Header>
      
      <div className="flex gap-1 mb-4 px-1">
        {(Object.keys(tabConfigs) as TabKey[]).map((key) => {
          const tabConfig = tabConfigs[key];
          const TabIcon = tabConfig.icon;
          const count = report?.leaderAttention[key]?.length || 0;
          const isActive = activeTab === key;
          
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? `${tabConfig.color} bg-current/10`
                  : 'text-text-muted hover:text-text-secondary hover:bg-deep-blue-600/30'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tabConfig.label}</span>
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                isActive ? 'bg-white/20' : 'bg-deep-blue-600/50'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <Card.Content className="pt-0">
        {!report || items.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Icon className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>暂无{config.label}事项</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {items.map((item, index) => (
              <div
                key={item.eventId}
                className={`p-3 rounded-lg border ${getRiskLevelBgColor(item.level)} animate-slide-in-up cursor-pointer hover:bg-white/5 transition-colors group`}
                style={{ animationDelay: `${0.4 + index * 0.05}s`, animationFillMode: 'both' }}
                onClick={() => handleViewDetail(item.eventId)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg bg-current/10 ${config.color} flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={item.level} size="sm">
                        {RISK_LEVEL_LABELS[item.level]}
                      </Badge>
                      <span className="text-[10px] text-text-muted">
                        {getScenicLabel(item.scenic)}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {PLATFORM_LABELS[item.platform as keyof typeof PLATFORM_LABELS]}
                      </span>
                    </div>
                    <h4 className={`text-sm font-medium mb-1 ${getRiskLevelColor(item.level)} line-clamp-2`}>
                      {item.title}
                    </h4>
                    <p className="text-xs text-text-secondary line-clamp-2 mb-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-text-muted">
                        <Eye className="w-3 h-3" />
                        <span className="font-mono">{(item.viewCount / 10000).toFixed(1)}万</span>
                        {item.spreadSpeed && (
                          <>
                            <ArrowUpRight className="w-3 h-3 text-risk-medium" />
                            <span className="text-risk-medium">快</span>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-tech-blue opacity-0 group-hover:opacity-100 transition-opacity">
                        查看详情 →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
