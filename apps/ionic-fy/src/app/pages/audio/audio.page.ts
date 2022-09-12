import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { DataFetchService } from '@fy/xplat/core';

@Component({
	selector: 'fy-audio',
	templateUrl: './audio.page.html',
	styleUrls: ['./audio.page.scss'],
})
export class AudioPage implements OnInit {
	public audioList: any[] = [];
	public activeHref: string = '';
	constructor(
		private router: Router,
		// private activatedRoute: ActivatedRoute,
		public dataFetchService: DataFetchService
	) {
		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd && event.url.includes('/tabs/audio/')) {
				this.activeHref = event.url;
			}
		})
	}

	async init() {
		// this.playPingPong();
		this.audioList = await this.dataFetchService.fetchRoot('audio').then((list) => {
			return list.map((item) => ({
				key: item.id,
				value: item.name.replace(/[0-9]+\-/g, ''),
				href: item.url,
			}));
		});

		if (this.activeHref === '/tabs/audio/catalog') {
			const id = `${this.audioList[0].href}-btn`;
			setTimeout(() => {
				document.getElementById(id).click();
			}, 10);
		}
	}

	async ngOnInit() {
		if (!this.dataFetchService.isInitialized) {
			await this.dataFetchService.init();
		}
		this.init()
			.then(() => {
				console.log(`App init state: ${this.dataFetchService.isInitialized}`);
				this.fallback();
			})
			.catch((err) => {
				console.warn(err);
				this.fallback();
			});


	}

	/**
	 * Fallback to fy Core initialization method if cache existing
	 * @returns
	 */
	async fallback() {
		if (this.audioList) {
			if (!this.dataFetchService.isInitialized) {
				await this.dataFetchService.init();
			}
			return;
		}
		if (!this.dataFetchService.isInitialized) {
			this.router.navigateByUrl(`/home?redirectTo=${this.router.url}`, {
				replaceUrl: true,
			});
		}
	}
}
