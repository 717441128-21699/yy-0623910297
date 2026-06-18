import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { DailyReport, DeadlineGroup, DeadlineStatus } from '@/types/report';
import { DEADLINE_TYPE_LABELS, DEADLINE_STATUS_LABELS } from '@/types/report';
import { getRiskLevelColor, getRiskLevelBgColor } from '@/utils/riskLevel';
import { RISK_LEVEL_LABELS, PLATFORM_LABELS, SCENIC_OPTIONS } from '@/types/event';
import { AlertTriangle, Clock, CheckCircle, User, Calendar, AlertCircle, Eye, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '@/utils/date';

interface DeadlineBoardProps {
  report: DailyReport | null;
}

type TabKey = keyof DeadlineGroup;

const tabConfigs: Record<TabKey, { icon: typeof AlertTriangle; color: string; bgColor: string; label: string }> = {
  overdue: {
    icon: AlertTriangle,
    color: 'text-risk-high',
    bgColor: 'bg-risk-high/10',
    label: '已逾期',
  },
  upcoming: {
    icon: Clock,
    color: 'text-risk-medium',
    bgColor: 'bg-risk-medium/10',
    label: '即将到期',
  },
  feedbackPending: {
    icon: Eye,
    color: 'text-risk-low',
    bgColor: 'bg-risk-low/10',
    label: '已反馈待确认',
  },
  normal: {
    icon: CheckCircle,
    color: 'text-tech-blue',
    bgColor: 'bg-tech-blue/10',
    label: '正常办理',
  },
};

export function DeadlineBoard({ report }: DeadlineBoardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overdue');
  const navigate = useNavigate();

  const items = report?.deadlineBoard?.[activeTab] || [];
  const config = tabConfigs[activeTab];
  const Icon = config.icon;

  const totalCount = report?.deadlineBoard
    ? Object.values(report.deadlineBoard).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  const getScenicLabel = (value: string) => {
    const scenic = SCENIC_OPTIONS.find(s => s.value === value);
    return scenic ? scenic.label : value;
  };

  const getDeptLabel = (value: string) => {
    return value || '未指派';
  };

  const handleViewDetail = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const getStatusBadge = (status: DeadlineStatus) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="high" size="sm">已逾期</Badge>;
      case 'upcoming':
        return <Badge variant="medium" size="sm">即将到期</Badge>;
      case 'feedbackPending':
        return <Badge variant="low" size="sm">已反馈待确认</Badge>;
      default:
        return <Badge variant="default" size="sm">正常办理</Badge>;
    }
  };

  const getUrgencyText = (item: any) => {
    if (item.deadlineStatus === 'overdue') {
      return `逾期 ${item.daysOverdue || 0} 天`;
    }
    if (item.deadlineStatus === 'upcoming') {
      return `剩 ${item.daysRemaining || 0} 天`;
    }
    return '';
  };

  if (!report) {
    return (
      <Card className="animate-slide-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-risk-high" />
            督办时限看板
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="text-center py-8 text-text-muted">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>请先生成日报</p>
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-risk-high" />
          督办时限看板
          <Badge variant="default" size="sm" className="ml-2">
            共 {totalCount} 项
          </Badge>
        </Card.Title>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-risk-high">● 已逾期 {report.deadlineBoard.overdue.length}</span>
          <span className="text-risk-medium">● 即将到期 {report.deadlineBoard.upcoming.length}</span>
          <span className="text-risk-low">● 待确认 {report.deadlineBoard.feedbackPending.length}</span>
        </div>
      </Card.Header>
      
      <div className="flex gap-1 mb-4 px-1">
        {(Object.keys(tabConfigs) as TabKey[]).map((key) => {
          const tabConfig = tabConfigs[key];
          const TabIcon = tabConfig.icon;
          const count = report?.deadlineBoard?.[key]?.length || 0;
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
              <span className="hidden sm:inline">{DEADLINE_TYPE_LABELS[key]}</span>
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
        {items.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Icon className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>暂无{config.label}事项</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {items.map((item, index) => (
              <div
                key={item.eventId}
                className={`p-3 rounded-lg border ${config.bgColor} cursor-pointer hover:bg-white/5 transition-colors group animate-slide-in-up`}
                style={{ animationDelay: `${0.4 + index * 0.05}s`, animationFillMode: 'both' }}
                onClick={() => handleViewDetail(item.eventId)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg ${config.bgColor} ${config.color} flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={item.level} size="sm">
                        {RISK_LEVEL_LABELS[item.level]}
                      </Badge>
                      {getStatusBadge(item.deadlineStatus)}
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
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-text-muted mb-2">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>责任部门：{getDeptLabel(item.responsibleDept)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>处置人：{item.handler}</span>
                      </div>
                      {item.leaderFeedbackDeadline && (
                        <div className="flex items-center gap-1 col-span-2">
                          <Calendar className="w-3 h-3" />
                          <span>反馈期限：{formatDateTime(item.leaderFeedbackDeadline)}</span>
                        </div>
                      )}
                      {item.feedbackTime && (
                        <div className="flex items-center gap-1 col-span-2">
                          <Clock className="w-3 h-3" />
                          <span>反馈时间：{formatDateTime(item.feedbackTime)}</span>
                          {item.feedbackPerson && <span className="ml-2">反馈人：{item.feedbackPerson}</span>}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className={`text-xs font-medium ${config.color} flex items-center gap-1`}>
                        {item.deadlineStatus === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                        {item.deadlineStatus === 'upcoming' && <Clock className="w-3 h-3" />}
                        {item.deadlineStatus === 'feedbackPending' && <Eye className="w-3 h-3" />}
                        {getUrgencyText(item)}
                      </div>
                      <span className="text-xs text-tech-blue opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        催办 <ArrowUpRight className="w-3 h-3" />
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
