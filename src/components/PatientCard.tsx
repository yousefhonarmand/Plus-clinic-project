import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Clock, User, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PatientWithPayments } from '@/hooks/usePatients';
import { formatCurrency } from '@/lib/persianDate';
import { Button } from '@/components/ui/button';

interface PatientCardProps {
  patient: PatientWithPayments;
  onEdit: (patient: PatientWithPayments) => void;
  index?: number;
  compact?: boolean;
  className?: string;
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onEdit,
  index = 0,
  compact = false,
  className,
}) => {
  const statusColors = {
    paid: 'badge-success',
    partial: 'badge-warning',
    pending: 'badge-primary',
  };

  const statusText = {
    paid: 'تسویه کامل',
    partial: 'بیعانه',
    pending: 'در انتظار',
  };

  const status = patient.status as 'paid' | 'partial' | 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn("patient-row", className)}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Patient Info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-lg">
              {patient.full_name}
            </h4>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              {patient.surgery_type}
            </p>
          </div>
        </div>

        {/* Details */}
        {!compact && (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{patient.surgery_time || '-'}</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span>{patient.doctor}</span>
            <span className="text-muted-foreground">|</span>
            <span>{patient.clinic}</span>
          </div>
        )}

        {/* Payment Status & Amount */}
        <div className="flex items-center gap-4">
          <div className="text-left">
            <p className="text-sm text-muted-foreground">پرداختی</p>
            <p className="font-semibold text-success">
              {formatCurrency(patient.totalPaid)} <span className="text-xs">تومان</span>
            </p>
          </div>
          
          {patient.remainingBalance > 0 && (
            <div className="text-left">
              <p className="text-sm text-muted-foreground">باقی‌مانده</p>
              <p className="font-semibold text-warning">
                {formatCurrency(patient.remainingBalance)} <span className="text-xs">تومان</span>
              </p>
            </div>
          )}

          <span className={cn(statusColors[status])}>
            {statusText[status]}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(patient)}
            className="gap-2"
          >
            <Edit2 className="w-4 h-4" />
            ویرایش
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default PatientCard;
