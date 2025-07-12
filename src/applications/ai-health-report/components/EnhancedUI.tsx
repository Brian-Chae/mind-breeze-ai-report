/**
 * 향상된 UI 컴포넌트
 * - 부드러운 애니메이션 효과
 * - 접근성 개선
 * - 사용자 경험 향상
 * - 반응형 디자인
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  Loader2,
  ChevronUp,
  ChevronDown,
  Star,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

// 애니메이션 변형
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

// 알림 타입
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationProps {
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive';
  }>;
}

// 향상된 알림 컴포넌트
export const EnhancedNotification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  actions
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      {...fadeInUp}
      className={`fixed top-4 right-4 z-50 max-w-md w-full shadow-lg rounded-lg border ${getColorClasses()}`}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getIcon()}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{title}</h4>
              <p className="text-sm mt-1 opacity-90">{message}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose?.(), 300);
            }}
            className="h-6 w-6 p-0 hover:bg-black/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {actions && actions.length > 0 && (
          <div className="flex gap-2 mt-3">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                className="h-7 text-xs"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      
      {duration > 0 && (
        <div className="h-1 bg-black/10 rounded-b-lg overflow-hidden">
          <motion.div
            className="h-full bg-current opacity-50"
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}
    </motion.div>
  );
};

// 향상된 점수 표시 컴포넌트
export interface ScoreDisplayProps {
  score: number;
  maxScore?: number;
  label: string;
  showTrend?: boolean;
  trendDirection?: 'up' | 'down' | 'stable';
  trendValue?: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const EnhancedScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  maxScore = 100,
  label,
  showTrend = false,
  trendDirection = 'stable',
  trendValue = 0,
  size = 'md',
  animated = true
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const percentage = (score / maxScore) * 100;

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayScore(score);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDisplayScore(score);
    }
  }, [score, animated]);

  const getScoreColor = () => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 55) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = () => {
    if (percentage >= 85) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 55) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <motion.div
      {...scaleIn}
      className="text-center space-y-2"
    >
      <div className="relative">
        <motion.div
          className={`font-bold ${getScoreColor()} ${sizeClasses[size]}`}
          initial={animated ? { scale: 0 } : {}}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          {animated ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {displayScore}
            </motion.span>
          ) : (
            score
          )}
          <span className="text-sm text-gray-500">/{maxScore}</span>
        </motion.div>
        
        {showTrend && (
          <div className="flex items-center justify-center gap-1 mt-1">
            {getTrendIcon()}
            <span className="text-xs text-gray-600">
              {trendValue > 0 ? '+' : ''}{trendValue}
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${getProgressColor()} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </motion.div>
  );
};

// 향상된 카드 컴포넌트
export interface EnhancedCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  collapsible?: boolean;
  defaultExpanded?: boolean;
  loading?: boolean;
  className?: string;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  title,
  children,
  icon,
  badge,
  badgeVariant = 'default',
  collapsible = false,
  defaultExpanded = true,
  loading = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      {...fadeInUp}
      className={`group ${className}`}
    >
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader 
          className={`${collapsible ? 'cursor-pointer' : ''}`}
          onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
              {badge && (
                <Badge variant={badgeVariant} className="ml-2">
                  {badge}
                </Badge>
              )}
            </CardTitle>
            
            {collapsible && (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronUp className="w-4 h-4 text-gray-500" />
              </motion.div>
            )}
          </div>
        </CardHeader>
        
        <AnimatePresence>
          {(!collapsible || isExpanded) && (
            <motion.div
              initial={collapsible ? { height: 0, opacity: 0 } : {}}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">로딩 중...</span>
                  </div>
                ) : (
                  children
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// 향상된 로딩 컴포넌트
export interface EnhancedLoadingProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const EnhancedLoading: React.FC<EnhancedLoadingProps> = ({
  message = '로딩 중...',
  progress = 0,
  showProgress = false,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <motion.div
      {...fadeInUp}
      className="flex flex-col items-center justify-center p-8 space-y-4"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className={`${sizeClasses[size]} text-blue-600`} />
      </motion.div>
      
      <div className="text-center space-y-2">
        <p className="text-gray-600">{message}</p>
        
        {showProgress && (
          <div className="w-48 space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500">{Math.round(progress)}% 완료</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// 향상된 빈 상태 컴포넌트
export interface EnhancedEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EnhancedEmptyState: React.FC<EnhancedEmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  return (
    <motion.div
      {...fadeInUp}
      className="text-center py-12 space-y-4"
    >
      {icon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            {icon}
          </div>
        </motion.div>
      )}
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-600 max-w-md mx-auto">{description}</p>
      </div>
      
      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={action.onClick} className="mt-4">
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default {
  EnhancedNotification,
  EnhancedScoreDisplay,
  EnhancedCard,
  EnhancedLoading,
  EnhancedEmptyState
}; 