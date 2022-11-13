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
  selector: 'fy-video-card-slider',
  templateUrl: 'video-card-slider.component.html',
  styleUrls: ['./video-card-slider.component.scss'],
})
export class VideoCardSliderComponent
  extends BaseComponent
  implements OnInit, OnChanges {
  @Input() topic: any = {};

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
    // console.log('videoRandomList:::::', this.topic);
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
  public formatName(name: string) {
    return name.replace(/^[\d\s-]+/g, '');
  }

  public selectItem(item: Item) {
    if (item.isLeaf === null) {
      this.playerService.setVideoPlaylist(this.topic.children);
      this.playerService.playVideo(item, 0);
      this.playerService.videoWidgetLocation$.next(0);
    }
    if (item.isLeaf !== null) {
      this.router.navigate([
        '/tabs',
        'video',
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

  async preloadData(item: Item) {
    if (
      item.isLeaf === null &&
      this.dataFetchService.prefetchList.findIndex((elem) => elem === item.id) <
      0
    ) {
      const playUrl = await this.dataFetchService.getPlayUrl(item, true);
      const dirUrl = path.dirname(playUrl);
      this.dataFetchService.prefetchList.push(item.id);
      (async () => {
        await this.queueService.queue.add(async () => {
          const fetchItems = [
            'key.vgmk',
            'playlist.m3u8',
            '360p/content0.vgmx',
          ];
          fetchItems.forEach((item) => {
            const url = `${dirUrl}/${item}`;
            fetch(url);
          });
        });
      })();
    }
  }
}
