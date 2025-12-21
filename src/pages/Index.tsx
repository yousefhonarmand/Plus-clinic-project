import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UserPlus,
  Calendar,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TabType, Patient } from '@/lib/types';
import { generateSamplePatients } from '@/lib/data';
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

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [patients, setPatients] = useState<Patient[]>(generateSamplePatients());
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'dashboard' as TabType, label: 'داشبورد', icon: LayoutDashboard },
    { id: 'admission' as TabType, label: 'پذیرش بیمار', icon: UserPlus },
    { id: 'upcoming' as TabType, label: 'جراحی‌های پیش رو', icon: Calendar },
    { id: 'reports' as TabType, label: 'گزارش‌دهی', icon: BarChart3 },
  ];

  const handleAddPatient = (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: `patient-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPatients([...patients, newPatient]);
    toast({
      title: 'پذیرش موفق',
      description: `بیمار ${newPatient.firstName} ${newPatient.lastName} با موفقیت ثبت شد`,
    });
    setActiveTab('dashboard');
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
  };

  const handleUpdatePatient = (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingPatient) return;
    
    const updatedPatient: Patient = {
      ...patientData,
      id: editingPatient.id,
      createdAt: editingPatient.createdAt,
      updatedAt: new Date(),
    };
    
    setPatients(patients.map(p => p.id === editingPatient.id ? updatedPatient : p));
    setEditingPatient(null);
    toast({
      title: 'بروزرسانی موفق',
      description: 'اطلاعات بیمار با موفقیت بروزرسانی شد',
    });
  };

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
