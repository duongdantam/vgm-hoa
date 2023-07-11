import { Injectable } from '@angular/core';
// declare const gtag: Function;

@Injectable({
	providedIn: 'root'
})

export class GoogleAnalyticsService {

	constructor() { }

	startTrackerWithId(id) {
		// gtag('config', id);
	}

	trackPlatform(platformData: string) {
		// gtag('event', 'platform', {
		//   platform: platformData
		// })
	}

	trackView(pageUrl: string) {
		// gtag('event', 'page_view', {
		//   page_path: pageUrl
		// })
	}

	trackEvent(category, label?, value?) {
		// gtag('event', category, {
		//   info: label,
		//   value: value
		// })
	}
}