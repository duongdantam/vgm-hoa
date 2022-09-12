import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemCategory } from '@fy/api-interfaces';
import { DataFetchService, Item } from '@fy/xplat/core';

import { AvatarService } from 'libs/xplat/core/src/lib/services/avatar.service';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';

@Component({
	selector: 'fy-audio-playlist',
	templateUrl: './audio-playlist.page.html',
	styleUrls: ['./audio-playlist.page.scss'],
})
export class AudioPlaylistPage implements OnInit {
	public topicList: any[] = [];
	public topicCategory: ItemCategory | null = null;

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
	}

	private getItemHref(item: any) {
		return [
			'/tabs',
			'audio',
			item.isLeaf ? 'playlist' : 'catalog',
			item.url,
		];
	}
}
