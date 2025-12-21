import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  toPersianDate,
  toGregorianDate,
  getPersianMonthName,
  getPersianWeekDays,
  getDaysInPersianMonth,
  getFirstDayOfPersianMonth,
  toPersianNumber,
  isToday,
  isSameDay,
} from '@/lib/persianDate';

interface PersianCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  className?: string;
}

const PersianCalendar: React.FC<PersianCalendarProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  disabledDates = [],
  className,
}) => {
  const [viewDate, setViewDate] = useState(() => {
    const persian = toPersianDate(selectedDate);
    return { jy: persian.jy, jm: persian.jm };
  });

  const weekDays = getPersianWeekDays();

  const days = useMemo(() => {
    const daysInMonth = getDaysInPersianMonth(viewDate.jy, viewDate.jm);
    const firstDay = getFirstDayOfPersianMonth(viewDate.jy, viewDate.jm);
    
    const daysArray: (number | null)[] = [];
    
    // Add empty slots for days before the first day
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null);
    }
    
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(i);
    }
    
    return daysArray;
  }, [viewDate.jy, viewDate.jm]);

  const handlePrevMonth = () => {
    setViewDate(prev => {
      if (prev.jm === 1) {
        return { jy: prev.jy - 1, jm: 12 };
      }
      return { jy: prev.jy, jm: prev.jm - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewDate(prev => {
      if (prev.jm === 12) {
        return { jy: prev.jy + 1, jm: 1 };
      }
      return { jy: prev.jy, jm: prev.jm + 1 };
    });
  };

  const isDateDisabled = (day: number): boolean => {
    const date = toGregorianDate(viewDate.jy, viewDate.jm, day);
    
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDates.some(d => isSameDay(d, date))) return true;
    
    return false;
  };

  const handleDayClick = (day: number) => {
    if (isDateDisabled(day)) return;
    const date = toGregorianDate(viewDate.jy, viewDate.jm, day);
    onDateSelect(date);
  };

  const selectedPersian = toPersianDate(selectedDate);
  const isSelectedMonth = selectedPersian.jy === viewDate.jy && selectedPersian.jm === viewDate.jm;

  return (
    <div className={cn("bg-card rounded-2xl border border-border p-4 shadow-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <span className="text-lg font-semibold">
            {getPersianMonthName(viewDate.jm)} {toPersianNumber(viewDate.jy)}
          </span>
        </div>
        
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewDate.jy}-${viewDate.jm}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-1"
        >
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const date = toGregorianDate(viewDate.jy, viewDate.jm, day);
            const isSelected = isSelectedMonth && selectedPersian.jd === day;
            const isTodayDate = isToday(date);
            const disabled = isDateDisabled(day);

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                disabled={disabled}
                className={cn(
                  "aspect-square rounded-lg text-sm font-medium transition-all duration-200",
                  "flex items-center justify-center",
                  disabled && "opacity-30 cursor-not-allowed",
                  !disabled && !isSelected && "hover:bg-primary/10",
                  isSelected && "bg-primary text-primary-foreground shadow-md",
                  isTodayDate && !isSelected && "border-2 border-primary",
                )}
              >
                {toPersianNumber(day)}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PersianCalendar;
