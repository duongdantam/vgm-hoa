import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { DataFetchService, DetectService } from '@fy/xplat/core';
import {
  PlayerEvent,
  PlayerService,
} from 'libs/xplat/core/src/lib/services/player.service';
import { Subscription } from 'rxjs';
// import * as path from 'path';

@Component({
  selector: 'fy-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage implements OnInit, OnDestroy {
  public menuOpen: boolean = true;
  public audioPlayUrl: string = '';
  public videoPlayUrl: string = '';
  public type: string = 'application/x-mpegURL';

  public audioIsHidden = true;
  public videoIsHidden = true;

  private audioSub: any;
  private videoSub: any;

  private audioRootList = [];
  private videoRootList = [];

  public menuActivation = {
    home: false,
    video: false,
    audio: false,
    my: false,
    // favorite: false,
    // download: false,
  };

  constructor(
    public playerService: PlayerService,
    public dataFetchService: DataFetchService,
    private detectService: DetectService,
    private router: Router,
    private platform: Platform // private offlineService: OfflineService,
  ) {
    // video
    this.videoSub = this.playerService.videoPlayState$.subscribe(
      async (state) => {
        if (state.isPlaying) {
          this.videoPlayUrl = await this.dataFetchService.getPlayUrl(
            state.item,
            true
          );
          console.log('playing video URL:', this.videoPlayUrl);
        }
      }
    );

    // audio
    this.audioSub = this.playerService.audioPlayState$.subscribe(
      async (state) => {
        if (state.isPlaying) {
          this.audioPlayUrl = await this.dataFetchService.getPlayUrl(
            state.item,
            false
          );
          console.log('playing audio URL:', this.audioPlayUrl);
        }
      }
    );
  }

  async ngOnInit() {
    // await this.dataFetchService.fetchAPIVersion();
    this.videoRootList = await this.dataFetchService.fetchRoot('video');
    this.audioRootList = await this.dataFetchService
      .fetchRoot('audio')
      .then(async (list) => {
        if (list) {
          list.forEach(async (category) => {
            await this.dataFetchService.fetchTopicList(category.url);
          });
          return list;
        }
      });
    // await this.detectService.swCheck();

    // this.menuTab('video');
    //   this.itemUrl$ = this.activatedRoute.queryParamMap.pipe(
    //   map((params: ParamMap) => params.get('itemUrl')),
    // );
    // await this.itemUrl$.subscribe(param => {
    //   this.itemUrl = param;
    //   this.getPlayingData(param);
    // });
  }

  menuTab = (function () {
    return function (menu: string) {
      if (menu === 'home') {
        // this.playerService.setVideoControlsHidden(false);
        if (this.menuActivation.home === false) {
          this.menuActivation.home = true;
          this.router.navigate(['/tabs', menu]);
        }
      }
      if (menu === 'video') {
        this.playerService.setVideoControlsHidden(false);
        if (this.menuActivation.video === false) {
          this.menuActivation.video = true;
          this.router.navigate(['/tabs', menu, 'catalog'], {
            queryParams: { topicUrl: this.videoRootList[0].url },
          });
        }
      }
      if (menu === 'audio') {
        this.playerService.setAudioControlsHidden(false);
        if (this.menuActivation.audio === false) {
          this.menuActivation.audio = true;
          this.router.navigate(['/tabs', menu, 'catalog'], {
            queryParams: { topicUrl: this.audioRootList[0].url },
          });
        }
      }

      if (menu === 'my') {
        // this.playerService.setVideoControlsHidden(false);
        if (this.menuActivation.my === false) {
          this.menuActivation.my = true;
          this.router.navigate(['/tabs', menu]);
        }
      }

      // // thís code is for mobile
      // if (menu === 'favorite') {
      //   if (this.playerService.favoritePlayingType === 0) {
      //     if (this.playerService.videoWidgetLocation === 0) {
      //       this.playerService.videoWidgetLocation$.next(1);
      //       // if (this.playerService.videoIsHidden) {
      //       //   this.playerService.setVideoControlsHidden(false);
      //       // }
      //     }
      //     this.playerService.setVideoControlsHidden(false);
      //     this.playerService.setAudioControlsHidden(true);
      //     // if (this.playerService.videoIsHidden) {
      //     // } else if (this.playerService.audioIsHidden === false) {
      //     // }
      //   } else if (this.playerService.favoritePlayingType === 1) {
      //     this.playerService.setVideoControlsHidden(true);
      //     this.playerService.setAudioControlsHidden(false);
      //     // if (this.playerService.videoIsHidden === false) {
      //     // } else if (this.playerService.audioIsHidden) {
      //     // }
      //   }
      //   if (this.menuActivation.favorite === false) {
      //     this.menuActivation.favorite = true;
      //     this.router.navigate(['/tabs', menu, 'playlist'], {
      //       queryParams: { id: 'video' },
      //     });
      //   }
      // }
      // if (menu === 'download') {
      //   if (this.playerService.downloadPlayingType === 0) {
      //     if (this.playerService.videoWidgetLocation === 0) {
      //       this.playerService.videoWidgetLocation$.next(1);
      //       // if (this.playerService.videoIsHidden) {
      //       //   this.playerService.setVideoControlsHidden(false);
      //       // }
      //     }

      //     this.playerService.setVideoControlsHidden(false);
      //     this.playerService.setAudioControlsHidden(true);
      //     // if (this.playerService.videoIsHidden) {
      //     // } else if (this.playerService.audioIsHidden === false) {
      //     // }
      //   } else if (this.playerService.downloadPlayingType === 1) {
      //     this.playerService.setVideoControlsHidden(true);
      //     this.playerService.setAudioControlsHidden(false);
      //     // if (this.playerService.videoIsHidden === false) {
      //     // } else if (this.playerService.audioIsHidden) {
      //     // }
      //   }
      //   if (this.menuActivation.download === false) {
      //     this.menuActivation.download = true;
      //     this.router.navigate(['/tabs', menu, 'playlist'], {
      //       queryParams: { id: 'video' },
      //     });
      //   }
      // }
    };
  })();

  onTabsWillChange({ tab }: any) {
    console.log(tab);
    if (this.playerService.videoWidgetLocation === 0) {
      this.playerService.videoWidgetLocation$.next(1);
    }
  }

  handleAudioPlayerEvent(event: PlayerEvent) {
    this.playerService.emitAudioEvent(event.eventName, event.data);
  }
  handleVideoPlayerEvent(event: PlayerEvent) {
    this.playerService.emitVideoEvent(event.eventName, event.data);
  }

  ngOnDestroy(): void {
    (this.audioSub, this.videoSub as Subscription).unsubscribe();
  }
}
