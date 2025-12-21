export interface Surgery {
  id: string;
  name: string;
  price: number;
  requiresHospital?: boolean;
}

export interface Doctor {
  id: string;
  name: string;
}

export interface Consultant {
  id: string;
  name: string;
}

export interface Clinic {
  id: string;
  name: string;
  maxCapacity: number;
}

export interface BankCard {
  id: string;
  maskedNumber: string;
  ownerName: string;
  bankName: string;
}

export interface Payment {
  id: string;
  amount: number;
  cardId: string;
  date: Date;
  receiptImage?: string;
}

export interface PatientDocument {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  patientId?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  surgeryId: string;
  surgeryPrice: number;
  surgeryDate: Date;
  doctorId: string;
  consultantId: string;
  clinicId: string;
  timeSlot: string;
  documents: PatientDocument[];
  payments: Payment[];
  totalPaid: number;
  remainingBalance: number;
  status: 'pending' | 'partial' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

export type TabType = 'dashboard' | 'admission' | 'upcoming' | 'reports';

export interface DailyStats {
  totalPatientsToday: number;
  totalPatientsWeek: number;
  pendingSettlementToday: number;
  pendingSettlementWeek: number;
  totalPaymentsToday: number;
}

export interface FilterOptions {
  startDate?: Date;
  endDate?: Date;
  doctorId?: string;
  clinicId?: string;
  surgeryId?: string;
  consultantId?: string;
  cardId?: string;
  status?: string;
}
