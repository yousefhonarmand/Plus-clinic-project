import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toPersianNumber } from '@/lib/persianDate';
import { timeSlots } from '@/lib/data';

interface TimeSlotPickerProps {
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  bookedSlots?: string[];
  className?: string;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedTime,
  onTimeSelect,
  bookedSlots = [],
  className,
}) => {
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);

  // Group slots by hour
  const groupedSlots: { [key: string]: string[] } = {};
  timeSlots.forEach(slot => {
    const hour = slot.split(':')[0];
    if (!groupedSlots[hour]) {
      groupedSlots[hour] = [];
    }
    groupedSlots[hour].push(slot);
  });

  const hours = Object.keys(groupedSlots);

  const isBooked = (time: string) => bookedSlots.includes(time);

  return (
    <div className={cn("bg-card rounded-2xl border border-border p-4", className)}>
      <div className="mb-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-1">انتخاب ساعت پذیرش</h4>
        <p className="text-xs text-muted-foreground">ساعات ۸ صبح تا ۱۲ شب - هر ۳۰ دقیقه</p>
      </div>

      <div className="max-h-80 overflow-y-auto scrollbar-thin">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {timeSlots.map((slot, index) => {
            const booked = isBooked(slot);
            const selected = selectedTime === slot;
            const hovered = hoveredTime === slot;

            return (
              <motion.button
                key={slot}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                onClick={() => !booked && onTimeSelect(slot)}
                onMouseEnter={() => setHoveredTime(slot)}
                onMouseLeave={() => setHoveredTime(null)}
                disabled={booked}
                className={cn(
                  "time-slot",
                  selected && "time-slot-selected",
                  booked && "time-slot-disabled",
                  !booked && !selected && hovered && "border-primary bg-primary/10",
                )}
                dir="ltr"
              >
                {slot}
              </motion.button>
            );
          })}
        </div>
      </div>

      {selectedTime && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-primary/10 rounded-lg text-center"
        >
          <span className="text-sm font-medium text-primary">
            ساعت انتخاب شده: {selectedTime}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default TimeSlotPicker;
