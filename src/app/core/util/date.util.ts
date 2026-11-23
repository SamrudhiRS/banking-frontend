/** Converts a Date to the yyyy-MM-dd string the backend (LocalDate) expects, without timezone shifts. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses a yyyy-MM-dd string into a local Date. */
export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Shows only the last 4 digits of a card number. */
export function maskCardNumber(cardNumber?: number): string {
  if (cardNumber === undefined || cardNumber === null) {
    return '—';
  }
  const digits = String(cardNumber);
  return `•••• ${digits.slice(-4)}`;
}
