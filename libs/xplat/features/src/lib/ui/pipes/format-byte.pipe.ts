import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'formatByte',
	pure: true,
})
export class FormatBytePipe implements PipeTransform {
	transform(bytes: number): string {
		bytes = Math.abs(bytes);
		if (!+bytes) return '0 Bytes'
		const decimals = 2;
		const k = 1024
		const dm = decimals < 0 ? 0 : decimals
		const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
	}
}
