import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponent, DataFetchService, GoogleAnalyticsService, Item, QueueService } from '@fy/xplat/core';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';
import { IonSearchbar, Platform, AlertController } from '@ionic/angular';
// import { GoogleAnalytics } from '@ionic-native/google-analytics/ngx';
// import { AppLauncher, AppLauncherOptions } from '@ionic-native/app-launcher/ngx';
// const options: AppLauncherOptions = {};
import * as path from 'path';
// import { MeiliSearch } from 'meilisearch';

@Component({
	selector: 'fy-mobile-page-header',
	templateUrl: 'mobile-page-header.component.html',
	styleUrls: ['./mobile-page-header.component.scss'],
})
export class MobilePageHeaderComponent extends BaseComponent implements OnInit {
	@ViewChild('searchbar') searchbar: IonSearchbar;
	@Input() home: string = '';
	searchOnFocus = false;
	searchResult: any = {};
	searchQuery: string = '';
	widgetSub: any;
	storeUrl: string;
	platformOs: string;
	private audioRootList = [];
	private videoRootList = [];
	constructor(
		private router: Router,
		private playerService: PlayerService,
		private platform: Platform,
		public dataFetchService: DataFetchService,
		public alertController: AlertController,
		private ga: GoogleAnalyticsService,
		private queueService: QueueService
		// public toastController: ToastController,
		// private appLauncher: AppLauncher,

	) {
		super();

		if (this.platform.is('android')) {
			this.storeUrl = 'market://details?id=mobi.fy.nextgen';
			this.platformOs = 'Android';
			// options.packageName = 'mobi.fy.nextgen';
		} else if (this.platform.is('ios')) {
			this.storeUrl = 'itms-apps://itunes.apple.com/app/fy-tv/id1438483905';
			this.platformOs = 'IOS';
			// options.uri = 'fy://';
		}

		this.widgetSub = this.playerService.videoWidgetLocation$.subscribe((location) => {
			if (location === 0) {
				this.searchOnFocus = false;
			}
		});


	}
	async ngOnInit() {
		this.videoRootList = await this.dataFetchService.fetchRoot('video');
		this.audioRootList = await this.dataFetchService.fetchRoot('audio');
	}

	async searchChange(e) {
		let index;
		if (this.home.includes('video')) {
			index = this.dataFetchService.searchClient.index('VGMV');
		} else if (this.home.includes('audio')) {
			index = this.dataFetchService.searchClient.index('VGMA');
		}
		this.searchQuery = e.detail.value;
		this.searchResult = await index.search(e.detail.value, {
			limit: 10
		});

		await Promise.all(this.searchResult.hits.map(async (item) => {
			item.value = item.name.replace(/[\-\_]+/g, ' ');
			item.thumb = await this.getItemThumbnail(item);
			item.pUrl = item.url.match(/.*(?=\.)/).toString();
			item.pName = await this.getParentName(item.pUrl);
		}))
	}

	setFocus(focus) {
		if (focus) {
			this.searchOnFocus = focus;
			if (this.playerService.videoWidgetLocation === 0) {
				this.playerService.videoWidgetLocation$.next(1);
			}
			setTimeout(() => { this.searchbar.setFocus() }, 150);

		} else {
			setTimeout(() => { this.searchOnFocus = focus }, 150)
		}
	}

	searchKeyPress(e) {
		if (e.key === 'Enter' && this.searchQuery) {
			this.searchMore(this.searchQuery)
			this.searchOnFocus = false;
		}
	}

	// routeNavigation(param) {
	//   if (!this.home.includes('favorite')) {
	//     this.router.navigate(['/tabs', this.home, 'search'], { queryParams: { param: param } });
	//     if (this.home === 'video') {
	//       this.playerService.videoPause();
	//     } else if (this.home === 'audio') {
	//       this.playerService.audioPause();
	//     }
	//   }
	// }

	selectItem(item) {
		console.log('item clicked', item);
		const itemUrl = item.url.replace(/.*\./, '');
		this.router.navigate(['/tabs', this.home, 'playlist', item.pUrl], { queryParams: { item: itemUrl } });
	}

	public searchMore(param) {
		if (!this.home.includes('favorite') && !this.home.includes('document')) {
			this.router.navigate(['/tabs', this.home, 'search'], { queryParams: { param: param } });
		}
		this.playerService.videoWidgetLocation$.next(2);
	}

	private async getParentName(pUrl) {
		return await this.dataFetchService.fetchSingleTopic(pUrl).then(item => item.name.replace(/[\-\_]+/g, ' '));
	};

	private async getItemThumbnail(item: any) {
		return await this.dataFetchService.getThumbnailUrl(item); // 'https://stream.vgm.tv/VGMV/01_BaiGiang/CacDienGia/MSNHB_DeHiepMotTrongPhucVu/preview/01.jpg';
	}

	async preloadData(item: Item) {
		if (item.isLeaf === null && this.dataFetchService.prefetchList.findIndex(elem => elem === item.id) < 0) {
			const playUrl = await this.dataFetchService.getPlayUrl(item, true);
			const dirUrl = path.dirname(playUrl);
			this.dataFetchService.prefetchList.push(item.id);
			(async () => {
				await this.queueService.queue.add(async () => {
					const fetchItems = ['key.vgmk', 'playlist.m3u8', '480p/content0.vgmx',
						// '720p/data0.vgmx', '1080p/data0.vgmx'
					];
					fetchItems.forEach(item => {
						const url = `${dirUrl}/${item}`;
						fetch(url);
					});
				});
			})();
		}
	}

	homeNavigation() {
		const param = this.home === 'video' ? this.videoRootList[0].url : this.home === 'audio' ? this.audioRootList[0].url : '';
		this.router.navigate(['/tabs', this.home, 'catalog'], { queryParams: { topicUrl: param } });
	}

	async handleApp() {
		let webAppBtn;
		if (this.platform.is('android')) {
			webAppBtn = {
				text: 'Web App',
				handler: async () => {
					if (this.dataFetchService.pwaPrompt) {
						this.dataFetchService.pwaPrompt.prompt();
						const { outcome } = await this.dataFetchService.pwaPrompt.userChoice;
						console.log(`User response to the install prompt: ${outcome}`);
						this.ga.trackEvent('pwa_prompt', `User Choice: ${outcome}`);
					}
				}
			}
		} else {
			webAppBtn = {
				text: 'Thoát',
				role: 'cancel',
				cssClass: 'secondary',
				handler: (blah) => {
					console.log('Confirm Cancel: blah');
				}
			}
		}
		const alert = await this.alertController.create({
			cssClass: 'alert-confirm',
			message: 'Tải ứng dụng <strong>"FUYIN.TV"</strong>',
			buttons: [
				webAppBtn,
				{
					text: `${this.platformOs} App`,
					handler: () => {
						window.location.href = this.storeUrl;
						this.ga.trackEvent('appstore_open', `Store: ${this.platformOs}`);
						console.log('Confirm download native app');
					}
				}
			]
		});

		await alert.present();
	}

}

