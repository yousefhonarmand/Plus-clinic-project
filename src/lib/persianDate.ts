import jalaali from 'jalaali-js';

const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const persianWeekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const persianWeekDaysFull = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

export interface PersianDate {
  jy: number;
  jm: number;
  jd: number;
}

export function toPersianDate(date: Date): PersianDate {
  return jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function toGregorianDate(jy: number, jm: number, jd: number): Date {
  const g = jalaali.toGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd);
}

export function formatPersianDate(date: Date): string {
  const persian = toPersianDate(date);
  return `${persian.jy}/${persian.jm.toString().padStart(2, '0')}/${persian.jd.toString().padStart(2, '0')}`;
}

export function formatPersianDateFull(date: Date): string {
  const persian = toPersianDate(date);
  return `${persian.jd} ${persianMonths[persian.jm - 1]} ${persian.jy}`;
}

export function formatPersianDateWithDay(date: Date): string {
  const persian = toPersianDate(date);
  const dayOfWeek = getPersianDayOfWeek(date);
  return `${persianWeekDaysFull[dayOfWeek]} ${persian.jd} ${persianMonths[persian.jm - 1]}`;
}

export function getPersianDayOfWeek(date: Date): number {
  // Convert JS day (0=Sunday) to Persian (0=Saturday)
  const jsDay = date.getDay();
  return (jsDay + 1) % 7;
}

export function toPersianNumber(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
}

export function toEnglishNumber(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[۰-۹]/g, (d) => persianDigits.indexOf(d).toString());
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount);
}

export function parseCurrency(str: string): number {
  // Remove commas and convert Persian digits to English
  const cleaned = str.replace(/[,،\s]/g, '');
  const english = toEnglishNumber(cleaned);
  // Use parseFloat for large numbers
  const num = parseFloat(english);
  return isNaN(num) ? 0 : Math.floor(num);
}

export function getDaysInPersianMonth(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}

export function getFirstDayOfPersianMonth(jy: number, jm: number): number {
  const gDate = toGregorianDate(jy, jm, 1);
  return getPersianDayOfWeek(gDate);
}

export function getPersianMonthName(month: number): string {
  return persianMonths[month - 1];
}

export function getPersianWeekDays(): string[] {
  return persianWeekDays;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getStartOfWeek(date: Date): Date {
  const day = getPersianDayOfWeek(date);
  return addDays(date, -day);
}

export function getEndOfWeek(date: Date): Date {
  const day = getPersianDayOfWeek(date);
  return addDays(date, 6 - day);
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function getNextWeekRange(): { start: Date; end: Date } {
  const today = new Date();
  const start = addDays(today, 1);
  const end = addDays(today, 7);
  return { start, end };
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return d >= s && d <= e;
}

export { persianMonths, persianWeekDays, persianWeekDaysFull };
