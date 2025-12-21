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
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Patient, FilterOptions } from '@/lib/types';
import {
  getSurgeryById,
  getDoctorById,
  getClinicById,
  doctors,
  clinics,
  surgeries,
} from '@/lib/data';
import {
  formatPersianDate,
  formatPersianDateFull,
  formatPersianDateWithDay,
  formatCurrency,
  toPersianNumber,
  isToday,
  isSameDay,
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
  patients: Patient[];
  onEditPatient: (patient: Patient) => void;
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

  // Filter and sort patients
  const filteredPatients = useMemo(() => {
    let result = [...patients];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
        p.nationalId.includes(query) ||
        p.phone.includes(query)
      );
    }

    // Date range filter
    if (filters.startDate) {
      result = result.filter(p => p.surgeryDate >= filters.startDate!);
    }
    if (filters.endDate) {
      result = result.filter(p => p.surgeryDate <= filters.endDate!);
    }

    // Doctor filter
    if (filters.doctorId) {
      result = result.filter(p => p.doctorId === filters.doctorId);
    }

    // Clinic filter
    if (filters.clinicId) {
      result = result.filter(p => p.clinicId === filters.clinicId);
    }

    // Surgery filter
    if (filters.surgeryId) {
      result = result.filter(p => p.surgeryId === filters.surgeryId);
    }

    // Status filter
    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }

    // Sort by date (today first, then chronological)
    result.sort((a, b) => {
      const aIsToday = isToday(a.surgeryDate);
      const bIsToday = isToday(b.surgeryDate);
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      return a.surgeryDate.getTime() - b.surgeryDate.getTime();
    });

    return result;
  }, [patients, searchQuery, filters]);

  // Group by date
  const groupedPatients = useMemo(() => {
    const groups: { [key: string]: Patient[] } = {};
    filteredPatients.forEach(patient => {
      const dateKey = patient.surgeryDate.toISOString().split('T')[0];
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
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t"
          >
            <div>
              <Label>پزشک</Label>
              <Select
                value={filters.doctorId || ''}
                onValueChange={(v) => setFilters({ ...filters, doctorId: v || undefined })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="همه پزشکان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه پزشکان</SelectItem>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>مطب</Label>
              <Select
                value={filters.clinicId || ''}
                onValueChange={(v) => setFilters({ ...filters, clinicId: v || undefined })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="همه مطب‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه مطب‌ها</SelectItem>
                  {clinics.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>نوع جراحی</Label>
              <Select
                value={filters.surgeryId || ''}
                onValueChange={(v) => setFilters({ ...filters, surgeryId: v || undefined })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="همه جراحی‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه جراحی‌ها</SelectItem>
                  {surgeries.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
              const isTodayDate = isToday(date);

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
                      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                      .map((patient, index) => {
                        const surgery = getSurgeryById(patient.surgeryId);
                        const doctor = getDoctorById(patient.doctorId);
                        const clinic = getClinicById(patient.clinicId);

                        return (
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
                                    {patient.firstName} {patient.lastName}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      {patient.timeSlot}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Stethoscope className="w-3.5 h-3.5" />
                                      {surgery?.name}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Details */}
                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <span>{doctor?.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="w-4 h-4 text-muted-foreground" />
                                  <span>{clinic?.name}</span>
                                </div>
                              </div>

                              {/* Payment & Actions */}
                              <div className="flex items-center gap-4">
                                <div className="text-left min-w-[100px]">
                                  <p className="text-xs text-muted-foreground">مبلغ جراحی</p>
                                  <p className="font-semibold">
                                    {formatCurrency(patient.surgeryPrice)}
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
                        );
                      })}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">جراحی‌ای یافت نشد</p>
              <p className="text-sm mt-1">فیلترها را تغییر دهید یا بیمار جدید اضافه کنید</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default UpcomingSurgeriesTab;
