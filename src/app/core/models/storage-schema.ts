export const STORAGE_KEYS = {
  habits: 'habit-hub:habits',
  logs: 'habit-hub:logs',
  sessions: 'habit-hub:sessions',
  schemaVersion: 'habit-hub:schema-version',
  // UI preferences, not business data — kept under their own keys on purpose.
  theme: 'habit-hub:theme',
  soundEnabled: 'habit-hub:sound-enabled',
  reminderEnabled: 'habit-hub:reminder-enabled',
  reminderTime: 'habit-hub:reminder-time',
  reminderLastShownDate: 'habit-hub:reminder-last-shown-date',
  timerState: 'habit-hub:timer-state',
} as const;

export const CURRENT_SCHEMA_VERSION = 1;
