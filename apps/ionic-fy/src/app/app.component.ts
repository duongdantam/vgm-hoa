import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar as NgxStatusBar } from '@ionic-native/status-bar/ngx';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { DataFetchService, OfflineService, GoogleAnalyticsService } from '@fy/xplat/core';
// import { SwPush } from '@angular/service-worker';
import { NavigationEnd, Router } from '@angular/router';
// import { GoogleAnalytics } from '@ionic-native/google-analytics/ngx';
// import { filter } from 'rxjs/operators';

// import { BackgroundFetch, BackgroundFetchConfig } from '@ionic-native/background-fetch/ngx';
// import { BackgroundFetch } from '@transistorsoft/capacitor-background-fetch';
@Component({
	selector: 'fy-root',
	templateUrl: 'app.component.html',
	styleUrls: ['app.component.scss'],
})
export class AppComponent {
	windowMode;
	googleTrackerID = '';
	constructor(
		private platform: Platform,
		private statusBar: NgxStatusBar,
		// private backgroundFetch: BackgroundFetch,
		private offlineService: OfflineService,
		private screenOrientation: ScreenOrientation,
		private dataFetchService: DataFetchService,
		private ga: GoogleAnalyticsService,
		private router: Router,
		// private swPush: SwPush
		// private ga: GoogleAnalytics,
		// public toastController: ToastController,
	) {
		// Initialize deferredPrompt for use later to show browser install prompt.
		this.windowMode = this.getPWADisplayMode();
		if (this.windowMode !== 'browser') {
			this.dataFetchService.appInstalled === true;
		}

		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			this.dataFetchService.pwaPrompt = e;
			this.dataFetchService.appInstalled = false;
			console.log(`'beforeinstallprompt' event was fired.`);
		});

		window.addEventListener('appinstalled', () => {
			this.dataFetchService.appInstalled = true;
			this.dataFetchService.pwaPrompt = null;
			console.log('PWA was installed');
		});

		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				this.ga.trackView(event.urlAfterRedirects);
			}
		})
		// options: AppLauncherOptions = {};
		// if (this.platform.is('ios')) {
		//   this.options.uri = 'fy://';
		// } else {
		//   this.options.packageName = 'mobi.fy.nextgen';
		// };
		// this.appLauncher.canLaunch(this.options).then((canLaunch: boolean) => {
		//   console.log('Your APP is available');
		//   this.dataFetchService.appInstalled = true;
		//   this.presentToastWithOptions();
		// }).catch((error: any) => {
		//   this.dataFetchService.appInstalled = false;
		//   console.error('Your APP is not available');
		// });
		this.initializeApp();
		this.offlineService.initializeOfflineDB();
	}


	// async presentToastWithOptions() {
	//   const toast = await this.toastController.create({
	//     // header: 'Xem tại ứng dụng "fy.TV"',
	//     message: 'Xem tại ứng dụng "fy.TV"',
	//     position: 'bottom',
	//     cssClass: 'toast-info open-app-toast',
	//     buttons: [
	//       {
	//         text: 'Đóng',
	//         role: 'cancel',
	//         handler: () => {
	//           console.log('Cancel clicked');
	//         }
	//       },
	//       {
	//         text: 'Mở',
	//         handler: () => {
	//           this.appLauncher.launch(this.options);
	//           console.log('Open app clicked');
	//         }
	//       }
	//     ]
	//   });
	//   await toast.present();

	//   const { role } = await toast.onDidDismiss();
	//   console.log('onDidDismiss resolved with role', role);
	// }

	initializeApp() {


		// add google analytics

		this.ga.startTrackerWithId(this.googleTrackerID); // G-FG1Z70K8SM G-T6WF46T2D9
		this.platform.ready().then(async () => {
			console.log('platforms:', this.platform.platforms())
			await SplashScreen.hide();
			this.ga.trackPlatform(`${this.windowMode}: ${this.platform.platforms().toString()}`);
			console.log(this.windowMode, ':', this.platform.platforms().toString());
			// this.trackView('testhahah', 'asdfksadfh');
			// this.ga.startTrackerWithId('G-FG1Z70K8SM').then(() => { // tracking id: 'UA-56312406-1'
			//   console.log('Google analytics is ready now');
			//   this.ga.trackView('test');
			//   this.ga.debugMode();
			//   this.ga.setAllowIDFACollection(true);
			//   // Tracker is ready
			//   // You can now track pages or set additional information such as AppVersion or UserId
			// }).catch(e => console.log('Error starting GoogleAnalytics', e));

			// this.swPush.messages.subscribe(message => {
			//   console.log('message from SW:', message);
			// })

			if (this.platform.is('capacitor')) {

				// StatusBar.setOverlaysWebView({
				//   overlay: true,
				// });
				// StatusBar.setStyle({
				//   style: StatusBarStyle.Light
				// });
				this.statusBar.overlaysWebView(true);
				this.statusBar.styleDefault();
				// this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
				this.platform.backButton.subscribeWithPriority(0, () => {
					navigator['app'].exitApp();
				})
				// const config: BackgroundFetchConfig = {
				//   stopOnTerminate: true, // Set true to cease background-fetch from operating after user "closes" the app. Defaults to true.
				// };

				// await this.backgroundFetch.configure(config).then(() => {
				//   console.log('Background Fetch initialized');
				//   this.backgroundFetch.finish('');

				// })
				// .catch(e => console.log('Error initializing background fetch', e));
				// Checking BackgroundFetch status:
				// if (this.backgroundFetch.status) {
				//   console.log('background fetch status', this.backgroundFetch.status);
				// }

			} else {
				// StatusBar.setStyle({
				//   style: StatusBarStyle.Light
				// });
				// this.statusBar.styleDefault();
				// this.splashScreen.hide();
			}



		});
	}

	getPWADisplayMode() {
		const nav: any = navigator;
		const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
		if (document.referrer.startsWith('android-app://')) {
			return 'twa';
		} else if (nav.standalone || isStandalone) {
			return 'standalone';
		}
		return 'browser';
	}




	// ngAfterContentInit() {
	//   this.initBackgroundFetch();
	// }

	// async initBackgroundFetch() {
	//   const status = await BackgroundFetch.configure({
	//     minimumFetchInterval: 15
	//   }, async (taskId) => {
	//     console.log('[BackgroundFetch] EVENT:', taskId);
	//     // Perform your work in an awaited Promise
	//     const result = await this.performYourWorkHere();
	//     console.log('[BackgroundFetch] work complete:', result);
	//     // [REQUIRED] Signal to the OS that your work is complete.
	//     BackgroundFetch.finish(taskId);
	//   }, async (taskId) => {
	//     // The OS has signalled that your remaining background-time has expired.
	//     // You must immediately complete your work and signal #finish.
	//     console.log('[BackgroundFetch] TIMEOUT:', taskId);
	//     // [REQUIRED] Signal to the OS that your work is complete.
	//     BackgroundFetch.finish(taskId);
	//   });

	//   // Checking BackgroundFetch status:
	//   if (status !== BackgroundFetch.STATUS_AVAILABLE) {
	//     // Uh-oh:  we have a problem:
	//     if (status === BackgroundFetch.STATUS_DENIED) {
	//       alert('The user explicitly disabled background behavior for this app or for the whole system.');
	//     } else if (status === BackgroundFetch.STATUS_RESTRICTED) {
	//       alert('Background updates are unavailable and the user cannot enable them again.')
	//     }
	//   }
	// }

	// async performYourWorkHere() {
	//   return new Promise((resolve, reject) => {
	//     setTimeout(() => {
	//       resolve(true);
	//     }, 5000);
	//   });
	// }
}
