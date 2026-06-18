import { useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useDashboardStore } from '@/store/useDashboardStore';
import { FilterBar } from './FilterBar';
import { RiskOverview } from './RiskOverview';
import { HotWords } from './HotWords';
import { RiskList } from './RiskList';
import { AlertStream } from './AlertStream';

export default function Dashboard() {
  const { events, hotWords, fetchEvents } = useDashboardStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <PageContainer>
      <FilterBar />
      <RiskOverview events={events} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <RiskList events={events} />
        </div>
        <div className="space-y-6">
          <HotWords words={hotWords} />
          <AlertStream events={events} />
        </div>
      </div>
    </PageContainer>
  );
}
