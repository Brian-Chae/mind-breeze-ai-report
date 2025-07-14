import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Brain, Home, Eye, Database, FileText, ChevronLeft, Settings, Grid3X3, LogOut, User } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { useUIStore } from '../../stores/uiStore';
import type { MenuId } from '../../stores/uiStore';
import { useAuth } from '../AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeMenu, setActiveMenu } = useUIStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const menuItems = [
    { icon: Home, label: 'HOME', id: 'engine' as MenuId, path: '/app/dashboard' },
    { icon: Brain, label: 'LINK BAND', id: 'linkband' as MenuId, path: '/app/device' },
    { icon: Eye, label: 'VISUALIZER', id: 'visualizer' as MenuId, path: '/app/visualizer' },
    { icon: Database, label: 'DATA CENTER', id: 'datacenter' as MenuId, path: '/app/datacenter' },
    { icon: FileText, label: 'DOCUMENTS', id: 'cloudmanager' as MenuId, path: '/app/documents' },
    { icon: Grid3X3, label: 'APPLICATIONS', id: 'applications' as MenuId, path: '/app/applications' },
    { icon: Settings, label: 'SETTINGS', id: 'settings' as MenuId, path: '/app/settings' },
  ];

  return (
    <div className={cn(
      "bg-sidebar border-r border-sidebar-border transition-all duration-300 h-screen flex flex-col",
      isCollapsed ? "w-16" : "w-60"
    )}>
      {/* Header - 고정 */}
      <div className="flex-shrink-0 px-4 py-6 border-sidebar-border h-16 flex items-center">
        <div className="flex items-center justify-between w-full">
          {!isCollapsed && (
            <h1 className="text-sidebar-foreground font-semibold text-left text-lg ml-2">
              MIND BREEZE AI
            </h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent rounded-l-md rounded-r-none shadow-md bg-sidebar-accent/20 border-r-0"
          >
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform",
              isCollapsed && "rotate-180"
            )} />
          </Button>
        </div>
      </div>

      {/* Separator */}
      <div className="flex-shrink-0 px-6 py-4">
        <div className="h-px bg-sidebar-border"></div>
      </div>

      {/* Navigation - 스크롤 가능 (필요시) */}
      <nav 
        className="flex-1 py-6 space-y-2 overflow-y-auto" 
        style={{ 
          paddingLeft: isCollapsed ? '0.75rem' : '1.5rem', 
          paddingRight: '1rem' 
        }}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full gap-3 h-12 !justify-start transition-all duration-200",
                isActive 
                  ? "bg-white text-black shadow-sm border border-gray-200 hover:bg-white hover:text-black" 
                  : "text-sidebar-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-sidebar-foreground",
                isCollapsed && "!justify-center"
              )}
              onClick={() => {
                setActiveMenu(item.id);
                navigate(item.path);
              }}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      {/* User Profile & Logout - 하단 고정 */}
      <div className="flex-shrink-0 border-t border-sidebar-border p-4 space-y-2">
        {/* User Info */}
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg",
          isCollapsed && "justify-center"
        )}>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.displayName || user?.email || '사용자'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          className={cn(
            "w-full gap-3 h-10 !justify-start text-sidebar-foreground hover:bg-red-50 hover:text-red-600 transition-colors",
            isCollapsed && "!justify-center"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span className="flex-1 text-left">로그아웃</span>}
        </Button>
      </div>
    </div>
  );
} 