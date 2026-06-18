import { Shield, Bell, User, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/dashboard': '首页态势',
  '/event': '事件详情',
  '/report': '日报中心',
};

export function Header() {
  const location = useLocation();
  const path = location.pathname.split('/')[1] || 'dashboard';
  const currentPage = pageTitles[`/${path}`] || '首页态势';

  return (
    <header className="h-16 bg-card-bg border-b border-card-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-tech-blue" />
          <h1 className="text-xl font-bold text-text-primary font-sans">
            景区舆情哨兵
          </h1>
        </div>
        <div className="h-6 w-px bg-card-border mx-4" />
        <span className="text-text-secondary text-sm">{currentPage}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Bell className="w-5 h-5 text-text-secondary hover:text-text-primary cursor-pointer transition-colors" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-risk-high rounded-full text-[10px] text-white flex items-center justify-center">
            3
          </span>
        </div>
        <Settings className="w-5 h-5 text-text-secondary hover:text-text-primary cursor-pointer transition-colors" />
        <div className="h-6 w-px bg-card-border mx-2" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-tech-blue/20 flex items-center justify-center">
            <User className="w-4 h-4 text-tech-blue" />
          </div>
          <div>
            <p className="text-sm text-text-primary font-medium">值班员</p>
            <p className="text-xs text-text-muted">在线</p>
          </div>
        </div>
      </div>
    </header>
  );
}
