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
  // private _dataInit = false;

  constructor(
    // private router: Router,
    // private activatedRoute: ActivatedRoute,
    public dataFetchService: DataFetchService,
    // private playerService: PlayerService // private _electronService: ElectronService,
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
    // Get constant video and audio list
    const videoConstantList = this.dataFetchService
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
    const audioConstantList = this.dataFetchService.fetchTopicList(
      this.dataFetchService.audioConstantUrl
    );
    const videoList = this.dataFetchService.fetchRoot('video');
    const audioList = this.dataFetchService.fetchRoot('audio');
    const [vConstantList, aConstantList, vList, aList] = await Promise.all([videoConstantList, audioConstantList, videoList, audioList]);

    this.videoConstantList = vConstantList;
    this.audioConstantList = aConstantList;
    console.log('constantList:::::', this.videoConstantList, this.audioConstantList);
    // Get random video and audio list
    const videoRandomIndex = Math.floor(Math.random() * vList.length);
    const audioRandomIndex = Math.floor(Math.random() * aList.length);

    const videoRandom = this.getChildren(
      vList[videoRandomIndex].url
    );
    const audioRandom = this.getChildren(
      aList[audioRandomIndex].url
    );
    const [vRandom, aRandom] = await Promise.all([videoRandom, audioRandom]);
    this.videoRandomList = vRandom;
    this.audioRandomList = aRandom;
    console.log('randomList:::::', this.videoRandomList, this.audioRandomList);

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
