import { Component, HostListener, OnInit, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { DataFetchService } from '@fy/xplat/core';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';

// import { ElectronService } from 'ngx-electron'
@Component({
  selector: 'fy-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  public videoRandomList;
  public audioRandomList;
  public videoConstantList;
  public audioConstantList;
  private _dataInit = false;

  // img = `assets/imgs/${this.backgroundImgs[0].toString()}.jpg`;
  // @Output() public onSlideTouch: EventEmitter<boolean> = new EventEmitter();
  constructor(
    private router: Router,
    // private activatedRoute: ActivatedRoute,
    public dataFetchService: DataFetchService,
    private playerService: PlayerService // private _electronService: ElectronService,
  ) {
    // this.router.events.subscribe(async (event) => {
    //   if (
    //     event instanceof NavigationEnd &&
    //     event.url.includes('/tabs/video/')
    //   ) {
    //     this.activeHref = event.url
    //       .split('/')
    //       .pop()
    //       .match(/(?!.*[^?item=]=)(?!\=).*/)
    //       .toString();
    //   }
    // });
  }

  async init() {
    const videoList = await this.dataFetchService.fetchRoot('video');
    const audioList = await this.dataFetchService.fetchRoot('audio');

    const videoRandomIndex = Math.floor(Math.random() * videoList.length);
    const audioRandomIndex = Math.floor(Math.random() * audioList.length);
    this.videoRandomList = await this.getChildren(
      videoList[videoRandomIndex].url
    );

    console.log('hello', this.videoRandomList);

    // .then((list) => {
    //   return list.map((item) => ({
    //     key: item.id,
    //     value: item.name.replace(/[0-9]+\-/g, ''),
    //     href: item.url,
    //   }));
    // });
  }

  async getChildren(url: string) {
    const itemInfo = await this.dataFetchService.fetchTopicList(url);

    if (itemInfo.children && itemInfo.children[0].isLeaf === null) {
      return itemInfo;
    } else {
      const randomIndex = Math.floor(Math.random() * itemInfo.children.length);
      return await this.getChildren(itemInfo[randomIndex].url);
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
  // public slideTouch(status: boolean) {
  //   this.onSlideTouch.emit(status);
  // }
  /**
   * Fallback to fy Core initialization method if cache existing
   * @returns
   */
  async fallback() {
    // if (this.videoList) {
    //   if (!this.dataFetchService.isInitialized) {
    //     await this.dataFetchService.init();
    //   }
    //   return;
    // }
  }

  // itemClick() {
  //   // this.playerService.setHomeControlsHidden(true);
  //   if (this.playerService.videoWidgetLocation === 0) {
  //     this.playerService.videoWidgetLocation$.next(1);
  //   }
  //   this.playerService.videoPause();
  // }
}
