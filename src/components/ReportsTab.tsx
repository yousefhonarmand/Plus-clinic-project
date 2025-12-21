import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Search,
  Filter,
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  BarChart3,
  CreditCard,
  Eye,
  Edit2,
  User,
  Building2,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Patient, FilterOptions, Payment } from '@/lib/types';
import {
  getSurgeryById,
  getDoctorById,
  getConsultantById,
  getClinicById,
  getCardById,
  doctors,
  clinics,
  surgeries,
  consultants,
  bankCards,
} from '@/lib/data';
import {
  formatPersianDate,
  formatPersianDateFull,
  formatCurrency,
  toPersianNumber,
  isToday,
  isSameDay,
  addDays,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportsTabProps {
  patients: Patient[];
  onEditPatient: (patient: Patient) => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ patients, onEditPatient }) => {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: addDays(new Date(), -7),
    endDate: new Date(),
  });
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Filter patients based on date range
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      if (filters.startDate && p.surgeryDate < filters.startDate) return false;
      if (filters.endDate && p.surgeryDate > filters.endDate) return false;
      if (filters.doctorId && p.doctorId !== filters.doctorId) return false;
      if (filters.clinicId && p.clinicId !== filters.clinicId) return false;
      if (filters.surgeryId && p.surgeryId !== filters.surgeryId) return false;
      if (filters.consultantId && p.consultantId !== filters.consultantId) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        return fullName.includes(query) || p.nationalId.includes(query);
      }
      return true;
    });
  }, [patients, filters, searchQuery]);

  // Calculate payment statistics per card
  const cardPayments = useMemo(() => {
    const cardStats: { [cardId: string]: { daily: { [date: string]: number }, total: number } } = {};

    filteredPatients.forEach(patient => {
      patient.payments.forEach(payment => {
        if (!cardStats[payment.cardId]) {
          cardStats[payment.cardId] = { daily: {}, total: 0 };
        }
        const dateKey = payment.date.toISOString().split('T')[0];
        if (!cardStats[payment.cardId].daily[dateKey]) {
          cardStats[payment.cardId].daily[dateKey] = 0;
        }
        cardStats[payment.cardId].daily[dateKey] += payment.amount;
        cardStats[payment.cardId].total += payment.amount;
      });
    });

    return cardStats;
  }, [filteredPatients]);

  // Calculate daily surgery counts for chart
  const dailySurgeryData = useMemo(() => {
    const data: { [date: string]: number } = {};
    
    filteredPatients.forEach(patient => {
      const dateKey = formatPersianDate(patient.surgeryDate);
      if (!data[dateKey]) {
        data[dateKey] = 0;
      }
      data[dateKey]++;
    });

    return Object.entries(data).map(([date, count]) => ({
      date,
      count,
    }));
  }, [filteredPatients]);

  // Calculate payments per card for chart
  const cardPaymentData = useMemo(() => {
    return Object.entries(cardPayments).map(([cardId, stats]) => {
      const card = getCardById(cardId);
      return {
        name: card?.ownerName || 'نامشخص',
        cardNumber: card?.maskedNumber.split(' ').slice(-1)[0] || '',
        amount: stats.total,
      };
    }).sort((a, b) => b.amount - a.amount).slice(0, 10);
  }, [cardPayments]);

  // Total statistics
  const totalStats = useMemo(() => {
    const today = new Date();
    const startOfWeek = addDays(today, -7);
    const startOfMonth = addDays(today, -30);

    let dailyTotal = 0;
    let weeklyTotal = 0;
    let monthlyTotal = 0;
    let yearlyTotal = 0;

    filteredPatients.forEach(patient => {
      patient.payments.forEach(payment => {
        const paymentDate = payment.date;
        if (isSameDay(paymentDate, today)) dailyTotal += payment.amount;
        if (paymentDate >= startOfWeek) weeklyTotal += payment.amount;
        if (paymentDate >= startOfMonth) monthlyTotal += payment.amount;
        yearlyTotal += payment.amount;
      });
    });

    return { dailyTotal, weeklyTotal, monthlyTotal, yearlyTotal };
  }, [filteredPatients]);

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredPatients.map(p => ({
      'نام': p.firstName,
      'نام خانوادگی': p.lastName,
      'کد ملی': p.nationalId,
      'شماره تماس': p.phone,
      'نوع جراحی': getSurgeryById(p.surgeryId)?.name,
      'تاریخ جراحی': formatPersianDate(p.surgeryDate),
      'پزشک': getDoctorById(p.doctorId)?.name,
      'مشاور': getConsultantById(p.consultantId)?.name,
      'مطب': getClinicById(p.clinicId)?.name,
      'هزینه کل': p.surgeryPrice,
      'پرداختی': p.totalPaid,
      'باقی‌مانده': p.remainingBalance,
      'وضعیت': p.status === 'paid' ? 'تسویه' : p.status === 'partial' ? 'بیعانه' : 'در انتظار',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'گزارش بیماران');
    XLSX.writeFile(wb, `گزارش-بیماران-${formatPersianDate(new Date())}.xlsx`);

    toast({
      title: 'دانلود موفق',
      description: 'فایل اکسل با موفقیت دانلود شد',
    });
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Add Persian font support would require additional setup
    // For now, we'll use basic ASCII
    doc.setFont('helvetica');
    doc.text('Patient Report', 14, 20);

    const tableData = filteredPatients.map(p => [
      `${p.firstName} ${p.lastName}`,
      p.nationalId,
      getSurgeryById(p.surgeryId)?.name || '',
      formatPersianDate(p.surgeryDate),
      getDoctorById(p.doctorId)?.name || '',
      formatCurrency(p.totalPaid),
      p.status === 'paid' ? 'Paid' : p.status === 'partial' ? 'Partial' : 'Pending',
    ]);

    (doc as any).autoTable({
      head: [['Name', 'National ID', 'Surgery', 'Date', 'Doctor', 'Paid', 'Status']],
      body: tableData,
      startY: 30,
    });

    doc.save(`report-${formatPersianDate(new Date())}.pdf`);

    toast({
      title: 'دانلود موفق',
      description: 'فایل PDF با موفقیت دانلود شد',
    });
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="form-container no-print"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی بیمار..."
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

          {/* Quick Filters */}
          <div className="flex gap-2">
            <Select value={filters.cardId || ''} onValueChange={(v) => setFilters({ ...filters, cardId: v || undefined })}>
              <SelectTrigger className="min-w-[180px]">
                <CreditCard className="w-4 h-4 ml-2" />
                <SelectValue placeholder="فیلتر کارت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">همه کارت‌ها</SelectItem>
                {bankCards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    <span dir="ltr">{card.maskedNumber.split(' ').slice(-1)[0]}</span> - {card.ownerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF} className="gap-2">
              <FileText className="w-4 h-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              پرینت
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="stat-card stat-card-primary"
        >
          <p className="text-sm text-muted-foreground">واریزی امروز</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalStats.dailyTotal)}</p>
          <p className="text-xs text-muted-foreground">تومان</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card stat-card-accent"
        >
          <p className="text-sm text-muted-foreground">واریزی هفته</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalStats.weeklyTotal)}</p>
          <p className="text-xs text-muted-foreground">تومان</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat-card stat-card-success"
        >
          <p className="text-sm text-muted-foreground">واریزی ماه</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalStats.monthlyTotal)}</p>
          <p className="text-xs text-muted-foreground">تومان</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stat-card stat-card-warning"
        >
          <p className="text-sm text-muted-foreground">واریزی کل</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalStats.yearlyTotal)}</p>
          <p className="text-xs text-muted-foreground">تومان</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="no-print">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview">نمودارها</TabsTrigger>
          <TabsTrigger value="cards">واریزی کارت‌ها</TabsTrigger>
          <TabsTrigger value="details">جزئیات بیماران</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Surgery Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="form-container"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                تعداد جراحی‌ها در روز
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailySurgeryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ direction: 'rtl' }}
                      formatter={(value: number) => [toPersianNumber(value), 'تعداد']}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Card Payments Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="form-container"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                واریزی‌ها بر اساس کارت
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cardPaymentData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ direction: 'rtl' }}
                      formatter={(value: number) => [formatCurrency(value) + ' تومان', 'مبلغ']}
                    />
                    <Bar dataKey="amount" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="cards" className="mt-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="form-container"
          >
            <h3 className="text-lg font-semibold mb-4">جزئیات واریزی به هر کارت</h3>
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {Object.entries(cardPayments).map(([cardId, stats]) => {
                  const card = getCardById(cardId);
                  if (!card) return null;

                  return (
                    <div key={cardId} className="p-4 bg-muted/30 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium" dir="ltr">{card.maskedNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {card.ownerName} {card.bankName && `(${card.bankName})`}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground">جمع کل</p>
                          <p className="font-bold text-success">{formatCurrency(stats.total)} تومان</p>
                        </div>
                      </div>

                      {/* Daily breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(stats.daily)
                          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                          .slice(0, 8)
                          .map(([date, amount]) => (
                            <div key={date} className="text-center p-2 bg-card rounded-lg">
                              <p className="text-xs text-muted-foreground">
                                {formatPersianDate(new Date(date))}
                              </p>
                              <p className="font-medium text-sm">{formatCurrency(amount)}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="form-container"
          >
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredPatients.map((patient, index) => {
                  const surgery = getSurgeryById(patient.surgeryId);
                  const doctor = getDoctorById(patient.doctorId);
                  const consultant = getConsultantById(patient.consultantId);
                  const clinic = getClinicById(patient.clinicId);

                  return (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="patient-row"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">
                              {patient.firstName} {patient.lastName}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {surgery?.name} • {formatPersianDate(patient.surgeryDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span>{doctor?.name}</span>
                          <span>•</span>
                          <span>{consultant?.name}</span>
                          <span>•</span>
                          <span>{clinic?.name}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <p className="font-semibold text-success">
                              {formatCurrency(patient.totalPaid)}
                            </p>
                            {patient.remainingBalance > 0 && (
                              <p className="text-xs text-warning">
                                باقی: {formatCurrency(patient.remainingBalance)}
                              </p>
                            )}
                          </div>

                          {/* Document previews */}
                          {patient.documents.length > 0 && (
                            <div className="flex gap-1">
                              {patient.documents.slice(0, 2).map((doc) => (
                                <button
                                  key={doc.id}
                                  onClick={() => setPreviewImage(doc.url)}
                                  className="image-preview !w-10 !h-10 group"
                                >
                                  <img src={doc.url} alt="" />
                                  <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Eye className="w-3 h-3 text-white" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditPatient(patient)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>پیش‌نمایش</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsTab;
