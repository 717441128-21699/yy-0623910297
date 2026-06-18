import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { WORK_ORDER_STATUS_LABELS, DEPARTMENT_OPTIONS } from '@/types/workOrder';
import { getWorkOrderStatusColor, getWorkOrderStatusBgColor } from '@/utils/riskLevel';
import { formatDateTime } from '@/utils/date';
import { ClipboardList, User, Clock, Send, CheckCircle, Loader2 } from 'lucide-react';
import type { WorkOrderStatus } from '@/types/workOrder';

interface WorkOrderFormProps {
  eventId: string;
}

export function WorkOrderForm({ eventId }: WorkOrderFormProps) {
  const { 
    workOrders, 
    getWorkOrderByEventId, 
    getHistoryByEventId,
    createWorkOrder, 
    updateWorkOrder, 
    addHistoryRecord 
  } = useWorkOrderStore();

  const existingWorkOrder = getWorkOrderByEventId(eventId);
  const history = getHistoryByEventId(eventId);

  const [status, setStatus] = useState<WorkOrderStatus>('pending');
  const [verifyResult, setVerifyResult] = useState('');
  const [responsibleDept, setResponsibleDept] = useState('');
  const [expectedFeedbackTime, setExpectedFeedbackTime] = useState('');
  const [handler, setHandler] = useState('');
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
    } else {
      const defaultTime = new Date(Date.now() + 4 * 60 * 60 * 1000);
      setExpectedFeedbackTime(defaultTime.toISOString().slice(0, 16));
    }
  }, [eventId, existingWorkOrder, workOrders]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const workOrderData = {
      status,
      verifyResult,
      responsibleDept,
      expectedFeedbackTime: new Date(expectedFeedbackTime),
      handler,
    };

    if (existingWorkOrder) {
      updateWorkOrder(eventId, workOrderData);
      addHistoryRecord(eventId, {
        action: '更新工单',
        operator: handler || '值班员',
        remark: remark || '更新了工单信息',
        timestamp: new Date(),
      });
    } else {
      createWorkOrder(eventId, workOrderData);
    }

    if (remark) {
      addHistoryRecord(eventId, {
        action: '添加备注',
        operator: handler || '值班员',
        remark,
        timestamp: new Date(),
      });
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setRemark('');
    }, 500);
  };

  const handleStatusChange = (newStatus: WorkOrderStatus) => {
    setStatus(newStatus);
    const statusLabels: Record<WorkOrderStatus, string> = {
      pending: '标记为待核实',
      processing: '标记为处理中',
      responded: '标记为已回应',
    };
    addHistoryRecord(eventId, {
      action: statusLabels[newStatus],
      operator: handler || '值班员',
      remark: `状态变更为${WORK_ORDER_STATUS_LABELS[newStatus]}`,
      timestamp: new Date(),
    });
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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  status === s
                    ? `${getWorkOrderStatusBgColor(s)} ${getWorkOrderStatusColor(s)} border`
                    : 'bg-deep-blue-600 text-text-secondary hover:bg-card-border'
                }`}
              >
                {WORK_ORDER_STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">核实情况</label>
            <textarea
              value={verifyResult}
              onChange={(e) => setVerifyResult(e.target.value)}
              placeholder="请输入核实情况..."
              className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-tech-blue resize-none h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">责任部门</label>
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
            <label className="block text-sm text-text-secondary mb-2">处置备注</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请输入本次操作的备注说明..."
              className="w-full bg-deep-blue-600 border border-card-border rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-tech-blue resize-none h-20"
            />
          </div>

          <div className="flex justify-end gap-3">
            {existingWorkOrder && (
              <div className="text-xs text-text-muted mr-auto">
                创建时间：{formatDateTime(existingWorkOrder.createdAt)}
              </div>
            )}
            <Button variant="secondary" size="md">
              取消
            </Button>
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
                  更新工单
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
