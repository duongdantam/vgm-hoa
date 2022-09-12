import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { DataFetchService } from '@fy/xplat/core';
import { AvatarService } from 'libs/xplat/core/src/lib/services/avatar.service';

import { TopicCategory } from '@fy/api-interfaces';
@Component({
	selector: 'fy-audio-topic',
	templateUrl: './audio-topic.page.html',
	styleUrls: ['./audio-topic.page.scss'],
})

export class AudioTopicPage implements OnInit {
	public topicCategory: TopicCategory | null = null;
	constructor(
		private activatedRoute: ActivatedRoute,
		private dataFetchService: DataFetchService,
		private avatarService: AvatarService,
	) { }

	async ngOnInit() {
		const { topicUrl } = this.activatedRoute.snapshot.params;

		const topicData = await this.dataFetchService.fetchTopicList(topicUrl);
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
	}

	private getItemHref(item: any) {
		return [
			'/tabs',
			'audio',
			item.isLeaf ? 'playlist' : 'topic',
			item.url,
		];
	}

	audioRefresh(event) {
		console.log('Begin async operation');

		setTimeout(() => {
			console.log('Async operation has ended');
			event.target.complete();
		}, 2000);
	}


}
