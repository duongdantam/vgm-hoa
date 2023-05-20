import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'formatName',
	pure: true,
})
export class FormatNamePipe implements PipeTransform {
	transform(name: string): string {
		name = name ? name.replace(/^[\d\s-]+/g, '') : name;
		if (name && name.match(/^[年|月|日]$/)) {
			return "天天親近主"
		} else {
			return name
		}
	}
}
