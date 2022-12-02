import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { DataFetchService, Item } from '@fy/xplat/core';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'vgm-video-search',
  templateUrl: './video-search.page.html',
  styleUrls: ['./video-search.page.scss'],
})
export class VideoSearchPage implements OnInit {
  client;
  index;
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
  ) {
    this.index = this.dataFetchService.searchClient.index(
      this.dataFetchService.searchDatabase
    );
  }

  async ngOnInit() {
    this.topicUrl$ = this.activatedRoute.queryParamMap.pipe(
      map((params: ParamMap) => params.get('param'))
    );
    await this.topicUrl$.subscribe(async (param) => {
      try {
        this.searchKeyWord = param;
        this.searchResult = await this.index.search(param, {
          filter: 'isVideo = true',
          limit: 50,
        });
        console.log('video search result', this.searchResult);
        if (
          this.searchResult &&
          typeof this.searchResult.hits[0] != 'undefined'
        ) {
          this.itemList = await Promise.all(
            this.searchResult.hits.map(async (item) => ({
              ...item,
              key: item.id,
              value: item.name.replace(/[\-\_]+/g, ' '),
              thumb: await this.getItemThumbnail(item),
            }))
          );
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
    this.playerService.playerWidgetLocation$.next(0);
    this.playerService.isVideoPlaying$.next(true);
  }

  private async getItemThumbnail(item: any) {
    return await this.dataFetchService.getThumbnailUrl(item);
  }
}
