import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, FileText } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: '首页态势', icon: LayoutDashboard },
  { path: '/report', label: '日报中心', icon: FileText },
];

export function Sidebar() {
  return (
    <aside className="w-60 bg-card-bg border-r border-card-border flex flex-col">
      <div className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-tech-blue/20 text-tech-blue border border-tech-blue/30'
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary border border-transparent'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-card-border">
        <div className="bg-risk-high/10 border border-risk-high/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-risk-high" />
            <span className="text-xs font-medium text-risk-high">高风险预警</span>
          </div>
          <p className="text-xs text-text-secondary">
            当前有 <span className="text-risk-high font-bold">4</span> 条高风险事件待处理
          </p>
        </div>
      </div>
    </aside>
  );
}
