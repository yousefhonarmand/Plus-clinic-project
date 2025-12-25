import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UserPlus,
  Calendar,
  BarChart3,
  Menu,
  X,
  Loader2,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePatients, usePayments, PatientWithPayments } from '@/hooks/usePatients';
import { useStorage } from '@/hooks/useStorage';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import DashboardTab from '@/components/DashboardTab';
import AdmissionForm from '@/components/AdmissionForm';
import UpcomingSurgeriesTab from '@/components/UpcomingSurgeriesTab';
import ReportsTab from '@/components/ReportsTab';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatPersianDate } from '@/lib/persianDate';
import { surgeries, doctors, consultants, clinics, bankCards } from '@/lib/data';

type TabType = 'dashboard' | 'admission' | 'upcoming' | 'reports';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [editingPatient, setEditingPatient] = useState<PatientWithPayments | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { patients, loading, addPatient, updatePatient } = usePatients();
  const { addPayment, deletePayment } = usePayments();
  const { uploadDocument, uploadReceipt } = useStorage();
  const { user, signOut } = useAuth();
  const { canViewReports, loading: roleLoading } = useUserRole();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'خطا در خروج',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const tabs = useMemo(() => {
    const baseTabs = [
      { id: 'dashboard' as TabType, label: 'داشبورد', icon: LayoutDashboard },
      { id: 'admission' as TabType, label: 'پذیرش بیمار', icon: UserPlus },
      { id: 'upcoming' as TabType, label: 'جراحی‌های پیش رو', icon: Calendar },
    ];
    
    // Only show reports tab for admin and receptionist
    if (canViewReports) {
      baseTabs.push({ id: 'reports' as TabType, label: 'گزارش‌دهی', icon: BarChart3 });
    }
    
    return baseTabs;
  }, [canViewReports]);

  const handleAddPatient = async (formData: any) => {
    try {
      // Get surgery info
      const surgery = surgeries.find(s => s.id === formData.surgeryId);
      const doctor = doctors.find(d => d.id === formData.doctorId);
      const consultant = consultants.find(c => c.id === formData.consultantId);
      const clinic = clinics.find(c => c.id === formData.clinicId);

      if (!surgery || !doctor || !consultant || !clinic) {
        toast({
          title: 'خطا',
          description: 'اطلاعات ناقص است',
          variant: 'destructive',
        });
        return;
      }

      // Format surgery date as string (YYYY-MM-DD)
      const surgeryDateStr = formData.surgeryDate instanceof Date 
        ? formData.surgeryDate.toISOString().split('T')[0]
        : formData.surgeryDate;

      const newPatient = await addPatient({
        fullName: `${formData.firstName} ${formData.lastName}`,
        nationalCode: formData.nationalId,
        phone: formData.phone,
        surgeryType: surgery.name,
        surgeryCost: surgery.price,
        surgeryDate: surgeryDateStr,
        surgeryTime: formData.timeSlot,
        doctor: doctor.name,
        consultant: consultant.name,
        clinic: clinic.name,
        documents: formData.documents?.map((d: any) => d.url) || [],
      });

      // Add payments if any
      if (formData.payments && formData.payments.length > 0 && newPatient) {
        for (const payment of formData.payments) {
          const card = bankCards.find(c => c.id === payment.cardId);
          if (card) {
            await addPayment({
              patientId: newPatient.id,
              amount: payment.amount,
              cardNumber: card.maskedNumber,
              cardHolder: card.ownerName,
              date: new Date().toISOString().split('T')[0],
              receiptImage: payment.receiptImage,
            });
          }
        }
      }

      setActiveTab('dashboard');
    } catch (err) {
      console.error('Error adding patient:', err);
    }
  };

  const handleEditPatient = (patient: PatientWithPayments) => {
    setEditingPatient(patient);
  };

  const handleUpdatePatient = async (formData: any) => {
    if (!editingPatient) return;

    try {
      const surgery = surgeries.find(s => s.id === formData.surgeryId);
      const doctor = doctors.find(d => d.id === formData.doctorId);
      const consultant = consultants.find(c => c.id === formData.consultantId);
      const clinic = clinics.find(c => c.id === formData.clinicId);

      // Format surgery date as string (YYYY-MM-DD)
      const surgeryDateStr = formData.surgeryDate instanceof Date 
        ? formData.surgeryDate.toISOString().split('T')[0]
        : formData.surgeryDate;

      await updatePatient(editingPatient.id, {
        fullName: `${formData.firstName} ${formData.lastName}`,
        nationalCode: formData.nationalId,
        phone: formData.phone,
        surgeryType: surgery?.name,
        surgeryCost: surgery?.price,
        surgeryDate: surgeryDateStr,
        surgeryTime: formData.timeSlot,
        doctor: doctor?.name,
        consultant: consultant?.name,
        clinic: clinic?.name,
        documents: formData.documents?.map((d: any) => d.url) || [],
      });

      // Handle new payments
      if (formData.newPayments && formData.newPayments.length > 0) {
        for (const payment of formData.newPayments) {
          const card = bankCards.find(c => c.id === payment.cardId);
          if (card) {
            await addPayment({
              patientId: editingPatient.id,
              amount: payment.amount,
              cardNumber: card.maskedNumber,
              cardHolder: card.ownerName,
              date: new Date().toISOString().split('T')[0],
              receiptImage: payment.receiptImage,
            });
          }
        }
      }

      setEditingPatient(null);
    } catch (err) {
      console.error('Error updating patient:', err);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-primary">
              سیستم مدیریت کلینیک جراحی
            </h1>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "tab-button flex items-center gap-2",
                    activeTab === tab.id && "tab-button-active"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="mr-2 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4 ml-1" />
                خروج
              </Button>
            </nav>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.nav
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden mt-4 pt-4 border-t"
              >
                <div className="grid grid-cols-2 gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "tab-button flex items-center justify-center gap-2 py-4",
                        activeTab === tab.id && "tab-button-active"
                      )}
                    >
                      <tab.icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <DashboardTab patients={patients} onEditPatient={handleEditPatient} />
            )}
            {activeTab === 'admission' && (
              <AdmissionForm onSubmit={handleAddPatient} />
            )}
            {activeTab === 'upcoming' && (
              <UpcomingSurgeriesTab patients={patients} onEditPatient={handleEditPatient} />
            )}
            {activeTab === 'reports' && (
              <ReportsTab patients={patients} onEditPatient={handleEditPatient} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Edit Patient Dialog */}
      <Dialog open={!!editingPatient} onOpenChange={() => setEditingPatient(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ویرایش اطلاعات بیمار</DialogTitle>
          </DialogHeader>
          {editingPatient && (
            <AdmissionForm
              onSubmit={handleUpdatePatient}
              editPatient={editingPatient}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
