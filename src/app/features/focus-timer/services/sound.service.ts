import { Injectable, inject, signal } from '@angular/core';
import { STORAGE_KEYS } from '../../../core/models/storage-schema';
import { StorageService } from '../../../core/services/storage.service';

export type SoundType = 'complete' | 'tick';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private readonly storage = inject(StorageService);

  private audioContext: AudioContext | null = null;

  readonly enabled = signal<boolean>(this.storage.get<boolean>(STORAGE_KEYS.soundEnabled, true));

  toggleEnabled(): void {
    this.enabled.update((value) => !value);
    this.storage.set(STORAGE_KEYS.soundEnabled, this.enabled());
  }

  play(type: SoundType): void {
    if (!this.enabled()) {
      return;
    }
    if (type === 'complete') {
      this.playCompleteChime();
    }
  }

  private playCompleteChime(): void {
    try {
      const context = this.getAudioContext();
      const now = context.currentTime;

      [880, 1108].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;

        const start = now + index * 0.18;
        const end = start + 0.16;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
        gain.gain.linearRampToValueAtTime(0, end);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(end);
      });
    } catch {
      // Web Audio API may be unavailable (unsupported browser, autoplay restrictions) — fail silently
    }
  }

  private getAudioContext(): AudioContext {
    this.audioContext ??= new AudioContext();
    return this.audioContext;
  }
}
