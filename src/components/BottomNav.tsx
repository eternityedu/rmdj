import { NavLink, useLocation } from 'react-router-dom';
import { Home, Building2, Brain, Wallet, StickyNote, Calendar, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Home', color: 'text-primary' },
  { path: '/companies', icon: Building2, label: 'Companies', color: 'text-investment' },
  { path: '/skills', icon: Brain, label: 'Skills', color: 'text-skills' },
  { path: '/money', icon: Wallet, label: 'Money', color: 'text-money' },
  { path: '/notes', icon: StickyNote, label: 'Notes', color: 'text-notes' },
  { path: '/daily', icon: Calendar, label: 'Daily', color: 'text-daily' },
  { path: '/founder', icon: Crown, label: 'Founder', color: 'text-founder' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-sidebar border-t border-sidebar-border z-50 lg:hidden safe-area-pb">
      <div className="flex items-center justify-around h-full px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-all min-w-[44px] min-h-[44px]",
                isActive ? "bg-sidebar-accent" : "active:bg-sidebar-accent/50"
              )}
            >
              <item.icon
                size={20}
                className={cn(
                  "transition-colors",
                  isActive ? item.color : "text-muted-foreground"
                )}
              />
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
