import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { DataFetchService, QueueService } from '@fy/xplat/core';
// import { ItemBase, TopicCategory } from '@vgm/api-interfaces';
import { Platform, IonSlides } from '@ionic/angular';
import { TopMenuItem } from '@fy/xplat/ionic/features';

// import { SuperTabs } from '@ionic-super-tabs/angular';
// import { SuperTabChangeEventDetail } from '@ionic-super-tabs/core';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Component({
  selector: 'vgm-video-catalog',
  templateUrl: './video-catalog.page.html',
  styleUrls: ['./video-catalog.page.scss'],
})
export class VideoCatalogPage implements OnInit {
  // @ViewChild('superTabs', { read: SuperTabs }) st: SuperTabs;
  @ViewChild('videoSlides', { static: true }) slides: IonSlides;
  // public tabIndex:number = 0;
  public tabSwipeable: boolean = true;
  // public menuList: TopMenuItem[] = [];
  public tabs: Array<{ label: string }>;
  public tabData: any;
  private _dataInit = false;
  topicUrl$: Observable<string>;
  topicUrl: string;

  // public topicCategory: TopicCategory | null = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private dataFetchService: DataFetchService,
    public platform: Platform,
    private router: Router,
    private queueService: QueueService
  ) {
    this.topicUrl$ = this.activatedRoute.queryParamMap.pipe(
      map((params: ParamMap) => params.get('topicUrl'))
    );
    this.topicUrl$.subscribe(async (param) => {
      if (param) {

        if (!this._dataInit) await this.initData();
        this.topicUrl = param;
        console.log('videoCatalogRouteStart::', param);
        this.selectTab(this.topicUrl);
      }
      // else {
      //   this.router.navigate(['/muc-luc', 'video', 'catalog'], { queryParams: { topicUrl: '01-bai-giang' } });
      // }
    });
  }

  async ngOnInit() {
    try {
      if (this.platform.is('desktop')) {
        this.slides.lockSwipes(true);
      }
      if (!this.dataFetchService.isInitialized) {
        await this.dataFetchService.init();
      }
      await this.initData()
      const index = this.tabData.findIndex(
        (item) => item.url === this.topicUrl
      );
      await this.getTabData(index);
    } catch (error) {
      console.log('gettab error', error);
    }
  }

  async initData() {
    return new Promise(async (resolve) => {
      // const tabs = [];
      // const tabData = [];
      const videoList = await this.dataFetchService.fetchRoot('video');

      this.tabData = await videoList.map((item) => ({
        ...item,
        value: item.name.replace(/[0-9]+\-/g, ''),
        href: item.url,
      }));
      this._dataInit = true;
      console.log('tabData:::', this.tabData);
      resolve(this.tabData);
    });
  }

  async getTabData(index) {
    this.tabData[index] = await this.dataFetchService.fetchTopicList(this.tabData[index].url)
    console.log('fetching tabData:::', this.tabData[index]);

    this.tabData[index].children = await Promise.all(
      this.tabData[index].children.map(async (item) => {
        const thumb = await this.getItemThumbnail(item);
        return {
          ...item,
          value: item.name,
          thumb: thumb,
          href: item.url,
        };
      })
    );

  }

  async selectTab(topicUrl: string) {
    const tabIndex: any = this.tabData.findIndex(
      (list) => list.url === topicUrl
    );
    console.log('select tab:', tabIndex, topicUrl);
    if (this.platform.is('desktop')) {
      this.slides.lockSwipes(false);
    }
    await this.slides.getSwiper().then((swiper) => {
      swiper.slideTo(tabIndex);
    });
    if (this.platform.is('desktop')) {
      this.slides.lockSwipes(true);
    }
    // if (tab) {
    //   setTimeout(function () {
    //     let element: HTMLElement = document.getElementById(tab.id) as HTMLElement;
    //     element.click()
    //   }, 10);
    // }
  }

  videoRefresh(event) {
    console.log('Begin async operation');
    setTimeout(() => {
      console.log('Async operation has ended');
      event.target.complete();
    }, 2000);
  }

  // slideTouch(swipeable) {
  //   this.tabSwipeable = !swipeable;
  // }

  async onSlideChange() {
    this.slides.getActiveIndex().then(async (index: number) => {
      const topic: any = this.tabData[index];
      this.dataFetchService.videoTabActiveIndex = topic ? topic.id : '';
      console.log('slideChanging::', this.tabData[index], this.dataFetchService.videoTabActiveIndex);
      // console.log('slideChanging::', this.tabData[index], this.dataFetchService.videoTabActiveIndex);
      // const index = this.tabData.findIndex(item => item.id === topic.id);
      try {
        if (typeof this.tabData[index].children === 'undefined') {
          await this.getTabData(index);
        }
      } catch (error) {
        console.log('gettab error', error);
      }
    });
  }

  // async onTabChange(event: CustomEvent<SuperTabChangeEventDetail>) {

  //   const topic: any = this.menuList[event.detail.index];
  //   this.dataFetchService.videoTabActiveIndex = topic.id;
  //   const index = this.tabData.findIndex(item => item.id === topic.id);
  //   try {
  //     await this.getTabData(index);
  //   } catch (error) {
  //     console.log('gettab error', error);
  //   }

  //   // console.log('Tab change fired', event);
  //   // console.log(event.target);
  //   // console.log('id', id.id);

  //   // this.activeTabIndex = event.detail.index;
  // }

  // selectTab(index: number) {
  //   this.st.selectTab(index, false, false);
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
