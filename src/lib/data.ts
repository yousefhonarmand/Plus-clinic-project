import { Surgery, Doctor, Consultant, Clinic, BankCard, Patient, Payment } from './types';

export const surgeries: Surgery[] = [
  { id: '1', name: 'بلفارو پلک بالا', price: 16000000 },
  { id: '2', name: 'بلفارو پلک پایین', price: 16000000 },
  { id: '3', name: 'پلک پایین و رفع چروک زیر چشم', price: 23000000 },
  { id: '4', name: 'بلفارو پلک پایین بدون بخیه', price: 23000000 },
  { id: '5', name: 'تزریق چربی صورت', price: 15000000 },
  { id: '6', name: 'ساکشن غبغب', price: 19000000 },
  { id: '7', name: 'سانترال لب', price: 16000000 },
  { id: '8', name: 'دایرکت ابرو (لیفت ابرو)', price: 23000000 },
  { id: '9', name: 'لیفت تحتانی', price: 23000000 },
  { id: '10', name: 'شقیقه', price: 60000000, requiresHospital: true },
  { id: '11', name: 'گونه', price: 60000000, requiresHospital: true },
  { id: '12', name: 'گونه و شقیقه همزمان', price: 70000000, requiresHospital: true },
  { id: '13', name: 'مینی لیفت پایین صورت', price: 75000000, requiresHospital: true },
];

export const doctors: Doctor[] = [
  { id: '1', name: 'دکتر مریم نادی' },
  { id: '2', name: 'دکتر علی قادری' },
  { id: '3', name: 'دکتر فروزان رحیمی' },
];

export const consultants: Consultant[] = [
  { id: '1', name: 'خانم ساعی' },
  { id: '2', name: 'خانم افتخاری' },
  { id: '3', name: 'خانم الیاسی' },
  { id: '4', name: 'خانم حضرتی' },
];

export const clinics: Clinic[] = [
  { id: '1', name: 'مطب نیکان', maxCapacity: 35 },
  { id: '2', name: 'مطب میرداماد', maxCapacity: 35 },
];

export const bankCards: BankCard[] = [
  { id: '1', maskedNumber: '6104 **** **** 1450', ownerName: 'نگار سعیدی', bankName: 'ملت' },
  { id: '2', maskedNumber: '5047 **** **** 4118', ownerName: 'نگار سعیدی', bankName: 'شهر' },
  { id: '3', maskedNumber: '5894 **** **** 3810', ownerName: 'نگار سعیدی', bankName: 'رفاه' },
  { id: '4', maskedNumber: '6219 **** **** 7989', ownerName: 'محمد مظاهری', bankName: 'بلوبانک' },
  { id: '5', maskedNumber: '6362 **** **** 5964', ownerName: 'محمد مظاهری', bankName: 'آینده' },
  { id: '6', maskedNumber: '6362 **** **** 6390', ownerName: 'محمد مظاهری', bankName: 'آینده' },
  { id: '7', maskedNumber: '6037 **** **** 2326', ownerName: 'محمد مظاهری', bankName: 'کشاورزی' },
  { id: '8', maskedNumber: '6037 **** **** 0136', ownerName: 'سعید مظاهری', bankName: 'صادرات' },
  { id: '9', maskedNumber: '6037 **** **** 3175', ownerName: 'سعید مظاهری', bankName: 'کشاورزی' },
  { id: '10', maskedNumber: '5859 **** **** 0191', ownerName: 'سعید مظاهری', bankName: 'تجارت' },
  { id: '11', maskedNumber: '6037 **** **** 2082', ownerName: 'سعید مظاهری', bankName: 'ملی' },
  { id: '12', maskedNumber: '6037 **** **** 8661', ownerName: 'نرجس حجتی‌پور', bankName: 'صادرات' },
  { id: '13', maskedNumber: '5029 **** **** 7199', ownerName: 'نیلوفر سعیدی‌پور', bankName: 'دی' },
  { id: '14', maskedNumber: '6221 **** **** 2780', ownerName: 'نیلوفر سعیدی‌پور', bankName: 'پارسیان' },
  { id: '15', maskedNumber: '6104 **** **** 6344', ownerName: 'محمد مظاهری', bankName: 'ملت' },
  { id: '16', maskedNumber: '6037 **** **** 1355', ownerName: 'محمد مظاهری', bankName: 'کشاورزی' },
  { id: '17', maskedNumber: '6362 **** **** 0712', ownerName: 'نگار سعیدی', bankName: 'آینده' },
  { id: '18', maskedNumber: '6280 **** **** 0783', ownerName: 'نگار سعیدی', bankName: 'مسکن' },
  { id: '19', maskedNumber: '5022 **** **** 9651', ownerName: 'نگار سعیدی', bankName: 'پاسارگاد' },
  { id: '20', maskedNumber: '5041 **** **** 9216', ownerName: 'نگین سعیدی', bankName: '' },
  { id: '21', maskedNumber: '6104 **** **** 7162', ownerName: 'نیلوفر سعیدی‌پور', bankName: 'ملت' },
  { id: '22', maskedNumber: '6219 **** **** 2910', ownerName: 'نگار سعیدی', bankName: 'بلوبانک' },
  { id: '23', maskedNumber: '6037 **** **** 6074', ownerName: 'سپیده فروغی', bankName: 'ملی' },
  { id: '24', maskedNumber: '5047 **** **** 1785', ownerName: 'فروزان رحیمی', bankName: 'شهر' },
  { id: '25', maskedNumber: '5029 **** **** 4941', ownerName: 'مریم نادی', bankName: 'دی' },
  { id: '26', maskedNumber: '6104 **** **** 4331', ownerName: 'علی قادری', bankName: 'ملت' },
  { id: '27', maskedNumber: '5859 **** **** 3319', ownerName: 'علی قادری', bankName: 'تجارت' },
  { id: '28', maskedNumber: '5041 **** **** 5224', ownerName: 'هادی رباط', bankName: '' },
  { id: '29', maskedNumber: '6219 **** **** 5687', ownerName: 'حمیدرضا بخشی', bankName: '' },
  { id: '30', maskedNumber: '5894 **** **** 7958', ownerName: 'عیسی بخشی', bankName: '' },
  { id: '31', maskedNumber: '5047 **** **** 4222', ownerName: 'مهران چشمه', bankName: '' },
  { id: '32', maskedNumber: '5047 **** **** 2546', ownerName: 'نوید نظری', bankName: '' },
  { id: '33', maskedNumber: '6037 **** **** 5527', ownerName: 'وحید پرحقی', bankName: '' },
  { id: '34', maskedNumber: '5022 **** **** 2405', ownerName: 'نرگس شیرزاد', bankName: 'پاسارگاد' },
  { id: '35', maskedNumber: '6037 **** **** 0361', ownerName: 'الهه میرزایی', bankName: '' },
  { id: '36', maskedNumber: '6104 **** **** 1966', ownerName: 'یوسف هنرمند', bankName: 'ملت' },
  { id: '37', maskedNumber: '6037 **** **** 6932', ownerName: 'دیانا افتخاری', bankName: '' },
];

