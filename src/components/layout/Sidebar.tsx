import { useState } from 'react';
import { Brain, Home, Eye, Database, FileText, ChevronLeft, Settings, Grid3X3 } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { useUIStore } from '../../stores/uiStore';
import type { MenuId } from '../../stores/uiStore';

export function Sidebar() {
  const { activeMenu, setActiveMenu } = useUIStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: Home, label: 'HOME', id: 'engine' as MenuId },
    { icon: Brain, label: 'LINK BAND', id: 'linkband' as MenuId },
    { icon: Eye, label: 'VISUALIZER', id: 'visualizer' as MenuId },
    { icon: Database, label: 'DATA CENTER', id: 'datacenter' as MenuId },
    { icon: FileText, label: 'DOCUMENTS', id: 'cloudmanager' as MenuId },
    { icon: Grid3X3, label: 'APPLICATIONS', id: 'applications' as MenuId },
    { icon: Settings, label: 'SETTINGS', id: 'settings' as MenuId },
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
            <h1 className="text-sidebar-foreground font-semibold text-left text-xl ml-2">
              LINK BAND SDK
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
          const isActive = activeMenu === item.id;
          
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
              onClick={() => setActiveMenu(item.id)}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
            </Button>
          );
        })}
      </nav>
    </div>
  );
} 