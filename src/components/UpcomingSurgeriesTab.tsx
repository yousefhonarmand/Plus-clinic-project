import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Search,
  Filter,
  Edit2,
  Clock,
  User,
  Building2,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PatientWithPayments } from '@/hooks/usePatients';
import {
  formatPersianDate,
  formatPersianDateWithDay,
  formatCurrency,
  toPersianNumber,
} from '@/lib/persianDate';
import PersianCalendar from '@/components/PersianCalendar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UpcomingSurgeriesTabProps {
  patients: PatientWithPayments[];
  onEditPatient: (patient: PatientWithPayments) => void;
}

interface FilterOptions {
  startDate?: Date;
  endDate?: Date;
  doctor?: string;
  clinic?: string;
  status?: string;
}

const UpcomingSurgeriesTab: React.FC<UpcomingSurgeriesTabProps> = ({
  patients,
  onEditPatient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  // Get unique doctors and clinics from patients
  const uniqueDoctors = useMemo(() => {
    const set = new Set(patients.map(p => p.doctor));
    return Array.from(set);
  }, [patients]);

  const uniqueClinics = useMemo(() => {
    const set = new Set(patients.map(p => p.clinic));
    return Array.from(set);
  }, [patients]);

  // Filter and sort patients
  const filteredPatients = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    let result = [...patients];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.full_name.toLowerCase().includes(query) ||
        p.national_code.includes(query) ||
        p.phone.includes(query)
      );
    }

    // Date range filter
    if (filters.startDate) {
      const startStr = filters.startDate.toISOString().split('T')[0];
      result = result.filter(p => p.surgery_date >= startStr);
    }
    if (filters.endDate) {
      const endStr = filters.endDate.toISOString().split('T')[0];
      result = result.filter(p => p.surgery_date <= endStr);
    }

    // Doctor filter
    if (filters.doctor) {
      result = result.filter(p => p.doctor === filters.doctor);
    }

    // Clinic filter
    if (filters.clinic) {
      result = result.filter(p => p.clinic === filters.clinic);
    }

    // Status filter
    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }

    // Sort by date (today first, then chronological)
    result.sort((a, b) => {
      const aIsToday = a.surgery_date === todayStr;
      const bIsToday = b.surgery_date === todayStr;
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      return a.surgery_date.localeCompare(b.surgery_date);
    });

    return result;
  }, [patients, searchQuery, filters]);

  // Group by date
  const groupedPatients = useMemo(() => {
    const groups: { [key: string]: PatientWithPayments[] } = {};
    filteredPatients.forEach(patient => {
      const dateKey = patient.surgery_date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(patient);
    });
    return groups;
  }, [filteredPatients]);

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const hasActiveFilters = searchQuery || Object.values(filters).some(v => v);
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="form-container"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام، کد ملی یا شماره تماس..."
              className="pr-10"
            />
          </div>

          {/* Date Range */}
          <div className="flex gap-2">
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[140px]">
                  <Calendar className="w-4 h-4 ml-2" />
                  {filters.startDate ? formatPersianDate(filters.startDate) : 'از تاریخ'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <PersianCalendar
                  selectedDate={filters.startDate || new Date()}
                  onDateSelect={(date) => {
                    setFilters({ ...filters, startDate: date });
                    setStartDateOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>

            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[140px]">
                  <Calendar className="w-4 h-4 ml-2" />
                  {filters.endDate ? formatPersianDate(filters.endDate) : 'تا تاریخ'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <PersianCalendar
                  selectedDate={filters.endDate || new Date()}
                  onDateSelect={(date) => {
                    setFilters({ ...filters, endDate: date });
                    setEndDateOpen(false);
                  }}
                  minDate={filters.startDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Filter Toggle */}
          <Button
            variant={filterOpen ? "default" : "outline"}
            onClick={() => setFilterOpen(!filterOpen)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            فیلترها
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              پاک کردن
            </Button>
          )}
        </div>

        {/* Extended Filters */}
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t"
          >
            <div>
              <Label>پزشک</Label>
              <Select
                value={filters.doctor || ''}
                onValueChange={(v) => setFilters({ ...filters, doctor: v || undefined })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="همه پزشکان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه پزشکان</SelectItem>
                  {uniqueDoctors.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>مطب</Label>
              <Select
                value={filters.clinic || ''}
                onValueChange={(v) => setFilters({ ...filters, clinic: v || undefined })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="همه مطب‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه مطب‌ها</SelectItem>
                  {uniqueClinics.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>وضعیت پرداخت</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(v) => setFilters({ ...filters, status: v || undefined })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="همه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه</SelectItem>
                  <SelectItem value="paid">تسویه کامل</SelectItem>
                  <SelectItem value="partial">بیعانه</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {toPersianNumber(filteredPatients.length)} بیمار یافت شد
        </p>
      </div>

      {/* Patient List */}
      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="space-y-6">
          {Object.keys(groupedPatients).length > 0 ? (
            Object.entries(groupedPatients).map(([dateKey, datePatients]) => {
              const date = new Date(dateKey);
              const isTodayDate = dateKey === todayStr;

              return (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Date Header */}
                  <div className={cn(
                    "flex items-center gap-3 mb-3 sticky top-0 z-10 py-2",
                    "bg-background"
                  )}>
                    <div className={cn(
                      "px-4 py-2 rounded-lg font-medium flex items-center gap-2",
                      isTodayDate ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <Calendar className="w-4 h-4" />
                      {formatPersianDateWithDay(date)}
                      {isTodayDate && <span className="text-xs">(امروز)</span>}
                    </div>
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm text-muted-foreground">
                      {toPersianNumber(datePatients.length)} بیمار
                    </span>
                  </div>

                  {/* Patients for this date */}
                  <div className="space-y-3">
                    {datePatients
                      .sort((a, b) => (a.surgery_time || '').localeCompare(b.surgery_time || ''))
                      .map((patient, index) => (
                        <motion.div
                          key={patient.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={cn(
                            "patient-row",
                            patient.status === 'paid' && "border-l-4 border-l-success",
                            patient.status === 'partial' && "border-l-4 border-l-warning",
                          )}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Patient Info */}
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-semibold">
                                  {patient.full_name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {patient.surgery_time || '-'}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Stethoscope className="w-3.5 h-3.5" />
                                    {patient.surgery_type}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center gap-1.5">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span>{patient.doctor}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <span>{patient.clinic}</span>
                              </div>
                            </div>

                            {/* Payment & Actions */}
                            <div className="flex items-center gap-4">
                              <div className="text-left min-w-[100px]">
                                <p className="text-xs text-muted-foreground">مبلغ جراحی</p>
                                <p className="font-semibold">
                                  {formatCurrency(patient.surgery_cost)}
                                </p>
                              </div>
                              <div className="text-left min-w-[80px]">
                                <p className="text-xs text-muted-foreground">پرداختی</p>
                                <p className="font-semibold text-success">
                                  {formatCurrency(patient.totalPaid)}
                                </p>
                              </div>
                              {patient.remainingBalance > 0 && (
                                <div className="text-left min-w-[80px]">
                                  <p className="text-xs text-muted-foreground">باقی‌مانده</p>
                                  <p className="font-semibold text-warning">
                                    {formatCurrency(patient.remainingBalance)}
                                  </p>
                                </div>
                              )}
                              <span className={cn(
                                patient.status === 'paid' && "badge-success",
                                patient.status === 'partial' && "badge-warning",
                                patient.status === 'pending' && "badge-primary",
                              )}>
                                {patient.status === 'paid' && 'تسویه'}
                                {patient.status === 'partial' && 'بیعانه'}
                                {patient.status === 'pending' && 'در انتظار'}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEditPatient(patient)}
                                className="gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                ویرایش
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">جراحی‌ای یافت نشد</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  پاک کردن فیلترها
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default UpcomingSurgeriesTab;
