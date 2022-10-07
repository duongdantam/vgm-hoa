import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ItemCategory } from '@fy/api-interfaces';
import { DataFetchService, Item, QueueService } from '@fy/xplat/core';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';
import { Observable } from 'rxjs';
import * as path from 'path';
import { map } from 'rxjs/operators';

@Component({
  selector: 'vgm-video-playlist',
  templateUrl: './video-playlist.page.html',
  styleUrls: ['./video-playlist.page.scss'],
})
export class VideoPlaylistPage implements OnInit {
  public topicList: any[];
  public itemCategory: ItemCategory | null = null;
  public itemLength: number = 40;
  itemUrl$: Observable<string>;
  itemUrl: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private dataFetchService: DataFetchService,
    private playerService: PlayerService,
    private router: Router,
    private queueService: QueueService
  ) {}

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
        href: this.getItemHref(item),
      }));

      const topicData = await this.dataFetchService.fetchItemList(topicUrl);

      if (topicData.children) {
        topicData.children = await Promise.all(
          topicData.children.map(async (item) => {
            return {
              ...item,
              value: item.name.replace(/[\-\_]+/g, ' '),
              thumb: await this.getItemThumbnail(item),
              // href: this.getItemHref(item),
            };
          })
        );
      }
      this.itemCategory = topicData;
      // console.log(this.itemCategory);
      this.itemUrl$ = this.activatedRoute.queryParamMap.pipe(
        map((params: ParamMap) => params.get('item'))
      );

      this.itemUrl$.subscribe(async (param) => {
        if (param) {
          const url = `${this.activatedRoute.snapshot.params.topicUrl}.${param}`;
          const index = this.itemCategory.children.findIndex(
            (list) => list.url === url
          );
          if (index >= 0) this.selectItem(this.itemCategory.children[index]);
        }
      });
    } else {
      console.warn(`could not fetch data as topicUrl is undefined`);
    }
  }

  public routerNavigation(url) {
    this.router.navigateByUrl(url);
  }

  public loadMoreData(event) {
    setTimeout(() => {
      event.target.complete();
      if (this.itemLength < this.itemCategory.children.length) {
        this.itemLength += 20;
      } else {
        this.itemLength = this.itemCategory.children.length;
        event.target.disabled = true;
      }
    }, 500);
  }

  public selectItem(item) {
    this.playerService.setVideoPlaylist(this.itemCategory.children);
    this.playerService.playVideo(item, 0);
    this.playerService.videoWidgetLocation$.next(0);
    console.log(item);
  }

  private async getItemThumbnail(item: any) {
    return await this.dataFetchService.getThumbnailUrl(item); // 'https://stream.vgm.tv/VGMV/01_BaiGiang/CacDienGia/MSNHB_DeHiepMotTrongPhucVu/preview/01.jpg';
  }

  private getItemHref(item: any) {
    if (item.isLeaf) {
      return `/muc-luc/video/playlist/${item.url}`;
    } else {
      return `/muc-luc/video/topic/${item.url}`;
    }
  }

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
            '360p.m3u8',
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
