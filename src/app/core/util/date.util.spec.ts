import { fromIsoDate, maskCardNumber, toIsoDate } from './date.util';

describe('date and card utilities', () => {
  it('formats a date as yyyy-MM-dd using local time', () => {
    expect(toIsoDate(new Date(2025, 0, 5))).toBe('2025-01-05');
    expect(toIsoDate(new Date(2030, 11, 31))).toBe('2030-12-31');
  });

  it('parses a yyyy-MM-dd string back to the same local date', () => {
    const date = fromIsoDate('1999-07-09');
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([1999, 6, 9]);
  });

  it('masks all but the last 4 digits of a card number', () => {
    expect(maskCardNumber(1234567890)).toBe('•••• 7890');
    expect(maskCardNumber(undefined)).toBe('—');
  });
});
