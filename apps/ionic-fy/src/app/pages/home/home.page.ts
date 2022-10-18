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
    this.videoConstantList = await this.dataFetchService
      .fetchTopicList(this.dataFetchService.videoConstantUrl)
      .then(async (topic) => {
        topic.children = await Promise.all(
          topic.children.map(async (item) => {
            const thumb = await this.getItemThumbnail(item);
            return {
              ...item,
              thumb: thumb,
            };
          })
        );
        return topic;
      });
    this.audioConstantList = await this.dataFetchService.fetchTopicList(
      this.dataFetchService.audioConstantUrl
    );

    const videoList = await this.dataFetchService.fetchRoot('video');
    const audioList = await this.dataFetchService.fetchRoot('audio');

    const videoRandomIndex = Math.floor(Math.random() * videoList.length);
    const audioRandomIndex = Math.floor(Math.random() * audioList.length);
    this.videoRandomList = await this.getChildren(
      videoList[videoRandomIndex].url
    );
    this.audioRandomList = await this.getChildren(
      audioList[audioRandomIndex].url
    );

    console.log('videoRandomList:::::', this.audioConstantList);
    // .then((list) => {
    //   return list.map((item) => ({
    //     key: item.id,
    //     value: item.name.replace(/[0-9]+\-/g, ''),
    //     href: item.url,
    //   }));
    // });
  }

  async getChildren(url: string) {
    return new Promise(async (resolve, reject) => {
      const recurse = async (url: string) => {
        const itemInfo = await this.dataFetchService.fetchTopicList(url);

        if (
          itemInfo.children &&
          itemInfo.children.length > 0 &&
          itemInfo.children[0].isLeaf === null
        ) {
          itemInfo.children = await Promise.all(
            itemInfo.children.map(async (item) => {
              const thumb = item.isVideo
                ? await this.getItemThumbnail(item)
                : '';
              return {
                ...item,
                thumb: thumb,
              };
            })
          );

          resolve(itemInfo);
        }
        if (
          itemInfo.children &&
          itemInfo.children.length > 0 &&
          itemInfo.children[0].isLeaf !== null
        ) {
          const randomIndex = Math.floor(
            Math.random() * itemInfo.children.length
          );
          await recurse(itemInfo.children[randomIndex].url);
        }
        if (!itemInfo.children) {
          reject();
        }
      };

      recurse(url);
    });
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

  private getNonLeaf(item: any) {
    return new Promise(async (resolve) => {
      const recurse = async (item) => {
        if (item.isLeaf === null) {
          resolve(item);
        }
        if (item.isLeaf === true || item.isLeaf === false) {
          await this.dataFetchService.fetchTopicList(item.url).then((list) => {
            if (list.children[0]) recurse(list.children[0]);
          });
        }
      };
      recurse(item);
    });
  }

  private async getItemThumbnail(item: any) {
    if (item.isLeaf === null) {
      return await this.dataFetchService.getThumbnailUrl(item);
    }
    const firstItem = await this.getNonLeaf(item);
    return await this.dataFetchService.getThumbnailUrl(firstItem);
    // 'https://stream.vgm.tv/VGMV/01_BaiGiang/CacDienGia/MSNHB_DeHiepMotTrongPhucVu/preview/01.jpg';
  }
}
