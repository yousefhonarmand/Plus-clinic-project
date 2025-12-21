import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Phone,
  CreditCard as CardIcon,
  Upload,
  Plus,
  Trash2,
  Eye,
  Check,
  MessageSquare,
  Search,
  Building2,
  Stethoscope,
  Calendar,
  Clock,
  Wallet,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Patient, PatientDocument, Payment } from '@/lib/types';
import {
  surgeries,
  doctors,
  consultants,
  clinics,
  bankCards,
  timeSlots,
  getSurgeryById,
} from '@/lib/data';
import {
  formatPersianDate,
  formatCurrency,
  parseCurrency,
  toPersianNumber,
  toEnglishNumber,
} from '@/lib/persianDate';
import PersianCalendar from '@/components/PersianCalendar';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import FileUpload from '@/components/FileUpload';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { toast } from '@/hooks/use-toast';

interface AdmissionFormProps {
  onSubmit: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editPatient?: Patient;
  bookedSlots?: { [clinicId: string]: { [date: string]: string[] } };
}

const AdmissionForm: React.FC<AdmissionFormProps> = ({
  onSubmit,
  editPatient,
  bookedSlots = {},
}) => {
  // Form state
  const [firstName, setFirstName] = useState(editPatient?.firstName || '');
  const [lastName, setLastName] = useState(editPatient?.lastName || '');
  const [nationalId, setNationalId] = useState(editPatient?.nationalId || '');
  const [phone, setPhone] = useState(editPatient?.phone || '');
  const [surgeryId, setSurgeryId] = useState(editPatient?.surgeryId || '');
  const [surgeryDate, setSurgeryDate] = useState<Date>(editPatient?.surgeryDate || new Date());
  const [doctorId, setDoctorId] = useState(editPatient?.doctorId || '');
  const [consultantId, setConsultantId] = useState(editPatient?.consultantId || '');
  const [clinicId, setClinicId] = useState(editPatient?.clinicId || '');
  const [timeSlot, setTimeSlot] = useState(editPatient?.timeSlot || '');
  const [documents, setDocuments] = useState<PatientDocument[]>(editPatient?.documents || []);
  const [payments, setPayments] = useState<Payment[]>(editPatient?.payments || []);

  // UI state
  const [surgeryOpen, setSurgeryOpen] = useState(false);
  const [surgerySearch, setSurgerySearch] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [newPayment, setNewPayment] = useState<Partial<Payment>>({});
  const [newPaymentReceipt, setNewPaymentReceipt] = useState<PatientDocument[]>([]);
  const [receiptPreview, setReceiptPreview] = useState<PatientDocument | null>(null);

  // Calculate totals
  const selectedSurgery = getSurgeryById(surgeryId);
  const totalPrice = selectedSurgery?.price || 0;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = totalPrice - totalPaid;

  // Get booked slots for selected clinic and date
  const dateKey = surgeryDate.toISOString().split('T')[0];
  const currentBookedSlots = bookedSlots[clinicId]?.[dateKey] || [];

  // Filter surgeries
  const filteredSurgeries = surgeries.filter(s =>
    s.name.includes(surgerySearch)
  );

  // Validate national ID
  const validateNationalId = (id: string): boolean => {
    const cleanId = toEnglishNumber(id);
    if (cleanId.length !== 10) return false;
    if (!/^\d{10}$/.test(cleanId)) return false;
    
    const check = parseInt(cleanId[9]);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanId[i]) * (10 - i);
    }
    const remainder = sum % 11;
    return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
  };

  // Format phone number
  const formatPhone = (value: string): string => {
    const digits = toEnglishNumber(value).replace(/\D/g, '');
    return digits.slice(0, 11);
  };

  // Format currency input
  const formatCurrencyInput = (value: string): string => {
    const digits = toEnglishNumber(value).replace(/\D/g, '');
    if (!digits) return '';
    return formatCurrency(parseInt(digits));
  };

  // Add payment
  const addPayment = () => {
    if (!newPayment.cardId || !newPayment.amount) {
      toast({
        title: 'خطا',
        description: 'لطفاً کارت و مبلغ را انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    const payment: Payment = {
      id: `payment-${Date.now()}`,
      amount: newPayment.amount,
      cardId: newPayment.cardId,
      date: new Date(),
      receiptImage: newPaymentReceipt[0]?.url,
    };

    setPayments([...payments, payment]);
    setNewPayment({});
    setNewPaymentReceipt([]);

    toast({
      title: 'واریزی ثبت شد',
      description: `مبلغ ${formatCurrency(payment.amount)} تومان با موفقیت ثبت شد`,
    });
  };

  // Remove payment
  const removePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  // Submit form
  const handleSubmit = () => {
    // Validation
    if (!firstName || !lastName) {
      toast({ title: 'خطا', description: 'نام و نام خانوادگی الزامی است', variant: 'destructive' });
      return;
    }
    if (!validateNationalId(nationalId)) {
      toast({ title: 'خطا', description: 'کد ملی نامعتبر است', variant: 'destructive' });
      return;
    }
    if (!phone || phone.length < 11) {
      toast({ title: 'خطا', description: 'شماره تماس نامعتبر است', variant: 'destructive' });
      return;
    }
    if (!surgeryId) {
      toast({ title: 'خطا', description: 'نوع جراحی را انتخاب کنید', variant: 'destructive' });
      return;
    }
    if (!doctorId || !consultantId || !clinicId) {
      toast({ title: 'خطا', description: 'پزشک، مشاور و مطب را انتخاب کنید', variant: 'destructive' });
      return;
    }
    if (!timeSlot) {
      toast({ title: 'خطا', description: 'ساعت پذیرش را انتخاب کنید', variant: 'destructive' });
      return;
    }

    const patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> = {
      firstName,
      lastName,
      nationalId: toEnglishNumber(nationalId),
      phone: toEnglishNumber(phone),
      surgeryId,
      surgeryPrice: totalPrice,
      surgeryDate,
      doctorId,
      consultantId,
      clinicId,
      timeSlot,
      documents,
      payments,
      totalPaid,
      remainingBalance,
      status: totalPaid >= totalPrice ? 'paid' : totalPaid > 0 ? 'partial' : 'pending',
    };

    onSubmit(patient);
  };

  // Send SMS
  const handleSendSMS = () => {
    if (!phone) {
      toast({ title: 'خطا', description: 'شماره تماس وارد نشده است', variant: 'destructive' });
      return;
    }
    toast({
      title: 'ارسال پیامک',
      description: 'اطلاعات جراحی برای بیمار ارسال شد',
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Info Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="form-container"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            اطلاعات بیمار
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">نام</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="نام بیمار"
                  className="input-persian mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">نام خانوادگی</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="نام خانوادگی"
                  className="input-persian mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="nationalId">کد ملی</Label>
              <Input
                id="nationalId"
                value={nationalId}
                onChange={(e) => setNationalId(formatPhone(e.target.value).slice(0, 10))}
                placeholder="۱۰ رقم"
                className="input-ltr mt-1"
                maxLength={10}
                dir="ltr"
              />
              {nationalId && !validateNationalId(nationalId) && (
                <p className="text-xs text-destructive mt-1">کد ملی نامعتبر است</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">شماره تماس</Label>
              <div className="relative mt-1">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="input-ltr pr-10"
                  maxLength={11}
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Surgery Info Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="form-container"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            اطلاعات جراحی
          </h3>

          <div className="space-y-4">
            {/* Surgery Type */}
            <div>
              <Label>نوع جراحی</Label>
              <Popover open={surgeryOpen} onOpenChange={setSurgeryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between mt-1"
                  >
                    {surgeryId
                      ? surgeries.find(s => s.id === surgeryId)?.name
                      : 'انتخاب جراحی...'}
                    <ChevronDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="جستجوی جراحی..."
                      value={surgerySearch}
                      onValueChange={setSurgerySearch}
                    />
                    <CommandList>
                      <CommandEmpty>جراحی یافت نشد</CommandEmpty>
                      <CommandGroup>
                        {filteredSurgeries.map((surgery) => (
                          <CommandItem
                            key={surgery.id}
                            value={surgery.id}
                            onSelect={() => {
                              setSurgeryId(surgery.id);
                              setSurgeryOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "ml-2 h-4 w-4",
                                surgeryId === surgery.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex-1">
                              <span>{surgery.name}</span>
                              {surgery.requiresHospital && (
                                <span className="text-xs text-muted-foreground mr-2">
                                  (با بیمارستان)
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(surgery.price)}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedSurgery && (
                <p className="text-sm text-success mt-2">
                  هزینه جراحی: {formatCurrency(selectedSurgery.price)} تومان
                </p>
              )}
            </div>

            {/* Surgery Date */}
            <div>
              <Label>تاریخ جراحی</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start mt-1 text-right"
                  >
                    <Calendar className="ml-2 h-4 w-4" />
                    {formatPersianDate(surgeryDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <PersianCalendar
                    selectedDate={surgeryDate}
                    onDateSelect={(date) => {
                      setSurgeryDate(date);
                      setShowCalendar(false);
                      setTimeSlot(''); // Reset time slot when date changes
                    }}
                    minDate={new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Doctor */}
            <div>
              <Label>پزشک</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="انتخاب پزشک" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Consultant */}
            <div>
              <Label>مشاور</Label>
              <Select value={consultantId} onValueChange={setConsultantId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="انتخاب مشاور" />
                </SelectTrigger>
                <SelectContent>
                  {consultants.map((consultant) => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      {consultant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Documents Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="form-container"
      >
        <FileUpload
          files={documents}
          onFilesChange={setDocuments}
          label="آپلود مدارک و فرم پذیرش"
        />
      </motion.div>

      {/* Clinic & Time Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="form-container"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          مطب و زمان‌بندی
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clinic Selection */}
          <div>
            <Label>محل جراحی</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {clinics.map((clinic) => (
                <button
                  key={clinic.id}
                  onClick={() => {
                    setClinicId(clinic.id);
                    setTimeSlot('');
                  }}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-200 text-center",
                    clinicId === clinic.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Building2 className={cn(
                    "w-6 h-6 mx-auto mb-2",
                    clinicId === clinic.id ? "text-primary" : "text-muted-foreground"
                  )} />
                  <p className="font-medium">{clinic.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ظرفیت: {toPersianNumber(clinic.maxCapacity)} بیمار
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot Selection */}
          <div>
            {clinicId ? (
              <TimeSlotPicker
                selectedTime={timeSlot}
                onTimeSelect={setTimeSlot}
                bookedSlots={currentBookedSlots}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>ابتدا مطب را انتخاب کنید</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Payments Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="form-container"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          واریزی‌ها
        </h3>

        {/* Summary */}
        {selectedSurgery && (
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-xl">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">هزینه کل</p>
              <p className="text-lg font-bold">{formatCurrency(totalPrice)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">پرداخت شده</p>
              <p className="text-lg font-bold text-success">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">باقی‌مانده</p>
              <p className={cn(
                "text-lg font-bold",
                remainingBalance > 0 ? "text-warning" : "text-success"
              )}>
                {formatCurrency(remainingBalance)}
              </p>
            </div>
          </div>
        )}

        {/* Existing Payments */}
        {payments.length > 0 && (
          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-muted-foreground">واریزی‌های ثبت شده</p>
            {payments.map((payment) => {
              const card = bankCards.find(c => c.id === payment.cardId);
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {payment.receiptImage && (
                      <button
                        onClick={() => setReceiptPreview({
                          id: payment.id,
                          name: 'فیش واریزی',
                          url: payment.receiptImage!,
                          type: 'image/*',
                        })}
                        className="image-preview !w-12 !h-12 group"
                      >
                        <img src={payment.receiptImage} alt="فیش" />
                        <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    )}
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)} تومان</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {card?.maskedNumber} - {card?.ownerName}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePayment(payment.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add New Payment */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">افزودن واریزی جدید</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card Selection */}
            <div>
              <Label>شماره کارت</Label>
              <Select
                value={newPayment.cardId}
                onValueChange={(value) => setNewPayment({ ...newPayment, cardId: value })}
              >
                <SelectTrigger className="mt-1" dir="ltr">
                  <SelectValue placeholder="انتخاب کارت" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-64">
                    {bankCards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        <div className="flex items-center gap-2" dir="ltr">
                          <span>{card.maskedNumber}</span>
                          <span className="text-xs text-muted-foreground">
                            {card.ownerName} {card.bankName && `(${card.bankName})`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <Label>مبلغ واریزی</Label>
              <Input
                value={newPayment.amount ? formatCurrency(newPayment.amount) : ''}
                onChange={(e) => {
                  const value = parseCurrency(e.target.value);
                  setNewPayment({ ...newPayment, amount: value });
                }}
                placeholder="۱,۰۰۰,۰۰۰"
                className="mt-1"
              />
            </div>

            {/* Receipt Upload */}
            <div>
              <Label>فیش واریزی</Label>
              <div className="flex gap-2 mt-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewPaymentReceipt([{
                        id: `receipt-${Date.now()}`,
                        name: file.name,
                        url: URL.createObjectURL(file),
                        type: file.type,
                      }]);
                    }
                  }}
                  className="hidden"
                  id="receipt-upload"
                />
                <label
                  htmlFor="receipt-upload"
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer transition-colors",
                    newPaymentReceipt.length > 0
                      ? "border-success bg-success/10 text-success"
                      : "border-border hover:border-primary hover:bg-primary/5"
                  )}
                >
                  {newPaymentReceipt.length > 0 ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-sm">آپلود شد</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">آپلود فیش</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          <Button
            onClick={addPayment}
            className="mt-4 gap-2"
            disabled={!newPayment.cardId || !newPayment.amount}
          >
            <Plus className="w-4 h-4" />
            افزودن واریزی
          </Button>
        </div>
      </motion.div>

      {/* Submit Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap gap-4 justify-end"
      >
        <Button
          variant="outline"
          onClick={handleSendSMS}
          className="gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          ارسال SMS اطلاعات
        </Button>
        <Button
          onClick={handleSubmit}
          className="gap-2 min-w-[200px]"
        >
          <Check className="w-4 h-4" />
          {editPatient ? 'بروزرسانی پذیرش' : 'ثبت پذیرش بیمار'}
        </Button>
      </motion.div>

      {/* Receipt Preview Dialog */}
      <Dialog open={!!receiptPreview} onOpenChange={() => setReceiptPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>فیش واریزی</DialogTitle>
          </DialogHeader>
          {receiptPreview && (
            <img
              src={receiptPreview.url}
              alt="فیش واریزی"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdmissionForm;
