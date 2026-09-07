import { Component } from '@angular/core';
import { HabitList } from '../components/habit-list/habit-list';

@Component({
  selector: 'app-habit-tracker-page',
  imports: [HabitList],
  templateUrl: './habit-tracker-page.html',
  styleUrl: './habit-tracker-page.scss',
})
export class HabitTrackerPage {}
