import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ItemCategory } from '@fy/api-interfaces';
import { DataFetchService, Item } from '@fy/xplat/core';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'fy-audio-search',
  templateUrl: './audio-search.page.html',
  styleUrls: ['./audio-search.page.scss'],
})
export class AudioSearchPage implements OnInit {
  public topicList: any[] = [];
  public topicCategory: ItemCategory | null = null;
  index;
  searchKeyWord: string;
  searchResult: any = {};
  itemList: Item[] | null = null;
  itemLength: number = 30;

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
          filter: 'isVideo = false',
          limit: 50,
        });
        console.log('audio search result', this.searchResult);

        if (
          this.searchResult &&
          typeof this.searchResult.hits[0] != 'undefined'
        ) {
          this.itemList = this.searchResult.hits.map((item) => ({
            ...item,
            key: item.id,
            value: item.name.replace(/[\-\_]+/g, ' '),
          }));
          // this.playerService.audioSearchList$.next(this.itemList);
        }
      } catch (error) {
        console.log(error);
      }
    });
  }

  public selectItem(item: Item) {
    this.playerService.setAudioPlaylist(this.itemList);
    this.playerService.playAudio(item);
    this.playerService.isVideoPlaying$.next(false);
    this.playerService.playerWidgetLocation$.next(0);
  }
}
