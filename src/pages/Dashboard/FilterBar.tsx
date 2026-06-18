import { Calendar, MapPin, LayoutGrid } from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { SCENIC_OPTIONS, PLATFORM_LABELS, type Platform } from '@/types/event';
import { formatDate } from '@/utils/date';

export function FilterBar() {
  const {
    selectedScenic,
    selectedDate,
    selectedPlatforms,
    setSelectedScenic,
    setSelectedDate,
    togglePlatform,
  } = useDashboardStore();

  const platforms: Platform[] = ['weibo', 'douyin', 'xiaohongshu', 'dianping'];

  return (
    <div className="bg-card-bg border border-card-border rounded-lg p-4 mb-6 animate-fade-in">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-text-secondary" />
          <label className="text-sm text-text-secondary">景区：</label>
          <select
            value={selectedScenic}
            onChange={(e) => setSelectedScenic(e.target.value)}
            className="bg-deep-blue-600 border border-card-border rounded px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-tech-blue"
          >
            {SCENIC_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-secondary" />
          <label className="text-sm text-text-secondary">日期：</label>
          <input
            type="date"
            value={formatDate(selectedDate)}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="bg-deep-blue-600 border border-card-border rounded px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-tech-blue"
          />
        </div>

        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-text-secondary" />
          <label className="text-sm text-text-secondary">平台：</label>
          <div className="flex gap-2">
            {platforms.map((platform) => (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={`px-3 py-1.5 text-xs rounded border transition-all ${
                  selectedPlatforms.includes(platform)
                    ? 'bg-tech-blue/20 border-tech-blue text-tech-blue'
                    : 'bg-deep-blue-600 border-card-border text-text-secondary hover:border-tech-blue/50'
                }`}
              >
                {PLATFORM_LABELS[platform]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
