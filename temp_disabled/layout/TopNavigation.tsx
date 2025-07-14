import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { Badge } from '../ui/badge';
import { ChevronRight, Cpu, Brain, Nfc } from 'lucide-react';

interface TopNavigationProps {
  menuName: string;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ menuName }) => {
  
  // Get active menu for navigation breadcrumb
  const activeMenu = useUIStore((state) => state.activeMenu);
  
  // Convert menu id to display name
  const getMenuDisplayName = (menuId: string) => {
    const menuNames: Record<string, string> = {
      'engine': 'HOME',
      'linkband': 'LINK BAND',
      'visualizer': 'VISUALIZER',
      'datacenter': 'DATA CENTER',
      'cloudmanager': 'DOCUMENTS',
      'applications': 'APPLICATIONS',
      'settings': 'SETTINGS'
    };
    return menuNames[menuId] || menuId.toUpperCase();
  };
  
  return (
    <header className="bg-card border-b border-border px-8 py-4 top-nav-container">
      <div className="flex items-center h-12">
        {/* Left side - Breadcrumb */}
        <div className="flex items-center space-x-3 top-nav-breadcrumb">
          <h2 className="text-sm font-medium text-foreground">LINK BAND SDK</h2>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {getMenuDisplayName(menuName || activeMenu)}
          </span>
        </div>

        {/* Spacer to push right content to the right */}
        <div className="flex-1"></div>

        {/* Right side - Status indicators */}
        <div className="flex items-center space-x-8 top-nav-status">
          {/* Engine Status */}
          <div className="flex items-center space-x-3 min-w-[120px]">
            <Cpu className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground min-w-[50px]">Engine:</span>
            <Badge 
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 px-3 py-1 text-xs min-w-[70px] justify-center"
            >
              Stopped
            </Badge>
          </div>

          {/* Device Connection Status */}
          <div className="flex items-center space-x-3 min-w-[140px]">
            <Brain className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground min-w-[70px]">LINK BAND:</span>
            <Badge 
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 px-3 py-1 text-xs min-w-[90px] justify-center"
            >
              Disconnected
            </Badge>
          </div>

          {/* Sensor Contact Status */}
          <div className="flex items-center space-x-3 min-w-[150px]">
            <Nfc className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground min-w-[90px]">Sensor Contact:</span>
            <Badge 
              variant="outline"
              className="bg-gray-600 hover:bg-gray-700 px-3 py-1 text-xs min-w-[30px] justify-center"
            >
              -
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
} 