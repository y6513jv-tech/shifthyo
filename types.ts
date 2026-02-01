
export enum ShiftType {
  EARLY = '早番',
  DAY = '日勤',
  LATE = '遅番',
  NIGHT = '夜勤',
  OFF = '休日',
  OTHER = 'その他'
}

export interface ShiftColor {
  bg: string;
  text: string;
}

export type ShiftColorMap = Record<string, ShiftColor>;

export interface Shift {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  type: ShiftType;
  startTime?: string;
  endTime?: string;
  note?: string;
}

export interface AppConfig {
  background: string;
}

export interface UITheme {
  cellBg: string;
  borderColor: string;
  dateColor: string;
  satColor: string;
  sunColor: string;
  headerColor: string;
}
