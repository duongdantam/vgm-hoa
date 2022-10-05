import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { DataFetchService, QueueService } from '@fy/xplat/core';
// import { ItemBase, TopicCategory } from '@fy/api-interfaces';
import { Platform, IonSlides } from '@ionic/angular';
import { TopMenuItem } from '@fy/xplat/ionic/features';

// import { SuperTabs } from '@ionic-super-tabs/angular';
// import { SuperTabChangeEventDetail } from '@ionic-super-tabs/core';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Component({
  selector: 'fy-video-catalog',
  templateUrl: './video-catalog.page.html',
  styleUrls: ['./video-catalog.page.scss'],
})
export class VideoCatalogPage implements OnInit {
  // @ViewChild('superTabs', { read: SuperTabs }) st: SuperTabs;
  @ViewChild('videoSlides', { static: true }) slides: IonSlides;
  // public tabIndex:number = 0;
  public tabSwipeable: boolean = true;
  public menuList: TopMenuItem[] = [];
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
        this.selectTab(this.topicUrl);
      }
      // else {
      //   this.router.navigate(['/muc-luc', 'video', 'catalog'], { queryParams: { topicUrl: '01-bai-giang' } });
      // }
    });
  }

  async ngOnInit() {
    if (this.platform.is('desktop')) {
      this.slides.lockSwipes(true);
    }
    if (!this.dataFetchService.isInitialized) {
      await this.dataFetchService.init();
    }
    await this.initData().then(async () => {
      const index = this.tabData.findIndex(
        (item) => item.url === this.topicUrl
      );
      try {
        await this.getTabData(index);
      } catch (error) {
        console.log('gettab error', error);
      }
    });
  }

  async initData() {
    return new Promise(async (resolve) => {
      const tabs = [];
      const tabData = [];
      const videoList = await this.dataFetchService.fetchRoot('video');
      this.menuList = await videoList.map((item) => ({
        ...item,
        value: item.name.replace(/[0-9]+\-/g, ''),
        href: item.url,
      }));
      for (let i = 0; i < this.menuList.length; i++) {
        tabs.push(this.menuList[i]);
        this.tabs = tabs;
        const topicUrl = this.menuList[i].href;
        if (topicUrl) {
          const topicData = await this.dataFetchService.fetchTopicList(
            topicUrl
          );
          tabData.push(topicData);
        } else {
          console.warn(`could not fetch data as topicUrl is undefined`);
        }
        this.tabData = tabData;
        if (i === this.menuList.length - 1) {
          this._dataInit = true;
          resolve(null);
        }
      }
    });
  }

  async getTabData(index) {
    this.tabData[index].children.forEach(async (topic) => {
      if (typeof topic.children == 'undefined') {
        topic.children = await this.dataFetchService
          .fetchTopicList(topic.url)
          .then((list) => list.children);
        for (let i = 0; i < 11; i++) {
          if (typeof topic.children[i] != 'undefined') {
            (async () => {
              await this.queueService.queue.add(async () => {
                topic.children[i].value = topic.children[i].name.replace(
                  /[\-\_]+/g,
                  ' '
                );
                topic.children[i].href = topic.children[i].url;
                topic.children[i].thumb = await this.getItemThumbnail(
                  topic.children[i]
                );
              });
            })();
          }
        }
      }
    });
  }

  async selectTab(topicUrl: string) {
    const tabIndex: any = this.menuList.findIndex(
      (list) => list.href === topicUrl
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
      const topic: any = this.menuList[index];
      this.dataFetchService.videoTabActiveIndex = topic ? topic.id : '';
      // const index = this.tabData.findIndex(item => item.id === topic.id);
      try {
        if (!this.tabData[index].children[0].children) {
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
  }
}
