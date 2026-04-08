/**
 * Birth date from 8 digits: MM, DD, YYYY (2+2+4).
 * Ollie Code targets ages 7–13 (same as prior age-gate copy).
 */

const MIN_AGE = 7;
const MAX_AGE = 13;

/** Build ISO date string YYYY-MM-DD or null if digits are incomplete/invalid. */
export function isoDateFromDigits(digits: readonly string[]): string | null {
  if (digits.length !== 8 || digits.some((d) => !/^\d$/.test(d))) return null;
  const mm = Number(digits[0] + digits[1]);
  const dd = Number(digits[2] + digits[3]);
  const yyyy = Number(digits[4] + digits[5] + digits[6] + digits[7]);
  const d = parseCalendarDate(mm, dd, yyyy);
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseCalendarDate(month: number, day: number, year: number): Date | null {
  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

function ageOnDate(birth: Date, today: Date): number {
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

/** Error message for UI, or null if ISO date is valid and age is in range. */
export function validateBirthDateForSignup(isoDate: string): string | null {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return "Enter your full birth date.";
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  const birth = parseCalendarDate(m, d, y);
  if (!birth) return "That date doesn’t look right. Check month, day, and year.";
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  birth.setHours(12, 0, 0, 0);
  if (birth > today) return "Birth date can’t be in the future.";
  const age = ageOnDate(birth, today);
  if (age < MIN_AGE) {
    return `Ollie Code is for ages ${MIN_AGE}–${MAX_AGE}. Ask a parent if you need help.`;
  }
  if (age > MAX_AGE) {
    return `Ollie Code is for ages ${MIN_AGE}–${MAX_AGE}. Ask a parent if you need help.`;
  }
  return null;
}
