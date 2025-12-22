import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  Clock, 
  CreditCard, 
  Wallet,
} from 'lucide-react';
import { PatientWithPayments } from '@/hooks/usePatients';
import { 
  formatPersianDateWithDay,
  formatCurrency, 
  toPersianNumber,
  isSameDay,
  addDays,
} from '@/lib/persianDate';
import StatCard from '@/components/StatCard';
import PatientCard from '@/components/PatientCard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DashboardTabProps {
  patients: PatientWithPayments[];
  onEditPatient: (patient: PatientWithPayments) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ patients, onEditPatient }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Helper to check if a date string is today
  const isToday = (dateStr: string) => {
    return dateStr === todayStr;
  };

  // Helper to check if date is in next week range
  const isInNextWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const tomorrow = addDays(today, 1);
    const nextWeekEnd = addDays(today, 7);
    return date >= tomorrow && date <= nextWeekEnd;
  };

  // Calculate statistics
  const todayPatients = patients.filter(p => isToday(p.surgery_date));
  const weekPatients = patients.filter(p => isInNextWeek(p.surgery_date));
  
  const pendingTodayPatients = todayPatients.filter(p => p.status !== 'paid');
  const pendingWeekPatients = weekPatients.filter(p => p.status !== 'paid');
  
  const todayPayments = patients.reduce((sum, p) => {
    const todayPayment = p.payments
      .filter(pay => pay.date === todayStr)
      .reduce((s, pay) => s + pay.amount, 0);
    return sum + todayPayment;
  }, 0);

  // Sort week patients by date
  const sortedWeekPatients = [...weekPatients].sort(
    (a, b) => new Date(a.surgery_date).getTime() - new Date(b.surgery_date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="بیماران امروز"
          value={todayPatients.length}
          icon={Users}
          variant="primary"
          suffix="نفر"
          delay={0}
        />
        <StatCard
          title="بیماران هفته آینده"
          value={weekPatients.length}
          icon={Calendar}
          variant="accent"
          suffix="نفر"
          delay={0.1}
        />
        <StatCard
          title="در انتظار تسویه امروز"
          value={pendingTodayPatients.length}
          icon={Clock}
          variant="warning"
          suffix="نفر"
          delay={0.2}
        />
        <StatCard
          title="در انتظار تسویه هفته"
          value={pendingWeekPatients.length}
          icon={CreditCard}
          variant="warning"
          suffix="نفر"
          delay={0.3}
        />
        <StatCard
          title="جمع واریزی امروز"
          value={todayPayments}
          icon={Wallet}
          variant="success"
          isCurrency
          suffix="تومان"
          delay={0.4}
        />
      </div>

      {/* Patient Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Patients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="form-container"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              بیماران امروز
            </h3>
            <span className="text-sm text-muted-foreground">
              {formatPersianDateWithDay(today)}
            </span>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {todayPatients.length > 0 ? (
                todayPatients
                  .sort((a, b) => (a.surgery_time || '').localeCompare(b.surgery_time || ''))
                  .map((patient, index) => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      onEdit={onEditPatient}
                      index={index}
                      compact
                    />
                  ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>بیماری برای امروز ثبت نشده است</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.div>

        {/* Next Week's Patients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="form-container"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              بیماران هفته آینده
            </h3>
            <span className="text-sm text-muted-foreground">
              به ترتیب تاریخ
            </span>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {sortedWeekPatients.length > 0 ? (
                sortedWeekPatients.map((patient, index) => (
                  <div key={patient.id}>
                    {/* Date header if different from previous */}
                    {(index === 0 || 
                      patient.surgery_date !== sortedWeekPatients[index - 1].surgery_date) && (
                      <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs font-medium text-muted-foreground px-2">
                          {formatPersianDateWithDay(new Date(patient.surgery_date))}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    )}
                    <PatientCard
                      patient={patient}
                      onEdit={onEditPatient}
                      index={index}
                      compact
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>بیماری برای هفته آینده ثبت نشده است</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardTab;
