import {
	Component,
	Input,
	OnChanges,
	OnInit,
	Output,
	SimpleChanges,
	EventEmitter,
} from '@angular/core';
import { Router } from '@angular/router';
import { ItemBase } from '@fy/api-interfaces';

import {
	BaseComponent,
	DataFetchService,
	Item,
	QueueService,
} from '@fy/xplat/core';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';
import * as path from 'path';
@Component({
	selector: 'fy-audio-card-slider',
	templateUrl: 'audio-card-slider.component.html',
	styleUrls: ['./audio-card-slider.component.scss'],
})
export class AudioCardSliderComponent
	extends BaseComponent
	implements OnInit, OnChanges {
	@Input() topic: any = {};
	public formatName(name: string) {
		name = name.replace(/^[\d\s-]+/g, '');
		if (name.match(/^[年|月|日]$/)) {
			return "天天親近主"
		} else {
			return name
		}
	}

	// @Output() public onSlideTouch: EventEmitter<boolean> = new EventEmitter();
	// @Input() topicList: any[] = [];
	// @Input() topic;

	constructor(
		private router: Router,
		private dataFetchService: DataFetchService,
		private playerService: PlayerService,
		private queueService: QueueService
	) {
		super();
	}

	ngOnChanges(changes: SimpleChanges): void {
		// console.log('itemList', this.itemList);
	}

	ngOnInit(): void {
		// console.log('audioRandomList:::::', this.topic);
		// this.topicList = await this.dataFetchService.fetchTopicList(this.topic.url).then((topic) => {
		//   return topic.children.map((item) => ({
		//     ...item,
		//     value: item.name.replace(/[\-\_]+/g, ' '),
		//     thumb: this.getItemThumbnail(item),
		//     href: item.url
		//   }));
		// });
	}

	// public routerNavigation(url) {
	//   this.router.navigate([
	//     '/tabs',
	//     'video',
	//     this.isLeaf ? 'playlist' : 'topic',
	//     url,
	//   ]);
	// }

	public selectItem(item: Item) {
		// console.log('kjjkhhkhkljlk', this.topic, item);

		if (item.isLeaf === null) {
			this.router.navigate(['/tabs', 'audio', 'playlist', this.topic.url], {
				queryParams: {
					item: item.url.split('.')[item.url.split('.').length - 1],
				},
			});
		}
		if (item.isLeaf !== null) {
			this.router.navigate([
				'/tabs',
				'audio',
				item.isLeaf ? 'playlist' : 'topic',
				item.url,
			]);
		}
	}

	// public slideTouch(status: boolean) {
	//   this.onSlideTouch.emit(status);
	// }

	// private async getItemThumbnail(item: any) {
	//   return await this.dataFetchService.getThumbnailUrl(item); // 'https://stream.vgm.tv/VGMV/01_BaiGiang/CacDienGia/MSNHB_DeHiepMotTrongPhucVu/preview/01.jpg';
	// }

	// async preloadData(item: Item) {
	//   if (
	//     item.isLeaf === null &&
	//     this.dataFetchService.prefetchList.findIndex((elem) => elem === item.id) <
	//       0
	//   ) {
	//     const playUrl = await this.dataFetchService.getPlayUrl(item, true);
	//     const dirUrl = path.dirname(playUrl);
	//     this.dataFetchService.prefetchList.push(item.id);
	//     (async () => {
	//       await this.queueService.queue.add(async () => {
	//         const fetchItems = [
	//           'key.vgmk',
	//           'playlist.m3u8',
	//           '360p/content0.vgmx',
	//         ];
	//         fetchItems.forEach((item) => {
	//           const url = `${dirUrl}/${item}`;
	//           fetch(url);
	//         });
	//       });
	//     })();
	//   }
	// }
}
