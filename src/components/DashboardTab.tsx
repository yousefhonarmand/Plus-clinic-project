import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  Clock, 
  CreditCard, 
  Wallet,
  ChevronLeft,
} from 'lucide-react';
import { Patient } from '@/lib/types';
import { 
  formatPersianDateFull, 
  formatPersianDateWithDay,
  formatCurrency, 
  toPersianNumber,
  isToday,
  getNextWeekRange,
  isDateInRange,
} from '@/lib/persianDate';
import StatCard from '@/components/StatCard';
import PatientCard from '@/components/PatientCard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DashboardTabProps {
  patients: Patient[];
  onEditPatient: (patient: Patient) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ patients, onEditPatient }) => {
  const today = new Date();
  const nextWeekRange = getNextWeekRange();

  // Calculate statistics
  const todayPatients = patients.filter(p => isToday(p.surgeryDate));
  const weekPatients = patients.filter(p => 
    isDateInRange(p.surgeryDate, nextWeekRange.start, nextWeekRange.end)
  );
  
  const pendingTodayPatients = todayPatients.filter(p => p.status !== 'paid');
  const pendingWeekPatients = weekPatients.filter(p => p.status !== 'paid');
  
  const todayPayments = todayPatients.reduce((sum, p) => {
    const todayPayment = p.payments
      .filter(pay => isToday(pay.date))
      .reduce((s, pay) => s + pay.amount, 0);
    return sum + todayPayment;
  }, 0);

  // Sort week patients by date
  const sortedWeekPatients = [...weekPatients].sort(
    (a, b) => a.surgeryDate.getTime() - b.surgeryDate.getTime()
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
                  .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
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
                      patient.surgeryDate.toDateString() !== 
                      sortedWeekPatients[index - 1].surgeryDate.toDateString()) && (
                      <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs font-medium text-muted-foreground px-2">
                          {formatPersianDateWithDay(patient.surgeryDate)}
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
