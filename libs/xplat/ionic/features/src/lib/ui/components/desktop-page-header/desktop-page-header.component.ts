import { Component, Input, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BaseComponent, DataFetchService, Item, QueueService } from '@fy/xplat/core';
import { Location } from '@angular/common';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';
import * as path from 'path';
import { MeiliSearch } from 'meilisearch';
import { filter, map } from 'rxjs/operators';


@Component({
	selector: 'fy-desktop-page-header',
	templateUrl: 'desktop-page-header.component.html',
	styleUrls: ['./desktop-page-header.component.scss'],
})
export class DesktopPageHeaderComponent extends BaseComponent {
	@Input() home: string = 'video';
	searchOnFocus = false;
	searchResult: any = {};
	searchQuery: string = '';
	constructor(
		private router: Router,
		private location: Location,
		private playerService: PlayerService,
		public dataFetchService: DataFetchService,
		private queueService: QueueService
	) {
		super();
	}

	async searchChange(e) {
		let index;
		if (this.home.includes('video')) {
			index = this.dataFetchService.searchClient.index('VGMV');
		} else if (this.home.includes('audio')) {
			index = this.dataFetchService.searchClient.index('VGMA');
		}
		this.searchQuery = e.detail.value;
		try {
			this.searchResult = await index.search(e.detail.value, {
				limit: 20
			});
			if (this.searchResult && typeof this.searchResult.hits[0] != 'undefined') {
				await Promise.all(this.searchResult.hits.map(async (item) => {
					item.value = item.name.replace(/[\-\_]+/g, ' ');
					item.thumb = await this.getItemThumbnail(item);
					item.pUrl = item.url.match(/.*(?=\.)/).toString();
					item.pName = await this.getParentName(item.pUrl);
				}));
				if (this.playerService.videoWidgetLocation === 0) {
					this.playerService.videoWidgetLocation$.next(1);
				}
			}
		} catch (error) {
			console.log(error);
		}
	}



	searchKeyPress(e) {
		if (e.key === 'Enter' && this.searchQuery) {
			this.searchMore(this.searchQuery);
			this.searchOnFocus = false;
		}
	}

	setFocus(focus) {
		setTimeout(() => { this.searchOnFocus = focus }, 150);
	}



	selectItem(item) {
		console.log('item clicked', item);
		const itemUrl = item.url.replace(/.*\./, '');
		this.router.navigate(['/tabs', this.home, 'playlist', item.pUrl], { queryParams: { item: itemUrl } });
	}

	public searchMore(param) {
		console.log(this.home, param);

		if (!this.home.includes('favorite') && !this.home.includes('document')) {
			this.router.navigate(['/tabs', this.home, 'search'], { queryParams: { param: param } });
		}
		this.playerService.videoWidgetLocation$.next(2);
	}

	backNav() {
		this.location.back();
	}

	forwardNav() {
		this.location.forward();
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
}

