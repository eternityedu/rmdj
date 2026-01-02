import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, Building2, Brain, Wallet, StickyNote, Calendar, Crown, 
  Menu, X, ChevronRight
} from 'lucide-react';
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

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 lg:hidden z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="font-semibold text-lg gradient-text">RMDJ Hub</span>
        <div className="w-10" />
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-50 transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-14 lg:h-16 flex items-center px-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Crown size={18} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-base gradient-text">RMDJ Hub</h1>
                <p className="text-[10px] text-muted-foreground">Founder Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    isActive 
                      ? "bg-sidebar-accent" 
                      : "hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon 
                    size={18} 
                    className={cn(
                      "transition-colors",
                      isActive ? item.color : "text-muted-foreground group-hover:text-foreground"
                    )} 
                  />
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <ChevronRight size={14} className="ml-auto text-muted-foreground" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="glass-effect rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Solo Founder Mode</p>
              <p className="text-xs text-primary mt-1">MIT • S.I.D.S • RMDJ</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
