# Habit & Focus Hub — проектный бриф

Тестовый проект для практики с Claude Code и Cursor. Трекер привычек и рутин с таймером фокуса и уютной аналитикой.

## 1. Стек и принципы

- **Angular** (последняя стабильная версия, standalone-компоненты, без NgModules)
- **TypeScript** (strict mode)
- **Хранение данных**: localStorage (без бэкенда)
- **Архитектура**: feature-based
- **Состояние**: Angular Signals (без NgRx — для проекта такого размера избыточно)
- **Стили**: SCSS, можно с CSS-переменными для тем

## 2. Три основные фичи

1. **Habit Tracker** — ежедневные микро-привычки, чекбоксы выполнения, streak, дневной прогресс-бар.
2. **Focus Timer** — Pomodoro-таймер (25/5 по умолчанию, настраиваемый), звук по завершении, счётчик сессий за день.
3. **Dashboard** — статистика за неделю/месяц, heatmap активности (как GitHub), простые графики.

## 3. Структура проекта (feature-based)

```
src/
  app/
    core/                        # синглтон-сервисы, общие для всего приложения
      services/
        storage.service.ts       # типизированная обёртка над localStorage
        id-generator.service.ts
      models/
        storage-schema.ts        # версия схемы, ключи localStorage
    shared/                      # переиспользуемое между фичами
      components/
        checkbox/
        progress-bar/
        icon-picker/
        button/
      pipes/
        duration.pipe.ts
      directives/
      utils/
        date.utils.ts            # работа с датами, ISO-строки, сравнение дней
    features/
      habit-tracker/
        components/
          habit-list/
          habit-card/
          habit-form/            # создание/редактирование привычки
        services/
          habit.service.ts       # CRUD + сигналы habits(), todayLogs()
          streak.util.ts         # чистая функция расчёта streak
        models/
          habit.model.ts
        habit-tracker.routes.ts
      focus-timer/
        components/
          timer/
          session-history/
        services/
          timer.service.ts       # состояние таймера как сигнал, tick через RxJS interval
          sound.service.ts       # звуковой сигнал по завершении
        models/
          focus-session.model.ts
        focus-timer.routes.ts
      dashboard/
        components/
          heatmap/
          stats-cards/
          weekly-chart/
        services/
          analytics.service.ts   # агрегация HabitLog/FocusSession в статистику
        dashboard.routes.ts
    app.routes.ts                 # lazy loading каждой фичи через loadChildren/loadComponent
    app.config.ts
    app.component.ts
  assets/
  styles/
    _variables.scss
    _themes.scss
```

Принцип: каждая фича самодостаточна (свои компоненты, сервисы, модели), не знает о внутренностях других фич. Общее — только через `core` и `shared`. Роутинг — lazy loading по фичам.

## 4. Модели данных

```typescript
// core/models/storage-schema.ts
export const STORAGE_KEYS = {
  habits: 'habit-hub:habits',
  logs: 'habit-hub:logs',
  sessions: 'habit-hub:sessions',
  schemaVersion: 'habit-hub:schema-version',
} as const;

// features/habit-tracker/models/habit.model.ts
export interface Habit {
  id: string;
  name: string;                  // «Прочитать 15 страниц»
  category: HabitCategory;       // reading | knitting | study | custom
  icon: string;                  // emoji или имя иконки
  color: string;                 // hex для UI/heatmap
  targetPerDay: number;          // 15, 2, 5...
  unit: string;                  // «страниц», «рядов», «слов»
  createdAt: string;             // ISO date
  active: boolean;
}

export type HabitCategory = 'reading' | 'knitting' | 'study' | 'custom';

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;                  // ISO date (YYYY-MM-DD), без времени
  value: number;                 // сколько сделано (для прогресс-бара)
  completed: boolean;            // value >= targetPerDay
  createdAt: string;             // ISO datetime
}

// features/focus-timer/models/focus-session.model.ts
export interface FocusSession {
  id: string;
  habitId?: string;              // опциональная привязка к привычке
  durationMinutes: number;
  startedAt: string;             // ISO datetime
  completedAt?: string;          // null если сессия прервана
  type: 'focus' | 'break';
}
```

**Streak** и агрегированная статистика не хранятся отдельно — считаются на лету из `HabitLog[]` через чистые функции (`streak.util.ts`, `analytics.service.ts`), чтобы не было рассинхрона данных.

**StorageService** — единая типизированная обёртка:

```typescript
get<T>(key: string, fallback: T): T
set<T>(key: string, value: T): void
```

со `schemaVersion` в отдельном ключе — задел на будущие миграции формата данных.

## 5. Пошаговый план разработки

Этапы рассчитаны так, чтобы каждый был отдельной законченной задачей — удобно прогонять через Claude Code и Cursor по очереди и сравнивать результат.

1. **Инициализация проекта** — Angular CLI, standalone bootstrap, роутинг, ESLint/Prettier, базовые папки core/shared/features, настройка SCSS-переменных.
2. **Core-слой** — `StorageService`, `id-generator.service.ts`, утилиты работы с датами.
3. **Habit Tracker: CRUD** — форма создания/редактирования привычки, список привычек, удаление/архивация.
4. **Habit Tracker: выполнение** — чекбоксы на сегодня, запись `HabitLog`, расчёт и отображение streak, дневной прогресс-бар.
5. **Focus Timer** — компонент таймера (старт/пауза/сброс), звуковой сигнал по завершении сессии, счётчик сессий за день, опциональная привязка к привычке.
6. **Dashboard: агрегация** — `analytics.service.ts` считает часы/дни за неделю и месяц по логам и сессиям.
7. **Dashboard: визуализация** — heatmap активности (свой SVG-компонент или ngx-charts), карточки со статистикой, недельный график.
8. **UI-полировка** — анимации чекбоксов и стрика, адаптивная вёрстка, тёмная/светлая тема через CSS-переменные.
9. *(опционально)* Экспорт/импорт данных в JSON, PWA/offline через Angular Service Worker.
