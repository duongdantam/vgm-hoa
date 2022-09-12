import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
// import { SuperTabs } from '@ionic-super-tabs/angular';
// import { SuperTabChangeEventDetail } from '@ionic-super-tabs/core';
import { Platform, IonSlides } from '@ionic/angular';
import { DataFetchService, QueueService } from '@fy/xplat/core';
import { TopMenuItem } from '@fy/xplat/ionic/features';
import { AvatarService } from 'libs/xplat/core/src/lib/services/avatar.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
	selector: 'fy-audio-catalog',
	templateUrl: './audio-catalog.page.html',
	styleUrls: ['./audio-catalog.page.scss'],
})

export class AudioCatalogPage implements OnInit {
	// @ViewChild('superTabs', { read: SuperTabs }) st: SuperTabs;
	@ViewChild('audioSlides', { static: true }) slides: IonSlides;
	public menuList: TopMenuItem[] = [];
	public tabs: Array<{ label: string }>;
	public tabData: any;
	// public activeTabIndex: number = 0;
	topicUrl$: Observable<string>;
	topicUrl: string;
	private _dataInit = false;
	constructor(
		private activatedRoute: ActivatedRoute,
		private dataFetchService: DataFetchService,
		private avatarService: AvatarService,
		private queueService: QueueService,
		public platform: Platform
	) {
		this.topicUrl$ = this.activatedRoute.queryParamMap.pipe(
			map((params: ParamMap) => params.get('topicUrl')),
		);

		this.topicUrl$.subscribe(async (param) => {
			if (param) {
				if (!this._dataInit) await this.initData();
				this.topicUrl = param;
				this.selectTab(this.topicUrl);
				// this.onSlideChange();
			}
			// else {
			//   this.router.navigate(['/tabs', 'audio', 'catalog'], { queryParams: { topicUrl: '01-bai-giang' } });
			// }
		});


	}

	async ngOnInit() {
		if (this.platform.is("desktop")) {
			this.slides.lockSwipes(true);
		}
		if (!this.dataFetchService.isInitialized) {
			await this.dataFetchService.init();
		}
		// await this.initData();
		// this.selectTab(this.topicUrl);

		await this.initData().then(async () => {
			const index = this.tabData.findIndex(item => item.url === this.topicUrl);
			try {
				await this.getTabData(index);
			} catch (error) {
				console.log('gettab error', error);
			}
		});
	}

	// async initData() {
	//   const tabs = [];
	//   const tabData = [];
	//   const audioList = await this.dataFetchService.fetchRoot('audio');
	//   this.menuList = await audioList.map((item) => ({
	//     ...item,
	//     value: item.name.replace(/[0-9]+\-/g, ''),
	//     href: item.url,
	//   }));

	//   for (let i = 0; i < this.menuList.length; i++) {
	//     tabs.push(this.menuList[i]);
	//     this.tabs = tabs;
	//     const topicUrl = this.menuList[i].href;
	//     if (topicUrl) {
	//       const topicData = await this.dataFetchService.fetchTopicList(topicUrl);
	//       if (topicData.children) {
	//         topicData.children = await topicData.children.map((item) => {
	//           return {
	//             ...item,
	//             href: this.getItemHref(item),
	//             avatar: this.avatarService.getAvatarByUrl(item.url),
	//           };
	//         });
	//       }
	//       tabData.push(topicData);
	//     } else {
	//       console.warn(`could not fetch data as topicUrl is undefined`);
	//     }
	//     this.tabData = tabData;
	//   }
	// }

	async initData() {
		return new Promise(async (resolve) => {
			const tabs = [];
			const tabData = [];
			const audioList = await this.dataFetchService.fetchRoot('audio');
			this.menuList = await audioList.map((item) => ({
				...item,
				value: item.name.replace(/[0-9]+\-/g, ''),
				href: item.url,
			}));
			console.log(this.menuList)
			for (let i = 0; i < this.menuList.length; i++) {
				tabs.push(this.menuList[i]);
				this.tabs = tabs;
				tabData.push(this.menuList[i]);
				this.tabData = tabData;
				if (i === this.menuList.length - 1) {
					this._dataInit = true;
					resolve(null);
				}
			}

		});
	}

	async getTabData(index) {
		console.log('gettabdata:', index);

		const topicUrl = this.tabData[index].url;
		if (topicUrl) {
			this.tabData[index] = await this.dataFetchService.fetchTopicList(topicUrl);
			if (this.tabData[index].children) {
				this.tabData[index].children = await this.tabData[index].children.map((item) => {
					return {
						...item,
						href: this.getItemHref(item),
						avatar: this.avatarService.getAvatarByUrl(item.url),
					};
				});
			}
		} else {
			console.warn(`could not fetch data as topicUrl is undefined`);
		}
	}

	async selectTab(topicUrl: string) {
		const tabIndex: any = this.menuList.findIndex(list => list.href === topicUrl);
		console.log('select tab:', tabIndex, topicUrl);
		if (this.platform.is("desktop")) {
			this.slides.lockSwipes(false);
		}
		await this.slides.getSwiper().then(swiper => {
			swiper.slideTo(tabIndex)
		})
		if (this.platform.is("desktop")) {
			this.slides.lockSwipes(true);
		}

		// if (tab) {
		//   setTimeout(function () {
		//     let element: HTMLElement = document.getElementById(tab.id) as HTMLElement;
		//     element.click()
		//   }, 10);
		// }
	}

	// async onTabChange(event: CustomEvent<SuperTabChangeEventDetail>) {
	//   const topic: any = this.menuList[event.detail.index];
	//   this.dataFetchService.audioTabActiveIndex = topic.id;
	// }

	async onSlideChange() {
		if (!this._dataInit) await this.initData();
		this.slides.getActiveIndex().then(async (index: number) => {
			const topic: any = this.menuList[index];
			this.dataFetchService.audioTabActiveIndex = topic.id;
			// const index = this.tabData.findIndex(item => item.id === topic.id);
			try {
				if (!this.tabData[index].children) {
					await this.getTabData(index);
				}

			} catch (error) {
				console.log('gettab error', error);
			}
		});
	}


	// async onTabChange(event: CustomEvent<SuperTabChangeEventDetail>) {
	//   const topic: any = this.menuList[event.detail.index];
	//   this.dataFetchService.audioTabActiveIndex = topic.id;
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
	//   this.st.selectTab(index, true);
	// }

	private getItemHref(item: any) {
		return [
			'/tabs',
			'audio',
			item.isLeaf ? 'playlist' : 'topic',
			item.url,
		];
	}

	audioRefresh(event) {
		// console.log('Begin async operation');

		setTimeout(() => {
			// console.log('Async operation has ended');
			event.target.complete();
		}, 2000);
	}


}
