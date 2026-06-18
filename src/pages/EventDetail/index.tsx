import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { getEventById } from '@/data/mockEvents';
import { OriginalPost } from './OriginalPost';
import { SpreadAnalysis } from './SpreadAnalysis';
import { WorkOrderForm } from './WorkOrderForm';
import { HistoryTimeline } from './HistoryTimeline';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const event = id ? getEventById(id) : undefined;

  if (!event) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-text-secondary mb-4">未找到该事件</p>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
          返回态势首页
        </Button>
      </div>

      <div className="space-y-6">
        <OriginalPost event={event} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpreadAnalysis eventId={event.id} />
          <HistoryTimeline eventId={event.id} />
        </div>

        <WorkOrderForm eventId={event.id} />
      </div>
    </PageContainer>
  );
}
