export type FocusSessionType = 'focus' | 'break';

export interface FocusSession {
  id: string;
  habitId?: string;
  durationMinutes: number;
  startedAt: string;
  completedAt?: string;
  type: FocusSessionType;
}
