import { Component, Input } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  BaseComponent,
  DataFetchService,
  Item,
  QueueService,
} from '@fy/xplat/core';
import { Location } from '@angular/common';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';
import * as path from 'path';

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
  isSearch: boolean;
  isVideo: boolean = true;
  constructor(
    private router: Router,
    private location: Location,
    private playerService: PlayerService,
    public dataFetchService: DataFetchService,
    private queueService: QueueService,
  ) {
    super();
  }

  searchTypeChange() {
    this.isVideo = !this.isVideo;
  }

  async searchChange(e?) {
    const index = this.dataFetchService.searchClient.index('VGM');
    this.searchQuery = e.detail.value;
    try {
      this.searchResult = this.isVideo === true ? await index.search(e.detail.value, {
        filter: 'isVideo = true',
        limit: 20,
      }) : await index.search(e.detail.value, {
        filter: 'isVideo = false',
        limit: 20,
      });


      console.log(this.searchResult);

      if (
        this.searchResult &&
        typeof this.searchResult.hits[0] != 'undefined'
      ) {
        await Promise.all(
          this.searchResult.hits.map(async (item) => {
            item.value = item.name.replace(/[\-\_]+/g, ' ');
            item.thumb = this.isVideo
              ? await this.getItemThumbnail(item)
              : null;
            item.pUrl = item.url.match(/.*(?=\.)/).toString();
            item.pName = await this.getParentName(item.pUrl);
          })
        );
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
    setTimeout(() => {
      this.searchOnFocus = focus;
    }, 150);
  }

  selectItem(item) {
    console.log('item clicked', item);
    const itemUrl = item.url.replace(/.*\./, '');
    this.router.navigate(['/tabs', this.isVideo === true ? 'video' : 'audio', 'playlist', item.pUrl], {
      queryParams: { item: itemUrl },
    });
  }

  public searchMore(param) {
    // console.log(this.home, param);

    // if (!this.home.includes('favorite') && !this.home.includes('document')) {
    this.router.navigate(['/tabs', this.isVideo === true ? 'video' : 'audio', 'search'], {
      queryParams: { param: param },
    });
    // }
    this.playerService.videoWidgetLocation$.next(2);
  }

  backNav() {
    this.location.back();
  }

  forwardNav() {
    this.location.forward();
  }

  private async getParentName(pUrl) {
    return await this.dataFetchService
      .fetchSingleTopic(pUrl)
      .then((item) => item.name.replace(/[\-\_]+/g, ' '));
  }

  private async getItemThumbnail(item: any) {
    return await this.dataFetchService.getThumbnailUrl(item); // 'https://stream.vgm.tv/VGMV/01_BaiGiang/CacDienGia/MSNHB_DeHiepMotTrongPhucVu/preview/01.jpg';
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
