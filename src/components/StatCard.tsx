import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toPersianNumber, formatCurrency } from '@/lib/persianDate';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'accent';
  isCurrency?: boolean;
  suffix?: string;
  className?: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  variant = 'default',
  isCurrency = false,
  suffix = '',
  className,
  delay = 0,
}) => {
  const variantClasses = {
    default: 'stat-card',
    primary: 'stat-card stat-card-primary',
    success: 'stat-card stat-card-success',
    warning: 'stat-card stat-card-warning',
    accent: 'stat-card stat-card-accent',
  };

  const iconColors = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    accent: 'text-accent',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(variantClasses[variant], className)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <p className="text-2xl font-bold">
            {isCurrency ? formatCurrency(value) : toPersianNumber(value)}
            {suffix && <span className="text-sm font-normal mr-1">{suffix}</span>}
          </p>
        </div>
        <div className={cn("p-3 rounded-xl bg-muted", iconColors[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
