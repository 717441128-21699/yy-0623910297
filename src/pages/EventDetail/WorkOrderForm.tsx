import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { WORK_ORDER_STATUS_LABELS, DEPARTMENT_OPTIONS, SUPERVISION_STATUS_LABELS, SUPERVISION_STATUS_COLORS } from '@/types/workOrder';
import type { WorkOrderStatus, SupervisionStatus } from '@/types/workOrder';
import { getWorkOrderStatusColor, getWorkOrderStatusBgColor } from '@/utils/riskLevel';
import { formatDateTime } from '@/utils/date';
import { ClipboardList, User, Clock, Send, CheckCircle, Loader2, FileText, ArrowRight, AlertTriangle, MessageSquare, Calendar, CheckCheck, RotateCcw } from 'lucide-react';

interface WorkOrderFormProps {
  eventId: string;
}

export function WorkOrderForm({ eventId }: WorkOrderFormProps) {
  const { 
    getWorkOrderByEventId, 
    createWorkOrder, 
    updateWorkOrder,
    advanceWorkOrder,
    updateSupervision,
    submitRectificationFeedback,
    closeSupervision,
  } = useWorkOrderStore();

  const existingWorkOrder = getWorkOrderByEventId(eventId);

  const [status, setStatus] = useState<WorkOrderStatus>('pending');
  const [verifyResult, setVerifyResult] = useState('');
  const [responsibleDept, setResponsibleDept] = useState('');
  const [expectedFeedbackTime, setExpectedFeedbackTime] = useState('');
  const [handler, setHandler] = useState('');
  const [dispositionSummary, setDispositionSummary] = useState('');
  const [supervisionStatus, setSupervisionStatus] = useState<SupervisionStatus>('none');
  const [leaderComment, setLeaderComment] = useState('');
  const [leaderFeedbackDeadline, setLeaderFeedbackDeadline] = useState('');
  const [rectificationFeedback, setRectificationFeedback] = useState('');
  const [feedbackPerson, setFeedbackPerson] = useState('');
  const [closer, setCloser] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  useEffect(() => {
    if (existingWorkOrder) {
      setStatus(existingWorkOrder.status);
      setVerifyResult(existingWorkOrder.verifyResult);
      setResponsibleDept(existingWorkOrder.responsibleDept);
      setExpectedFeedbackTime(
        new Date(existingWorkOrder.expectedFeedbackTime).toISOString().slice(0, 16)
      );
      setHandler(existingWorkOrder.handler);
      setDispositionSummary(existingWorkOrder.dispositionSummary || '');
      setSupervisionStatus(existingWorkOrder.supervisionStatus || 'none');
      setLeaderComment(existingWorkOrder.leaderComment || '');
      if (existingWorkOrder.leaderFeedbackDeadline) {
        setLeaderFeedbackDeadline(
          new Date(existingWorkOrder.leaderFeedbackDeadline).toISOString().slice(0, 16)
        );
      }
      setRectificationFeedback(existingWorkOrder.rectificationFeedback || '');
      setFeedbackPerson(existingWorkOrder.feedbackPerson || '');
      setCloser(existingWorkOrder.closer || '');
    } else {
      const defaultTime = new Date(Date.now() + 4 * 60 * 60 * 1000);
      setExpectedFeedbackTime(defaultTime.toISOString().slice(0, 16));
    }
  }, [eventId, existingWorkOrder]);

  const handleStatusChange = (newStatus: WorkOrderStatus) => {
    setStatus(newStatus);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const workOrderData = {
      status,
      verifyResult,
      responsibleDept,
      expectedFeedbackTime: new Date(expectedFeedbackTime),
      handler,
      dispositionSummary,
      supervisionStatus,
      leaderComment: leaderComment || undefined,
      leaderFeedbackDeadline: leaderFeedbackDeadline ? new Date(leaderFeedbackDeadline) : undefined,
      rectificationFeedback: rectificationFeedback || undefined,
      feedbackPerson: feedbackPerson || undefined,
      closer: closer || undefined,
    };

    const operator = handler || '值班员';

    if (existingWorkOrder) {
      updateWorkOrder(eventId, workOrderData, operator);
    } else {
      createWorkOrder(eventId, workOrderData);
    }

    setTimeout(() => {
      setIsSubmitting(false);
    }, 500);
  };

  const canGoToNextStatus = () => {
    if (status === 'pending') {
      return verifyResult.trim().length > 0;
    }
    if (status === 'processing') {
      return responsibleDept && verifyResult.trim().length > 0;
    }
    return true;
  };

  const nextStatus = (): WorkOrderStatus | null => {
    if (status === 'pending') return 'processing';
    if (status === 'processing') return 'responded';
    return null;
  };

  const handleQuickNextStep = async () => {
    if (!canGoToNextStatus()) return;
    
    setIsAdvancing(true);
    
    const operator = handler || '值班员';
    const formData: Partial<any> = {
      verifyResult,
      responsibleDept,
      expectedFeedbackTime: new Date(expectedFeedbackTime),
      handler: handler || operator,
      dispositionSummary: dispositionSummary || undefined,
      supervisionStatus,
    };
    
    const success = advanceWorkOrder(eventId, formData, operator);
    
    if (success) {
      setTimeout(() => {
        setIsAdvancing(false);
        const updated = getWorkOrderByEventId(eventId);
        if (updated) {
          setStatus(updated.status);
          setVerifyResult(updated.verifyResult);
          setResponsibleDept(updated.responsibleDept);
          setHandler(updated.handler);
          setSupervisionStatus(updated.supervisionStatus);
          if (updated.expectedFeedbackTime) {
            setExpectedFeedbackTime(new Date(updated.expectedFeedbackTime).toISOString().slice(0, 16));
          }
          if (updated.dispositionSummary) {
            setDispositionSummary(updated.dispositionSummary);
          }
        } else {
          setStatus('processing');
        }
      }, 300);
    } else {
      setIsAdvancing(false);
    }
  };

  const handleSupervisionChange = (newStatus: SupervisionStatus) => {
    setSupervisionStatus(newStatus);
    
    if (!existingWorkOrder) return;
    
    const operator = handler || '值班员';
    const data: any = {};
    
    if (leaderComment) {
      data.leaderComment = leaderComment;
    }
    if (leaderFeedbackDeadline) {
      data.leaderFeedbackDeadline = new Date(leaderFeedbackDeadline);
    }
    if (rectificationFeedback) {
      data.rectificationFeedback = rectificationFeedback;
    }
    if (feedbackPerson) {
      data.feedbackPerson = feedbackPerson;
    }
    if (closer) {
      data.closer = closer;
    }
    
    updateSupervision(eventId, newStatus, data, operator);
  };

  const handleSubmitFeedback = () => {
    if (!rectificationFeedback.trim()) return;
    const operator = handler || '值班员';
    submitRectificationFeedback(eventId, rectificationFeedback, feedbackPerson || operator, operator);
  };

  const handleCloseSupervision = () => {
    const operator = handler || '值班员';
    closeSupervision(eventId, closer || operator, operator);
  };

  const getSupervisionBtnClass = (s: SupervisionStatus) => {
    if (supervisionStatus !== s) return 'bg-deep-blue-600 text-text-secondary hover:bg-card-border';
    switch (s) {
      case 'none': return 'bg-deep-blue-500 text-text-primary border border-card-border';
      case 'needReport': return 'bg-risk-high/20 text-risk-high border border-risk-high/30';
      case 'reported': return 'bg-risk-medium/20 text-risk-medium border border-risk-medium/30';
      case 'leaderCommented': return 'bg-tech-blue/20 text-tech-blue border border-tech-blue/30';
      case 'feedbackSubmitted': return 'bg-risk-low/20 text-risk-low border border-risk-low/30';
      case 'closed': return 'bg-risk-resolved/20 text-risk-resolved border border-risk-resolved/30';
      default: return 'bg-deep-blue-500 text-text-primary';
    }
  };

  return (
    <Card className="animate-slide-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-tech-blue" />
          处置工单
        </Card.Title>
        <div className="flex items-center gap-2">
          {existingWorkOrder && (
            <Badge variant={status} className={getWorkOrderStatusBgColor(status)}>
              {WORK_ORDER_STATUS_LABELS[status]}
            </Badge>
          )}
          {existingWorkOrder && supervisionStatus !== 'none' && (
            <Badge size="sm" className={`${supervisionStatus === 'closed' ? 'bg-risk-resolved/20 text-risk-resolved' : supervisionStatus === 'feedbackSubmitted' ? 'bg-risk-low/20 text-risk-low' : 'bg-tech-blue/20 text-tech-blue'}`}>
              <AlertTriangle className="w-3 h-3 mr-1" />
              {SUPERVISION_STATUS_LABELS[supervisionStatus]}
            </Badge>
          )}
        </div>
      </Card.Header>
      <Card.Content>
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            {(['pending', 'processing', 'responded'] as WorkOrderStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  status === s
                    ? `${getWorkOrderStatusBgColor(s)} ${getWorkOrderStatusColor(s)} border`
                    : 'bg-deep-blue-600 text-text-secondary hover:bg-card-border'
                }`}
              >
                {WORK_ORDER_STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {nextStatus() && (
            <Button
              variant="success"
              size="sm"
              className="w-full mb-4"
              onClick={handleQuickNextStep}
              disabled={!canGoToNextStatus() || isAdvancing || isSubmitting}
            >
              {isAdvancing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  {status === 'pending' && '核实完成，进入处理中'}
                  {status === 'processing' && '处置完成，标记已回应'}
                </>
              )}
            </Button>
          )}

          <div>
            <label className="block text-sm text-text-secondary mb-2">
              核实情况
              <span className="text-risk-high ml-1">*</span>
            </label>
            <textarea
              value={verifyResult}
              onChange={(e) => setVerifyResult(e.target.value)}
              placeholder="请输入核实情况..."
              className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-tech-blue resize-none h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                责任部门
                {status !== 'pending' && <span className="text-risk-high ml-1">*</span>}
              </label>
              <select
                value={responsibleDept}
                onChange={(e) => setResponsibleDept(e.target.value)}
                className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-tech-blue"
              >
                <option value="">请选择责任部门</option>
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2">
                <Clock className="w-3 h-3 inline mr-1" />
                预计反馈时间
              </label>
              <input
                type="datetime-local"
                value={expectedFeedbackTime}
                onChange={(e) => setExpectedFeedbackTime(e.target.value)}
                className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-tech-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">
              <User className="w-3 h-3 inline mr-1" />
              处理人
            </label>
            <input
              type="text"
              value={handler}
              onChange={(e) => setHandler(e.target.value)}
              placeholder="请输入处理人姓名"
              className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-tech-blue"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">
              <FileText className="w-3 h-3 inline mr-1" />
              处置摘要
              {status === 'responded' && <span className="text-risk-high ml-1">*</span>}
            </label>
            <textarea
              value={dispositionSummary}
              onChange={(e) => setDispositionSummary(e.target.value)}
              placeholder="请输入处置措施摘要，将用于日报汇总..."
              className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-tech-blue resize-none h-20"
            />
            <p className="text-xs text-text-muted mt-1">
              处置摘要会展示在日报中，建议简洁明了地说明采取的措施和结果
            </p>
          </div>

          <div className="border-t border-card-border pt-4 mt-4">
            <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-risk-medium" />
              领导督办（闭环流程）
            </h4>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
              {(['none', 'needReport', 'reported', 'leaderCommented', 'feedbackSubmitted', 'closed'] as SupervisionStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSupervisionChange(s)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${getSupervisionBtnClass(s)}`}
                >
                  {SUPERVISION_STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {(supervisionStatus === 'leaderCommented' || supervisionStatus === 'feedbackSubmitted' || supervisionStatus === 'closed') && (
              <div className="space-y-3 mb-3">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">
                    <MessageSquare className="w-3 h-3 inline mr-1" />
                    领导批示内容
                  </label>
                  <textarea
                    value={leaderComment}
                    onChange={(e) => setLeaderComment(e.target.value)}
                    placeholder="请输入领导批示内容..."
                    className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-tech-blue resize-none h-20"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-2">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    要求反馈时间
                  </label>
                  <input
                    type="datetime-local"
                    value={leaderFeedbackDeadline}
                    onChange={(e) => setLeaderFeedbackDeadline(e.target.value)}
                    className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-tech-blue"
                  />
                </div>
              </div>
            )}

            {(supervisionStatus === 'feedbackSubmitted' || supervisionStatus === 'closed') && (
              <div className="space-y-3 mb-3 bg-tech-blue/5 border border-tech-blue/20 rounded-lg p-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">
                    <CheckCheck className="w-3 h-3 inline mr-1" />
                    整改反馈内容
                  </label>
                  <textarea
                    value={rectificationFeedback}
                    onChange={(e) => setRectificationFeedback(e.target.value)}
                    placeholder="请输入整改完成情况反馈..."
                    className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-tech-blue resize-none h-20"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-2">
                    <User className="w-3 h-3 inline mr-1" />
                    反馈人
                  </label>
                  <input
                    type="text"
                    value={feedbackPerson}
                    onChange={(e) => setFeedbackPerson(e.target.value)}
                    placeholder="请输入反馈人姓名"
                    className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-tech-blue"
                  />
                </div>
                {supervisionStatus !== 'closed' && (
                  <Button
                    variant="success"
                    size="sm"
                    className="w-full"
                    onClick={handleSubmitFeedback}
                    disabled={!rectificationFeedback.trim()}
                  >
                    <CheckCheck className="w-4 h-4" />
                    提交整改反馈
                  </Button>
                )}
              </div>
            )}

            {supervisionStatus === 'closed' && (
              <div className="space-y-3 bg-risk-resolved/5 border border-risk-resolved/20 rounded-lg p-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">
                    <RotateCcw className="w-3 h-3 inline mr-1" />
                    办结人
                  </label>
                  <input
                    type="text"
                    value={closer}
                    onChange={(e) => setCloser(e.target.value)}
                    placeholder="请输入办结人姓名（确认闭环）"
                    className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-risk-resolved"
                  />
                </div>
                {existingWorkOrder?.closeTime && (
                  <div className="text-xs text-risk-resolved flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    办结时间：{formatDateTime(existingWorkOrder.closeTime)}
                  </div>
                )}
              </div>
            )}

            {supervisionStatus === 'feedbackSubmitted' && existingWorkOrder?.rectificationFeedback && (
              <Button
                variant="success"
                size="sm"
                className="w-full mt-3"
                onClick={handleCloseSupervision}
              >
                <CheckCircle className="w-4 h-4" />
                确认办结，关闭督办
              </Button>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {existingWorkOrder && (
              <div className="text-xs text-text-muted mr-auto self-center">
                创建时间：{formatDateTime(existingWorkOrder.createdAt)}
              </div>
            )}
            <Button 
              variant="primary" 
              size="md" 
              onClick={handleSubmit}
              disabled={isSubmitting || isAdvancing}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  提交中
                </>
              ) : existingWorkOrder ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  保存更新
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  创建工单
                </>
              )}
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
