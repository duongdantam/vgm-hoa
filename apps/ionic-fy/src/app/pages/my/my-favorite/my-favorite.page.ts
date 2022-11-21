import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { SuperTabs } from '@ionic-super-tabs/angular';
import { SuperTabChangeEventDetail } from '@ionic-super-tabs/core';
import { Platform } from '@ionic/angular';
import { DataFetchService, Item } from '@fy/xplat/core';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';

import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'fy-favorite-playlist',
  templateUrl: './my-favorite.page.html',
  styleUrls: ['./my-favorite.page.scss'],
})
export class MyFavoritePage implements OnInit {
  @ViewChild('superTabs', { read: SuperTabs }) st: SuperTabs;
  favoriteUrl$: Observable<string>;

  public favoriteVideoList: Item[] | null = null;
  public favoriteAudioList: Item[] | null = null;
  private favoriteVideoSub: any;
  private favoriteAudioSub: any;
  public videoItemLength: number = 40;
  public audioItemLength: number = 40;

  constructor(
    private activatedRoute: ActivatedRoute,
    private dataFetchService: DataFetchService,
    private playerService: PlayerService,
    public platform: Platform
  ) {
    this.favoriteVideoSub = this.playerService.favoriteVideoPlaylist$.subscribe(
      (data) => {
        this.favoriteVideoList = data;
      }
    );

    this.favoriteAudioSub = this.playerService.favoriteAudioPlaylist$.subscribe(
      (data) => {
        this.favoriteAudioList = data;
      }
    );
  }

  async ngOnInit() {
    const favoriteVideoList = this.dataFetchService.fetchFavorite('video');
    const favoriteAudioList = this.dataFetchService.fetchFavorite('audio');
    const [vfList, afList] = await Promise.all([
      favoriteVideoList,
      favoriteAudioList,
    ]);
    this.playerService.setFavoritePlayList(0, vfList);
    this.playerService.setFavoritePlayList(1, afList);

    this.favoriteUrl$ = this.activatedRoute.queryParamMap.pipe(
      map((params: ParamMap) => params.get('id'))
    );

    this.favoriteUrl$.subscribe((param) => {
      if (param === 'favorite-video') {
        this.selectTab(0);
      } else if (param === 'favorite-audio') {
        this.selectTab(1);
      }
    });
  }

  selectTab(tabIndex: number) {
    setTimeout(function () {
      let element: HTMLElement = document.getElementById(
        'favorite-tab' + tabIndex
      ) as HTMLElement;
      element.click();
    }, 10);
  }

  onTabChange(ev: CustomEvent<SuperTabChangeEventDetail>) {
    const index = ev.detail.index;
    this.playerService.favoritePlayingType$.next(index);
  }

  public selectVideoItem(item: Item) {
    this.playerService.setVideoPlaylist(this.favoriteVideoList);
    this.playerService.playVideo(item, 1);
    this.playerService.isVideoPlaying$.next(true);
    this.playerService.playerWidgetLocation$.next(0);
  }

  public selectAudioItem(item: Item) {
    this.playerService.setAudioPlaylist(this.favoriteAudioList);
    this.playerService.playAudio(item, 1);
    this.playerService.isVideoPlaying$.next(false);
    this.playerService.playerWidgetLocation$.next(0);
  }

  videoRefresh(event) {
    console.log('Begin async video data operation');

    setTimeout(() => {
      console.log('Async operation has ended');
      event.target.complete();
    }, 2000);
  }

  loadMoreVideoData(event) {
    setTimeout(() => {
      event.target.complete();
      if (this.videoItemLength < this.favoriteVideoList.length) {
        this.videoItemLength += 20;
      } else {
        this.videoItemLength = this.favoriteVideoList.length;
        // event.target.disabled = true;
      }
    }, 500);
  }

  audioRefresh(event) {
    console.log('Begin async audio data operation');

    setTimeout(() => {
      console.log('Async operation has ended');
      event.target.complete();
    }, 2000);
  }

  loadMoreAudioData(event) {
    setTimeout(() => {
      console.log('Done');
      event.target.complete();
      if (this.audioItemLength < this.favoriteAudioList.length) {
        this.audioItemLength += 20;
      } else {
        this.audioItemLength = this.favoriteAudioList.length;
      }
    }, 500);
  }

  ngOnDestroy(): void {
    (this.favoriteVideoSub,
    this.favoriteAudioSub as Subscription).unsubscribe();
  }
}
