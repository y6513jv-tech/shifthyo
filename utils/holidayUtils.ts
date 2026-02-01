
/**
 * Utility to calculate Japanese public holidays.
 */

export const getJapaneseHolidays = (year: number, month: number): Record<string, string> => {
  const holidays: Record<string, string> = {};
  
  const add = (day: number, name: string) => {
    if (day < 1 || day > 31) return;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    holidays[dateStr] = name;
  };

  const getVernalEquinox = (y: number): number => {
    if (y < 1900 || y > 2099) return 20;
    return Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
  };

  const getAutumnalEquinox = (y: number): number => {
    if (y < 1900 || y > 2099) return 23;
    return Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
  };

  const getNthMonday = (y: number, m: number, nth: number): number => {
    const firstDay = new Date(y, m - 1, 1).getDay();
    let firstMonday = 1 + (8 - firstDay) % 7;
    if (firstDay === 1) firstMonday = 1;
    return firstMonday + (nth - 1) * 7;
  };

  // Fixed holidays
  if (month === 1) {
    add(1, '元日');
    add(getNthMonday(year, 1, 2), '成人の日');
  }
  if (month === 2) {
    add(11, '建国記念の日');
    add(23, '天皇誕生日');
  }
  if (month === 3) add(getVernalEquinox(year), '春分の日');
  if (month === 4) add(29, '昭和の日');
  if (month === 5) {
    add(3, '憲法記念日');
    add(4, 'みどりの日');
    add(5, 'こどもの日');
  }
  if (month === 7) add(getNthMonday(year, 7, 3), '海の日');
  if (month === 8) add(11, '山の日');
  if (month === 9) {
    add(getNthMonday(year, 9, 3), '敬老の日');
    add(getAutumnalEquinox(year), '秋分の日');
  }
  if (month === 10) add(getNthMonday(year, 10, 2), 'スポーツの日');
  if (month === 11) {
    add(3, '文化の日');
    add(23, '勤労感謝の日');
  }

  // Substitute holidays (振替休日)
  // Check Sundays in this month
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month - 1, d);
    if (date.getMonth() !== month - 1) break;
    
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (holidays[dateStr] && date.getDay() === 0) { // Holiday is Sunday
      let subDay = new Date(date);
      subDay.setDate(date.getDate() + 1);
      let subDayStr = `${subDay.getFullYear()}-${String(subDay.getMonth() + 1).padStart(2, '0')}-${String(subDay.getDate()).padStart(2, '0')}`;
      
      // If the next day is also a holiday, keep moving (Golden Week logic)
      while (holidays[subDayStr]) {
        subDay.setDate(subDay.getDate() + 1);
        subDayStr = `${subDay.getFullYear()}-${String(subDay.getMonth() + 1).padStart(2, '0')}-${String(subDay.getDate()).padStart(2, '0')}`;
      }
      
      if (subDay.getMonth() + 1 === month) {
        holidays[subDayStr] = '振替休日';
      }
    }
  }

  // National holidays (国民の休日)
  // Sandwiched day between two holidays becomes a holiday (e.g., Silver Week)
  if (month === 9) {
    const respect = getNthMonday(year, 9, 3);
    const autumnal = getAutumnalEquinox(year);
    if (autumnal - respect === 2) {
      add(respect + 1, '国民の休日');
    }
  }

  return holidays;
};
