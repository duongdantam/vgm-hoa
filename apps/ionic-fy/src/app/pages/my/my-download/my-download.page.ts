import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { SuperTabs } from '@ionic-super-tabs/angular';
import { SuperTabChangeEventDetail } from '@ionic-super-tabs/core';
import { Platform } from '@ionic/angular';
import { DataFetchService, Item, OfflineService } from '@fy/xplat/core';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';
import _ from 'lodash';

import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'fy-my-download',
  templateUrl: './my-download.page.html',
  styleUrls: ['./my-download.page.scss'],
})
export class MyDownloadPage implements OnInit {
  @ViewChild('superTabs', { read: SuperTabs }) st: SuperTabs;
  documentUrl$: Observable<string>;

  public offlineVideoList: any | null = null;
  public offlineAudioList: any | null = null;
  private offlineVideoSub: any;
  private offlineAudioSub: any;
  public videoItemLength: number = 40;
  public audioItemLength: number = 40;

  constructor(
    private activatedRoute: ActivatedRoute,
    private dataFetchService: DataFetchService,
    private playerService: PlayerService,
    private offlineService: OfflineService,
    public platform: Platform
  ) {
    this.offlineVideoSub = this.offlineService.offlineVideoPlaylist$.subscribe(
      (data) => {
        const list = _.mapValues(_.groupBy(data, 'pname'), (clist) =>
          clist.map((list) => _.omit(list, 'pname'))
        );
        if (!_.isEmpty(list)) this.offlineVideoList = list;
        else this.offlineVideoList = null;
      }
    );

    this.offlineAudioSub = this.offlineService.offlineAudioPlaylist$.subscribe(
      (data) => {
        const list = _.mapValues(_.groupBy(data, 'pname'), (clist) =>
          clist.map((list) => _.omit(list, 'pname'))
        );
        if (!_.isEmpty(list)) this.offlineAudioList = list;
        else this.offlineAudioList = null;
      }
    );
  }

  async ngOnInit() {
    this.documentUrl$ = this.activatedRoute.queryParamMap.pipe(
      map((params: ParamMap) => params.get('id'))
    );
    this.documentUrl$.subscribe((param) => {
      if (param === 'downloaded-video') {
        this.selectTab(0);
      } else if (param === 'downloaded-audio') {
        this.selectTab(1);
      }
    });
  }

  selectTab(tabIndex: number) {
    setTimeout(function () {
      let element: HTMLElement = document.getElementById(
        'document-tab' + tabIndex
      ) as HTMLElement;
      element.click();
    }, 10);
  }

  onTabChange(ev: CustomEvent<SuperTabChangeEventDetail>) {
    console.log('superTabChange:', ev.detail.index);

    // const index = ev.detail.index;
    // // set player widget hidden
    // this.playerService.documentPlayingType$.next(index);
    // if (index === 0) {
    //   this.playerService.setVideoControlsHidden(false);
    // } else if (index === 1) {
    //   this.playerService.setAudioControlsHidden(false);
    // }
  }

  public selectVideoItem(item: Item) {
    console.log('play video', item);

    this.playerService.setVideoPlaylist(
      this.offlineService.offlineVideoPlaylist
    );
    this.playerService.playVideo(item, 3);
  }

  public selectAudioItem(item: Item) {
    this.playerService.setAudioPlaylist(
      this.offlineService.offlineAudioPlaylist
    );
    this.playerService.playAudio(item, 3);
  }

  loadMoreVideoData(event) {
    setTimeout(() => {
      event.target.complete();
      if (this.videoItemLength < this.offlineVideoList.length) {
        this.videoItemLength += 20;
      } else {
        this.videoItemLength = this.offlineVideoList.length;
        // event.target.disabled = true;
      }
    }, 500);
  }

  videoRefresh(event) {
    console.log('Begin async video data operation');
    setTimeout(() => {
      console.log('Async operation has ended');
      event.target.complete();
    }, 2000);
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
      if (this.audioItemLength < this.offlineAudioList.length) {
        this.audioItemLength += 20;
      } else {
        this.audioItemLength = this.offlineAudioList.length;
      }
    }, 500);
  }

  ngOnDestroy(): void {
    (this.offlineVideoSub, this.offlineAudioSub as Subscription).unsubscribe();
  }
}
