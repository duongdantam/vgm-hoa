import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { DataFetchService } from '@fy/xplat/core';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';

// import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'fy-video',
  templateUrl: './video.page.html',
  styleUrls: ['./video.page.scss'],
})
export class VideoPage implements OnInit {
  public videoList: any[] = [];
  public activeHref = '';
  private _dataInit = false;
  constructor(
    private router: Router,
    // private activatedRoute: ActivatedRoute,
    public dataFetchService: DataFetchService,
    private playerService: PlayerService
  ) // private _electronService: ElectronService,
  {
    this.router.events.subscribe(async (event) => {
      if (
        event instanceof NavigationEnd &&
        event.url.includes('/tabs/video/')
      ) {
        this.activeHref = event.url
          .split('/')
          .pop()
          .match(/(?!.*[^?item=]=)(?!\=).*/)
          .toString();
      }
    });
  }

  // public playPingPong() {
  //   if (this._electronService.isElectronApp) {
  //     let pong: string = this._electronService.ipcRenderer.sendSync(
  //       'ELECTRON_BRIDGE_HOST',
  //       'ping'
  //     );
  //     console.log(pong);
  //   }
  // }

  async init() {
    // this.playPingPong();
    this.videoList = await this.dataFetchService
      .fetchRoot('video')
      .then((list) => {
        return list.map((item) => ({
          key: item.id,
          value: item.name.replace(/[0-9]+\-/g, ''),
          href: item.url,
        }));
      });
    if (this.activeHref === '/tabs/video/catalog') {
      const id = `${this.videoList[0].href}-btn`;
      setTimeout(() => {
        document.getElementById(id).click();
      }, 10);
    }
  }

  async ngOnInit() {
    if (!this.dataFetchService.isInitialized) {
      await this.dataFetchService.init();
    }
    this.init()
      .then(() => {
        console.log(`App init state: ${this.dataFetchService.isInitialized}`);
        this.fallback();
      })
      .catch((err) => {
        console.warn(err);
        this.fallback();
      });
  }

  /**
   * Fallback to fy Core initialization method if cache existing
   * @returns
   */
  async fallback() {
    if (this.videoList) {
      if (!this.dataFetchService.isInitialized) {
        await this.dataFetchService.init();
      }
      return;
    }
    if (!this.dataFetchService.isInitialized) {
      this.router.navigateByUrl(`/home?redirectTo=${this.router.url}`, {
        replaceUrl: true,
      });
    }
  }

  itemClick() {
    // this.playerService.setVideoControlsHidden(true);
    if (this.playerService.playerWidgetLocation === 0) {
      this.playerService.playerWidgetLocation$.next(1);
    }
    this.playerService.videoPause();
  }
}
