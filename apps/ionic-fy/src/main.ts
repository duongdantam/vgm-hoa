import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
	enableProdMode();

	// // HACK: Don't log to console in production environment.
	if (window) {
		window.console.log = window.console.warn = window.console.info = function () {
			// Don't log anything.
		};

	}
	// // TODO: This can be done in better way using logger service and logger factory.
}


const registerServiceWorker = async (swName: string) => {
	if ('serviceWorker' in navigator) {
		console.log('got SW:::::', navigator.serviceWorker);
		await navigator.serviceWorker
			.register(`/${swName}.js`)
			.then(reg => {
				reg.update();
				let serviceWorker;
				if (reg.installing) {
					serviceWorker = reg.installing;
				} else if (reg.waiting) {
					serviceWorker = reg.waiting;
				} else if (reg.active) {
					serviceWorker = reg.active;
				}
				if (serviceWorker) {
					console.log('sw current state:', serviceWorker.state);
					serviceWorker.onstatechange = () => {
						console.log('sw state changed:', serviceWorker.state);
						if (serviceWorker.state === 'activated') {
							// window.location.reload();
						}
					}
				}
				console.log('[App] Successful service worker registration', reg);
			})
			.catch(err =>
				console.error('[App] Service worker registration failed', err)
			);
		await navigator.serviceWorker.ready

	} else {
		console.error('[App] Service Worker API is not supported in current browser');
	}
}


platformBrowserDynamic()
	.bootstrapModule(AppModule)
	.catch((err) => console.log(err));
registerServiceWorker('service-worker');