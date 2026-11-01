import { Injectable, signal } from '@angular/core';

export type DataMode = 'connecting' | 'api' | 'demo' | 'error';

@Injectable({ providedIn: 'root' })
export class DataModeService {
  readonly mode = signal<DataMode>('connecting');
  readonly message = signal('');

  useDemo(message = 'Using saved demo content in this browser.') {
    this.mode.set('demo');
    this.message.set(message);
  }

  useApi() {
    this.mode.set('api');
    this.message.set('');
  }

  fail(message: string) {
    this.mode.set('error');
    this.message.set(message);
  }
}
