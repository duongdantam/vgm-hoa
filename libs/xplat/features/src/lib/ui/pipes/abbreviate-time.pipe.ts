import { Pipe, PipeTransform } from '@angular/core';
import { parse } from 'path';

@Pipe({
  name: 'abbreviateTime',
  pure: true,
})
export class AbbreviateTimePipe implements PipeTransform {
  transform(value: string): string {
    let fullTime = value.split(':');
    if (fullTime.length > 2) {
      return (parseInt(fullTime[0]) * 60 + parseInt(fullTime[1])).toString() + ':' + fullTime[2];
    } else {
      return `${fullTime[0]}:${fullTime[1].padStart(2, '0')}`;
    }
  }
}
