/** Lundi = premier jour de la semaine (ISO) */
export function getStartOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export function addWeeks(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + 7 * n);
  return out;
}

export function getStartOfMonth(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), 1);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function addMonths(d: Date, n: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

/** Grille du mois : 6 semaines x 7 jours (lundi en premier). Inclut jours du mois précédent/suivant. */
export function getMonthGrid(monthStart: Date): Date[][] {
  const first = new Date(monthStart);
  const start = getStartOfWeek(first);
  const grid: Date[][] = [];
  for (let row = 0; row < 6; row++) {
    const rowDates: Date[] = [];
    for (let col = 0; col < 7; col++) {
      const d = new Date(start);
      d.setDate(d.getDate() + row * 7 + col);
      rowDates.push(d);
    }
    grid.push(rowDates);
  }
  return grid;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export function isCurrentMonth(d: Date, monthStart: Date): boolean {
  return d.getMonth() === monthStart.getMonth() && d.getFullYear() === monthStart.getFullYear();
}

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEEKDAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

export function getWeekdayLetters(): string[] {
  return WEEKDAY_LETTERS;
}
