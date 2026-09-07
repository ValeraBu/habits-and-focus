export function todayISO(): string {
  return toISODate(new Date());
}

export function isSameDay(a: string, b: string): boolean {
  return toISODate(new Date(a)) === toISODate(new Date(b));
}

export function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const dateA = new Date(toISODate(new Date(a)));
  const dateB = new Date(toISODate(new Date(b)));
  return Math.round((dateB.getTime() - dateA.getTime()) / msPerDay);
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
