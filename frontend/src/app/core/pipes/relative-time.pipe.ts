import { Pipe, PipeTransform } from '@angular/core';

const TIME_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

@Pipe({
  name: 'relativeTime',
  standalone: true,
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: string): string {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return 'unknown time';
    const seconds = (timestamp - Date.now()) / 1000;
    const unit = TIME_UNITS.find(([, size]) => Math.abs(seconds) >= size);
    if (!unit) return 'just now';
    return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(
      Math.round(seconds / unit[1]),
      unit[0],
    );
  }
}
