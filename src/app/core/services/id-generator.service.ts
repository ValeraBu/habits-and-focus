import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IdGeneratorService {
  generate(): string {
    return crypto.randomUUID();
  }
}
