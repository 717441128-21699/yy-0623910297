import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { WORK_ORDER_STATUS_LABELS, DEPARTMENT_OPTIONS } from '@/types/workOrder';
import type { WorkOrderStatus } from '@/types/workOrder';
import { getWorkOrderStatusColor, getWorkOrderStatusBgColor } from '@/utils/riskLevel';
import { formatDateTime } from '@/utils/date';
import { ClipboardList, User, Clock, Send, CheckCircle, Loader2, FileText } from 'lucide-react';

interface WorkOrderFormProps {
  eventId: string;
}

export function WorkOrderForm({ eventId }: WorkOrderFormProps) {
  const { 
    getWorkOrderByEventId, 
    createWorkOrder, 
    updateWorkOrder,
  } = useWorkOrderStore();

  const existingWorkOrder = getWorkOrderByEventId(eventId);

  const [status, setStatus] = useState<WorkOrderStatus>('pending');
  const [verifyResult, setVerifyResult] = useState('');
  const [responsibleDept, setResponsibleDept] = useState('');
  const [expectedFeedbackTime, setExpectedFeedbackTime] = useState('');
  const [handler, setHandler] = useState('');
  const [dispositionSummary, setDispositionSummary] = useState('');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    };

    const operator = handler || '值班员';

    if (existingWorkOrder) {
      updateWorkOrder(eventId, workOrderData, operator);
    } else {
      createWorkOrder(eventId, workOrderData);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setRemark('');
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

  const handleQuickNextStep = () => {
    const next = nextStatus();
    if (!next) return;
    
    setStatus(next);
    
    setTimeout(() => {
      handleSubmit();
    }, 100);
  };

  return (
    <Card className="animate-slide-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-tech-blue" />
          处置工单
        </Card.Title>
        {existingWorkOrder && (
          <Badge variant={status} className={getWorkOrderStatusBgColor(status)}>
            {WORK_ORDER_STATUS_LABELS[status]}
          </Badge>
        )}
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
              disabled={!canGoToNextStatus() || isSubmitting}
            >
              {status === 'pending' && '核实完成，进入处理中'}
              {status === 'processing' && '处置完成，标记已回应'}
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

          <div>
            <label className="block text-sm text-text-secondary mb-2">本次操作备注</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="可选：填写本次操作的补充说明..."
              className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-tech-blue resize-none h-16"
            />
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
              disabled={isSubmitting}
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
