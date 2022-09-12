import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'readableTime',
  pure: true,
})
export class ReadableTimePipe implements PipeTransform {
  transform(value: number): string {
    let millis = value * 1000;
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    const time =
      (minutes + '').padStart(2, '0') + ':' + seconds.padStart(2, '0');
    return time;
  }
}
