import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { BaseComponent, DataFetchService } from '@fy/xplat/core';


import { IonSlides } from '@ionic/angular';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';

export interface TopMenuItem {
	key: string;
	value: string;
	href: string;
}

@Component({
	selector: 'fy-top-menu',
	templateUrl: 'top-menu.component.html',
	styleUrls: ['./top-menu.component.scss'],
})

export class TopMenuComponent extends BaseComponent implements OnInit, OnChanges {
	@ViewChild(IonSlides) slides: IonSlides
	@Input() home = '';
	@Input() activeId: string;
	private _dataInit = false;
	public activeHref = '';

	public menuList: TopMenuItem[] = [];
	// topMenuActive = true;
	constructor(
		private router: Router,
		private dataFetchService: DataFetchService,
		private playerService: PlayerService
	) {
		super();

		this.router.events.subscribe(async (event) => {
			if (
				event instanceof NavigationEnd &&
				event.url.includes(`/tabs/${this.home}/`)
			) {
				if (!this._dataInit) await this.dataInit();
				this.activeHref = event.url
					.split('/')
					.pop()
					.match(/(?!.*[^?item=]=)(?!\=).*/)
					.toString();
				const tabIndex = this.menuList.findIndex(list => this.activeHref.startsWith(list.href));
				if (this.activeHref && this.menuList && this.slides) {
					this.slides.getSwiper().then(swiper => {
						swiper.slideTo(tabIndex - 1)
					})
				}
			}
		});


		// this.router.events.subscribe(event => {
		//   if (event instanceof NavigationEnd) {
		//     if (event.url.includes('/search?param=')) {
		//       this.topMenuActive = false
		//     } else {
		//       this.topMenuActive = true
		//     }
		//   }
		// })
	}

	async ngOnChanges(changes: SimpleChanges) {
		if (!this._dataInit) await this.dataInit();
		if ('activeId' in changes) {
			const tabIndex = this.menuList.findIndex(list => list.key === this.activeId);
			this.activeHref = this.menuList[tabIndex].href;
			if (this.activeId && this.menuList && this.slides) {
				this.slides.getSwiper().then(swiper => {
					swiper.slideTo(tabIndex - 1)
				})
			}
		}
	}

	async ngOnInit() {
		if (!this._dataInit) await this.dataInit();
	}

	async dataInit() {
		const fetchVideo = this.dataFetchService.fetchRoot('video').then(async list => {
			return list.map((item) => ({
				key: item.id,
				value: item.name.replace(/[0-9]+\-/g, ''),
				href: item.url,
			}));
		});

		const fetchAudio = this.dataFetchService.fetchRoot('audio').then(list => {
			return list.map((item) => ({
				key: item.id,
				value: item.name.replace(/[0-9]+\-/g, ''),
				href: item.url,
			}));
		});
		const [vList, aList] = await Promise.all([fetchVideo, fetchAudio]);
		this.menuList = this.home === 'video' ? vList : this.home === 'audio' ? aList : [];
		this.activeId = this.menuList && this.menuList.length > 0 ? this.menuList[0].key : '';
		this._dataInit = true;
	}

	itemClick() {
		if (this.playerService.playerWidgetLocation === 0) {
			this.playerService.playerWidgetLocation$.next(1);
		}
	}

}
