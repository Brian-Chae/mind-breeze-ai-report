import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface UpdateNotificationProps {
  onUpdate: () => void;
  onDismiss: () => void;
  isVisible: boolean;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  onUpdate,
  onDismiss,
  isVisible
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await onUpdate();
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-l-4 border-l-blue-500 bg-white dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  새 버전 업데이트
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  LINK BAND SDK의 새 버전이 사용 가능합니다
                </p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-4 flex space-x-2">
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                  업데이트 중...
                </>
              ) : (
                <>
                  <Download className="w-3 h-3 mr-2" />
                  지금 업데이트
                </>
              )}
            </Button>
            <Button
              onClick={onDismiss}
              variant="outline"
              size="sm"
              className="text-gray-600 dark:text-gray-300"
            >
              나중에
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateNotification; 