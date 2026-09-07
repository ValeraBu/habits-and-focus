import { Component } from '@angular/core';
import { Timer } from '../components/timer/timer';

@Component({
  selector: 'app-focus-timer-page',
  imports: [Timer],
  templateUrl: './focus-timer-page.html',
  styleUrl: './focus-timer-page.scss',
})
export class FocusTimerPage {}
