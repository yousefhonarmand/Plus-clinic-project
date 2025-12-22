import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatPersianDate, toGregorianDate, toPersianDate } from '@/lib/persianDate';

export interface DbPatient {
  id: string;
  full_name: string;
  national_code: string;
  phone: string;
  surgery_type: string;
  surgery_cost: number;
  surgery_date: string;
  surgery_time: string | null;
  doctor: string;
  consultant: string;
  clinic: string;
  documents: string[] | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DbPayment {
  id: string;
  patient_id: string;
  amount: number;
  card_number: string;
  card_holder: string;
  date: string;
  receipt_image: string | null;
  created_at: string;
}

export interface PatientWithPayments extends DbPatient {
  payments: DbPayment[];
  totalPaid: number;
  remainingBalance: number;
}

export function usePatients() {
  const [patients, setPatients] = useState<PatientWithPayments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('surgery_date', { ascending: true });

      if (patientsError) throw patientsError;

      // Fetch all payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: true });

      if (paymentsError) throw paymentsError;

      // Combine patients with their payments
      const patientsWithPayments: PatientWithPayments[] = (patientsData || []).map(patient => {
        const patientPayments = (paymentsData || []).filter(p => p.patient_id === patient.id);
        const totalPaid = patientPayments.reduce((sum, p) => sum + p.amount, 0);
        const remainingBalance = patient.surgery_cost - totalPaid;

        return {
          ...patient,
          payments: patientPayments,
          totalPaid,
          remainingBalance,
        };
      });

      setPatients(patientsWithPayments);
    } catch (err: any) {
      console.error('Error fetching patients:', err);
      setError(err.message);
      toast({
        title: 'خطا در دریافت اطلاعات',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('patients-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        () => {
          fetchPatients();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          fetchPatients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPatients]);

  const addPatient = async (patientData: {
    fullName: string;
    nationalCode: string;
    phone: string;
    surgeryType: string;
    surgeryCost: number;
    surgeryDate: string;
    surgeryTime: string;
    doctor: string;
    consultant: string;
    clinic: string;
    documents?: string[];
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          full_name: patientData.fullName,
          national_code: patientData.nationalCode,
          phone: patientData.phone,
          surgery_type: patientData.surgeryType,
          surgery_cost: patientData.surgeryCost,
          surgery_date: patientData.surgeryDate,
          surgery_time: patientData.surgeryTime,
          doctor: patientData.doctor,
          consultant: patientData.consultant,
          clinic: patientData.clinic,
          documents: patientData.documents || [],
          notes: patientData.notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'پذیرش موفق',
        description: `بیمار ${patientData.fullName} با موفقیت ثبت شد`,
      });

      return data;
    } catch (err: any) {
      console.error('Error adding patient:', err);
      toast({
        title: 'خطا در ثبت بیمار',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updatePatient = async (
    id: string,
    patientData: Partial<{
      fullName: string;
      nationalCode: string;
      phone: string;
      surgeryType: string;
      surgeryCost: number;
      surgeryDate: string;
      surgeryTime: string;
      doctor: string;
      consultant: string;
      clinic: string;
      documents: string[];
      notes: string;
      status: string;
    }>
  ) => {
    try {
      const updateData: any = {};
      if (patientData.fullName !== undefined) updateData.full_name = patientData.fullName;
      if (patientData.nationalCode !== undefined) updateData.national_code = patientData.nationalCode;
      if (patientData.phone !== undefined) updateData.phone = patientData.phone;
      if (patientData.surgeryType !== undefined) updateData.surgery_type = patientData.surgeryType;
      if (patientData.surgeryCost !== undefined) updateData.surgery_cost = patientData.surgeryCost;
      if (patientData.surgeryDate !== undefined) updateData.surgery_date = patientData.surgeryDate;
      if (patientData.surgeryTime !== undefined) updateData.surgery_time = patientData.surgeryTime;
      if (patientData.doctor !== undefined) updateData.doctor = patientData.doctor;
      if (patientData.consultant !== undefined) updateData.consultant = patientData.consultant;
      if (patientData.clinic !== undefined) updateData.clinic = patientData.clinic;
      if (patientData.documents !== undefined) updateData.documents = patientData.documents;
      if (patientData.notes !== undefined) updateData.notes = patientData.notes;
      if (patientData.status !== undefined) updateData.status = patientData.status;

      const { data, error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'بروزرسانی موفق',
        description: 'اطلاعات بیمار با موفقیت بروزرسانی شد',
      });

      return data;
    } catch (err: any) {
      console.error('Error updating patient:', err);
      toast({
        title: 'خطا در بروزرسانی',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deletePatient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'حذف موفق',
        description: 'بیمار با موفقیت حذف شد',
      });
    } catch (err: any) {
      console.error('Error deleting patient:', err);
      toast({
        title: 'خطا در حذف',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    patients,
    loading,
    error,
    refetch: fetchPatients,
    addPatient,
    updatePatient,
    deletePatient,
  };
}

export function usePayments() {
  const addPayment = async (paymentData: {
    patientId: string;
    amount: number;
    cardNumber: string;
    cardHolder: string;
    date: string;
    receiptImage?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          patient_id: paymentData.patientId,
          amount: paymentData.amount,
          card_number: paymentData.cardNumber,
          card_holder: paymentData.cardHolder,
          date: paymentData.date,
          receipt_image: paymentData.receiptImage || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update patient status based on total payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('patient_id', paymentData.patientId);

      const { data: patientData } = await supabase
        .from('patients')
        .select('surgery_cost')
        .eq('id', paymentData.patientId)
        .single();

      if (paymentsData && patientData) {
        const totalPaid = paymentsData.reduce((sum, p) => sum + p.amount, 0);
        const newStatus = totalPaid >= patientData.surgery_cost ? 'paid' : totalPaid > 0 ? 'partial' : 'pending';

        await supabase
          .from('patients')
          .update({ status: newStatus })
          .eq('id', paymentData.patientId);
      }

      toast({
        title: 'واریزی ثبت شد',
        description: 'مبلغ با موفقیت ثبت شد',
      });

      return data;
    } catch (err: any) {
      console.error('Error adding payment:', err);
      toast({
        title: 'خطا در ثبت واریزی',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deletePayment = async (id: string, patientId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update patient status
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('patient_id', patientId);

      const { data: patientData } = await supabase
        .from('patients')
        .select('surgery_cost')
        .eq('id', patientId)
        .single();

      if (patientData) {
        const totalPaid = (paymentsData || []).reduce((sum, p) => sum + p.amount, 0);
        const newStatus = totalPaid >= patientData.surgery_cost ? 'paid' : totalPaid > 0 ? 'partial' : 'pending';

        await supabase
          .from('patients')
          .update({ status: newStatus })
          .eq('id', patientId);
      }

      toast({
        title: 'حذف موفق',
        description: 'واریزی با موفقیت حذف شد',
      });
    } catch (err: any) {
      console.error('Error deleting payment:', err);
      toast({
        title: 'خطا در حذف',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    addPayment,
    deletePayment,
  };
}
