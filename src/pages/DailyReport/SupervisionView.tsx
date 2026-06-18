import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { DailyReport, SupervisionGroup } from '@/types/report';
import { SUPERVISION_TYPE_LABELS } from '@/types/report';
import { SUPERVISION_STATUS_LABELS, DEPARTMENT_OPTIONS } from '@/types/workOrder';
import { getRiskLevelColor, getRiskLevelBgColor } from '@/utils/riskLevel';
import { RISK_LEVEL_LABELS, PLATFORM_LABELS, SCENIC_OPTIONS } from '@/types/event';
import { AlertTriangle, Send, MessageSquare, Flag, Eye, Clock, User, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '@/utils/date';

interface SupervisionViewProps {
  report: DailyReport | null;
}

type TabKey = keyof SupervisionGroup;

const tabConfigs: Record<TabKey, { icon: typeof AlertTriangle; color: string; bgColor: string; label: string }> = {
  needReport: {
    icon: AlertTriangle,
    color: 'text-risk-high',
    bgColor: 'bg-risk-high/10',
    label: '需要报领导',
  },
  reported: {
    icon: Send,
    color: 'text-risk-medium',
    bgColor: 'bg-risk-medium/10',
    label: '已上报',
  },
  leaderCommented: {
    icon: MessageSquare,
    color: 'text-tech-blue',
    bgColor: 'bg-tech-blue/10',
    label: '领导已批示',
  },
};

export function SupervisionView({ report }: SupervisionViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('needReport');
  const navigate = useNavigate();

  const items = report?.supervision[activeTab] || [];
  const config = tabConfigs[activeTab];
  const Icon = config.icon;

  const getScenicLabel = (value: string) => {
    const scenic = SCENIC_OPTIONS.find(s => s.value === value);
    return scenic ? scenic.label : value;
  };

  const getDeptLabel = (value: string) => {
    const dept = DEPARTMENT_OPTIONS.find(d => d.value === value);
    return dept ? dept.label : value;
  };

  const handleViewDetail = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const totalCount = report 
    ? report.supervision.needReport.length + report.supervision.reported.length + report.supervision.leaderCommented.length
    : 0;

  return (
    <Card className="animate-slide-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-risk-high" />
          督办视角
          {totalCount > 0 && (
            <Badge variant="high" size="sm" className="animate-pulse-risk">
              {totalCount}项
            </Badge>
          )}
        </Card.Title>
      </Card.Header>
      
      <div className="flex gap-1 mb-4 px-1">
        {(Object.keys(tabConfigs) as TabKey[]).map((key) => {
          const tabConfig = tabConfigs[key];
          const TabIcon = tabConfig.icon;
          const count = report?.supervision[key]?.length || 0;
          const isActive = activeTab === key;
          
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? `${tabConfig.color} ${tabConfig.bgColor}`
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
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {items.map((item, index) => (
              <div
                key={item.eventId}
                className={`p-4 rounded-lg border ${getRiskLevelBgColor(item.level)} animate-slide-in-up cursor-pointer hover:bg-white/5 transition-colors group`}
                style={{ animationDelay: `${0.5 + index * 0.05}s`, animationFillMode: 'both' }}
                onClick={() => handleViewDetail(item.eventId)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant={item.level} size="sm">
                        {RISK_LEVEL_LABELS[item.level]}
                      </Badge>
                      <Badge size="sm" className={config.bgColor + ' ' + config.color}>
                        {SUPERVISION_STATUS_LABELS[item.supervisionStatus]}
                      </Badge>
                      <span className="text-[10px] text-text-muted">
                        {getScenicLabel(item.scenic)}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {PLATFORM_LABELS[item.platform as keyof typeof PLATFORM_LABELS]}
                      </span>
                    </div>
                    
                    <h4 className={`text-sm font-medium mb-2 ${getRiskLevelColor(item.level)} line-clamp-1`}>
                      {item.title}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs text-text-muted mb-2">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span className="font-mono">{(item.viewCount / 10000).toFixed(1)}万</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{item.handler}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-text-muted">责任：</span>
                        <span>{getDeptLabel(item.responsibleDept)}</span>
                      </div>
                      {item.reportTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateTime(item.reportTime)}</span>
                        </div>
                      )}
                    </div>

                    {item.leaderComment && (
                      <div className="bg-tech-blue/10 border border-tech-blue/30 rounded-lg p-3 mt-2">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-tech-blue flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-tech-blue font-medium mb-1">领导批示</p>
                            <p className="text-sm text-text-secondary">{item.leaderComment}</p>
                            {item.leaderFeedbackDeadline && (
                              <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                要求反馈：{formatDateTime(item.leaderFeedbackDeadline)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end mt-2">
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
