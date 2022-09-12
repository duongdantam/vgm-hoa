import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { DataFetchService, Item } from '@fy/xplat/core';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';
import { MeiliSearch } from 'meilisearch';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const client = new MeiliSearch({
  host: 'https://search.hjm.bid',
  apiKey: 'KYV2oMHSE5G2p9ZXwUGH3CfWpaXB1CF5',
})
const index = client.index('VGMV')


@Component({
  selector: 'fy-video-search',
  templateUrl: './video-search.page.html',
  styleUrls: ['./video-search.page.scss'],
})

export class VideoSearchPage implements OnInit {
  searchResult: any;
  itemList: Item[] | null = null;
  itemLength: number = 30;
  searchKeyWord = '';
  topicUrl$: Observable<string>;
  constructor(
    private activatedRoute: ActivatedRoute,
    private dataFetchService: DataFetchService,
    private playerService: PlayerService,
    private router: Router
  ) { }

  async ngOnInit() {
    this.topicUrl$ = this.activatedRoute.queryParamMap.pipe(
      map((params: ParamMap) => params.get('param')),
    );
    await this.topicUrl$.subscribe(async param => {
      try {
        this.searchKeyWord = param;
        this.searchResult = await index.search(param, { limit: 50 });
        console.log('video search result', this.searchResult);
        if (this.searchResult && typeof this.searchResult.hits[0] != 'undefined') {
          this.itemList = this.searchResult.hits.map((item) => ({
            ...item,
            key: item.id,
            value: item.name.replace(/[\-\_]+/g, ' '),
            thumb: this.getItemThumbnail(item)
          }));
          // this.playerService.videoSearchList$.next(this.itemList);
        }
      } catch (error) {
        console.log(error);
      }

    });
  }

  public loadMoreData(event) {
    setTimeout(() => {
      console.log('Done');
      event.target.complete();
      if (this.itemLength < this.itemList.length) {
        this.itemLength += 20;
      } else {
        this.itemLength = this.itemList.length;
        event.target.disabled = true;
      }
    }, 500);
  }

  public selectItem(item) {
    this.playerService.setVideoPlaylist(this.itemList);
    this.playerService.playVideo(item, 2);
    this.playerService.videoWidgetLocation$.next(0);
  }

  private getItemThumbnail(item: any) {
    return this.dataFetchService.getThumbnailUrl(item);
    // 'https://stream.vgm.tv/VGMV/01_BaiGiang/CacDienGia/MSNHB_DeHiepMotTrongPhucVu/preview/01.jpg';
  }


}