export const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 8; hour < 24; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

export const timeSlots = generateTimeSlots();

// Generate sample patients for demo
export const generateSamplePatients = (): Patient[] => {
  const today = new Date();
  const patients: Patient[] = [];
  
  const sampleNames = [
    { firstName: 'زهرا', lastName: 'احمدی' },
    { firstName: 'محمد', lastName: 'رضایی' },
    { firstName: 'فاطمه', lastName: 'حسینی' },
    { firstName: 'علی', lastName: 'محمدی' },
    { firstName: 'مریم', lastName: 'کریمی' },
    { firstName: 'حسین', lastName: 'موسوی' },
    { firstName: 'سارا', lastName: 'جعفری' },
    { firstName: 'رضا', lastName: 'اکبری' },
    { firstName: 'نازنین', lastName: 'صادقی' },
    { firstName: 'امیر', lastName: 'هاشمی' },
  ];

  // Today's patients
  for (let i = 0; i < 5; i++) {
    const surgery = surgeries[Math.floor(Math.random() * surgeries.length)];
    const paid = Math.random() > 0.3 ? surgery.price : Math.floor(Math.random() * surgery.price);
    
    patients.push({
      id: `p-today-${i}`,
      firstName: sampleNames[i].firstName,
      lastName: sampleNames[i].lastName,
      nationalId: `123456789${i}`,
      phone: `0912${Math.floor(1000000 + Math.random() * 9000000)}`,
      surgeryId: surgery.id,
      surgeryPrice: surgery.price,
      surgeryDate: today,
      doctorId: doctors[Math.floor(Math.random() * doctors.length)].id,
      consultantId: consultants[Math.floor(Math.random() * consultants.length)].id,
      clinicId: clinics[Math.floor(Math.random() * clinics.length)].id,
      timeSlot: timeSlots[8 + i * 2],
      documents: [],
      payments: paid > 0 ? [{
        id: `pay-${i}`,
        amount: paid,
        cardId: bankCards[Math.floor(Math.random() * bankCards.length)].id,
        date: new Date(),
      }] : [],
      totalPaid: paid,
      remainingBalance: surgery.price - paid,
      status: paid >= surgery.price ? 'paid' : paid > 0 ? 'partial' : 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Next week patients
  for (let i = 0; i < 8; i++) {
    const daysAhead = Math.floor(Math.random() * 7) + 1;
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const surgery = surgeries[Math.floor(Math.random() * surgeries.length)];
    const depositAmounts = [1000000, 2000000, 3000000];
    const deposit = depositAmounts[Math.floor(Math.random() * depositAmounts.length)];
    
    patients.push({
      id: `p-week-${i}`,
      firstName: sampleNames[(i + 5) % sampleNames.length].firstName,
      lastName: sampleNames[(i + 5) % sampleNames.length].lastName,
      nationalId: `987654321${i}`,
      phone: `0935${Math.floor(1000000 + Math.random() * 9000000)}`,
      surgeryId: surgery.id,
      surgeryPrice: surgery.price,
      surgeryDate: futureDate,
      doctorId: doctors[Math.floor(Math.random() * doctors.length)].id,
      consultantId: consultants[Math.floor(Math.random() * consultants.length)].id,
      clinicId: clinics[Math.floor(Math.random() * clinics.length)].id,
      timeSlot: timeSlots[Math.floor(Math.random() * timeSlots.length)],
      documents: [],
      payments: [{
        id: `pay-week-${i}`,
        amount: deposit,
        cardId: bankCards[Math.floor(Math.random() * bankCards.length)].id,
        date: new Date(),
      }],
      totalPaid: deposit,
      remainingBalance: surgery.price - deposit,
      status: 'partial',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return patients;
};

export const getSurgeryById = (id: string): Surgery | undefined => {
  return surgeries.find(s => s.id === id);
};

export const getDoctorById = (id: string): Doctor | undefined => {
  return doctors.find(d => d.id === id);
};

export const getConsultantById = (id: string): Consultant | undefined => {
  return consultants.find(c => c.id === id);
};

export const getClinicById = (id: string): Clinic | undefined => {
  return clinics.find(c => c.id === id);
};

export const getCardById = (id: string): BankCard | undefined => {
  return bankCards.find(c => c.id === id);
};
