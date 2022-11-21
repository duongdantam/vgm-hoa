import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ItemCategory } from '@fy/api-interfaces';
import { DataFetchService, Item } from '@fy/xplat/core';

import { AvatarService } from 'libs/xplat/core/src/lib/services/avatar.service';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Component({
	selector: 'fy-audio-playlist',
	templateUrl: './audio-playlist.page.html',
	styleUrls: ['./audio-playlist.page.scss'],
})
export class AudioPlaylistPage implements OnInit {
	public topicList: any[] = [];
	public topicCategory: ItemCategory | null = null;
	public itemLength = 40;
	itemUrl$: Observable<string>;
	itemUrl: string;
	constructor(
		private activatedRoute: ActivatedRoute,
		private dataFetchService: DataFetchService,
		private avatarService: AvatarService,
		private playerService: PlayerService,
		private router: Router
	) { }

	async ngOnInit() {
		if (!this.dataFetchService.isInitialized) {
			await this.dataFetchService.init();
		}

		const { topicUrl } = this.activatedRoute.snapshot.params;
		const allTopicUrl = topicUrl.match(/.*(?=\.)/).toString();

		if (topicUrl) {
			const topicList = await this.dataFetchService.fetchTopicList(allTopicUrl);
			this.topicList = topicList.children.map((item) => ({
				...item,
				key: item.id,
				value: item.name.replace(/[\-\_]+/g, ' '),
				href: item.url,
			}));

			const topicData = await this.dataFetchService.fetchItemList(topicUrl);
			if (topicData.children) {
				topicData.children = topicData.children.map((item) => {
					return {
						...item,
						href: this.getItemHref(item),
						avatar: this.avatarService.getAvatarByUrl(item.url),
					};
				});
			}
			this.topicCategory = topicData;

			(this.topicCategory as any).avatar = this.avatarService.getAvatarByUrl(
				topicUrl
			);


			this.itemUrl$ = this.activatedRoute.queryParamMap.pipe(
				map((params: ParamMap) => params.get('item'))
			);

			this.itemUrl$.subscribe(async (param) => {
				if (param) {
					console.log(
						this.activatedRoute.snapshot.params.topicUrl,
						this.router.url
					);

					const url = `${this.activatedRoute.snapshot.params.topicUrl}.${param}`;
					const index = this.topicCategory.children.findIndex((list) => list.url === url);
					this.selectItem(this.topicCategory.children[index]);
				}
			});
		} else {
			console.warn(`could not fetch data as topicUrl is undefined`);
		}
	}

	public routerNavigation(url) {
		this.router.navigate(['/tabs', 'audio', 'playlist', url]);
	}

	public selectItem(item) {
		this.playerService.setAudioPlaylist(this.topicCategory.children);
		this.playerService.playAudio(item, 0);
		this.playerService.isVideoPlaying$.next(false);
		this.playerService.playerWidgetLocation$.next(0);
	}

	private getItemHref(item: any) {
		return [
			'/tabs',
			'audio',
			item.isLeaf ? 'playlist' : 'catalog',
			item.url,
		];
	}
	loadMoreData(event) {
		setTimeout(() => {
			event.target.complete();
			if (this.itemLength < this.topicCategory.children.length) {
				this.itemLength += 20;
			} else {
				this.itemLength = this.topicCategory.children.length;
				event.target.disabled = true;
			}
		}, 500);
	}
}
