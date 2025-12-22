import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Search,
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  BarChart3,
  CreditCard,
  Eye,
  Edit2,
} from 'lucide-react';
import { PatientWithPayments } from '@/hooks/usePatients';
import { bankCards } from '@/lib/data';
import {
  formatPersianDate,
  formatCurrency,
  toPersianNumber,
  addDays,
} from '@/lib/persianDate';
import PersianCalendar from '@/components/PersianCalendar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
} from 'recharts';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportsTabProps {
  patients: PatientWithPayments[];
  onEditPatient: (patient: PatientWithPayments) => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ patients, onEditPatient }) => {
  const [filters, setFilters] = useState({
    startDate: addDays(new Date(), -7),
    endDate: new Date(),
    cardId: '',
  });
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const surgeryDate = new Date(p.surgery_date);
      if (filters.startDate && surgeryDate < filters.startDate) return false;
      if (filters.endDate && surgeryDate > filters.endDate) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return p.full_name.toLowerCase().includes(query) || p.national_code.includes(query);
      }
      return true;
    });
  }, [patients, filters, searchQuery]);

  const cardPayments = useMemo(() => {
    const cardStats: { [cardNumber: string]: { total: number; holder: string } } = {};
    filteredPatients.forEach(patient => {
      patient.payments.forEach(payment => {
        if (!cardStats[payment.card_number]) {
          cardStats[payment.card_number] = { total: 0, holder: payment.card_holder };
        }
        cardStats[payment.card_number].total += payment.amount;
      });
    });
    return cardStats;
  }, [filteredPatients]);

  const dailySurgeryData = useMemo(() => {
    const data: { [date: string]: number } = {};
    filteredPatients.forEach(patient => {
      const dateKey = formatPersianDate(new Date(patient.surgery_date));
      if (!data[dateKey]) data[dateKey] = 0;
      data[dateKey]++;
    });
    return Object.entries(data).map(([date, count]) => ({ date, count }));
  }, [filteredPatients]);

  const totalStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let dailyTotal = 0, weeklyTotal = 0, monthlyTotal = 0, yearlyTotal = 0;
    const weekAgo = addDays(new Date(), -7).toISOString().split('T')[0];
    const monthAgo = addDays(new Date(), -30).toISOString().split('T')[0];

    filteredPatients.forEach(patient => {
      patient.payments.forEach(payment => {
        if (payment.date === today) dailyTotal += payment.amount;
        if (payment.date >= weekAgo) weeklyTotal += payment.amount;
        if (payment.date >= monthAgo) monthlyTotal += payment.amount;
        yearlyTotal += payment.amount;
      });
    });
    return { dailyTotal, weeklyTotal, monthlyTotal, yearlyTotal };
  }, [filteredPatients]);

  const exportToExcel = () => {
    const data = filteredPatients.map(p => ({
      'نام': p.full_name,
      'کد ملی': p.national_code,
      'نوع جراحی': p.surgery_type,
      'تاریخ': p.surgery_date,
      'پزشک': p.doctor,
      'مطب': p.clinic,
      'هزینه': p.surgery_cost,
      'پرداختی': p.totalPaid,
      'باقی‌مانده': p.remainingBalance,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'گزارش');
    XLSX.writeFile(wb, `report-${formatPersianDate(new Date())}.xlsx`);
    toast({ title: 'دانلود موفق', description: 'فایل اکسل دانلود شد' });
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text('Patient Report', 14, 20);
    const tableData = filteredPatients.map(p => [p.full_name, p.national_code, p.surgery_type, p.surgery_date, formatCurrency(p.totalPaid)]);
    (doc as any).autoTable({ head: [['Name', 'ID', 'Surgery', 'Date', 'Paid']], body: tableData, startY: 30 });
    doc.save(`report-${formatPersianDate(new Date())}.pdf`);
    toast({ title: 'دانلود موفق' });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="form-container">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="جستجو..." className="pr-10" />
          </div>
          <div className="flex gap-2">
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild><Button variant="outline"><Calendar className="w-4 h-4 ml-2" />{formatPersianDate(filters.startDate)}</Button></PopoverTrigger>
              <PopoverContent className="w-auto p-0"><PersianCalendar selectedDate={filters.startDate} onDateSelect={(d) => { setFilters({...filters, startDate: d}); setStartDateOpen(false); }} /></PopoverContent>
            </Popover>
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild><Button variant="outline"><Calendar className="w-4 h-4 ml-2" />{formatPersianDate(filters.endDate)}</Button></PopoverTrigger>
              <PopoverContent className="w-auto p-0"><PersianCalendar selectedDate={filters.endDate} onDateSelect={(d) => { setFilters({...filters, endDate: d}); setEndDateOpen(false); }} /></PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel} className="gap-2"><FileSpreadsheet className="w-4 h-4" />Excel</Button>
            <Button variant="outline" onClick={exportToPDF} className="gap-2"><FileText className="w-4 h-4" />PDF</Button>
            <Button variant="outline" onClick={() => window.print()} className="gap-2"><Printer className="w-4 h-4" />پرینت</Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'واریزی امروز', val: totalStats.dailyTotal }, { label: 'واریزی هفته', val: totalStats.weeklyTotal }, { label: 'واریزی ماه', val: totalStats.monthlyTotal }, { label: 'واریزی کل', val: totalStats.yearlyTotal }].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(s.val)}</p>
            <p className="text-xs text-muted-foreground">تومان</p>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview">نمودارها</TabsTrigger>
          <TabsTrigger value="cards">واریزی کارت‌ها</TabsTrigger>
          <TabsTrigger value="details">جزئیات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="form-container">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />تعداد جراحی‌ها در روز</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySurgeryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [toPersianNumber(v), 'تعداد']} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cards" className="mt-6">
          <div className="form-container">
            <h3 className="text-lg font-semibold mb-4">جزئیات واریزی به کارت‌ها</h3>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {Object.entries(cardPayments).map(([cardNum, stats]) => (
                  <div key={cardNum} className="p-4 bg-muted/30 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-medium" dir="ltr">{cardNum}</p>
                      <p className="text-sm text-muted-foreground">{stats.holder}</p>
                    </div>
                    <p className="font-bold text-success">{formatCurrency(stats.total)} تومان</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredPatients.map((p) => (
                <div key={p.id} className="p-4 bg-card rounded-xl border flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{p.full_name}</p>
                    <p className="text-sm text-muted-foreground">{p.surgery_type} - {p.doctor}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">پرداختی</p>
                      <p className="font-medium text-success">{formatCurrency(p.totalPaid)}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onEditPatient(p)}><Edit2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsTab;
