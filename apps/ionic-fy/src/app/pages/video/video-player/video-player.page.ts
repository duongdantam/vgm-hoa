import { Component, ElementRef, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { DataFetchService, Item, LocalforageService } from '@fy/xplat/core';
import Hls from 'hls.js';
import { PlayerService } from 'libs/xplat/core/src/lib/services/player.service';


import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
@Component({
	selector: 'fy-video-player',
	templateUrl: './video-player.page.html',
	styleUrls: ['./video-player.page.scss'],
})
export class VideoPlayerPage {
	// @ViewChild('video') videoEle: ElementRef<HTMLVideoElement>;
	fixedPlayer: boolean = false;
	videoSub: any;
	favoriteSub: any;
	public videoFavoriteList: Item[] = [];
	public playingItem: Item;

	// public playingState;
	public isPlaying: boolean = false;
	public itemList: any[] = [];
	public itemLength: number = 40;
	public playUrl: string | null = null;
	public thumbUrl: string | null = null;
	public type: string = 'application/x-mpegURL';
	itemUrl$: Observable<string>;
	itemUrl: string;

	constructor(
		// private activatedRoute: ActivatedRoute,
		// private dataFetchService: DataFetchService,
		// private router: Router,
		// private playerService: PlayerService,
		// private localForageService: LocalforageService
	) { }

	// ngOnChanges(changes: SimpleChanges): void {
	//   if ('isPlaying' in changes) {
	//     console.log('isplaying Changed', this.isPlaying, (changes as any).isPlaying);
	//   }
	// }

	// async ngOnInit() {
	//   this.itemUrl$ = this.activatedRoute.queryParamMap.pipe(
	//     map((params: ParamMap) => params.get('itemUrl')),
	//   );
	//   await this.itemUrl$.subscribe(param => {
	//     this.itemUrl = param;
	//     this.getPlayingData(param);
	//   });

	//   this.videoSub = await this.playerService.videoPlayState$.subscribe((state) => {
	//     this.isPlaying = state.isPlaying;
	//     console.log('isthis playing', this.isPlaying);




	//     // if (state.isPlaying) {
	//     //   this.playUrl = this.dataFetchService.getPlayUrl(state.item, false);
	//     //   console.log('audio playing url', this.playUrl);
	//     // }
	//   });

	//   const favoriteList = await this.dataFetchService.fetchFavorite('video');
	//   this.playerService.setFavoritePlayList(0, favoriteList);

	//   this.favoriteSub = await this.playerService.favoriteVideoPlaylist$.subscribe((state) => {
	//     this.videoFavoriteList = state;
	//   });
	// }

	// async getPlayingData(itemUrl) {
	//   // document.querySelector(".video").style.display = "absolute";
	//   this.playingItem = await this.dataFetchService.fetchSingleItem(itemUrl);
	//   this.playUrl = this.dataFetchService.getPlayUrl(this.playingItem);
	//   this.thumbUrl = this.getItemThumbnail(this.playingItem);
	//   this.playerService.playVideo(this.playingItem, 0);
	//   // Object.assign(this.playingItem, { playUrl: this.dataFetchService.getPlayUrl(playingItem) })
	//   // this.playUrl = this.playingItem.playUrl;
	//   // console.log('playing video', this.playingItem);


	//   const allItemUrl = itemUrl.match(/.*(?=\.)/).toString();
	//   const itemList = await this.dataFetchService.fetchItemList(allItemUrl);

	//   this.itemList = itemList.children.map((item) => ({
	//     ...item,
	//     key: item.id,
	//     value: item.name.replace(/[0-9]+\-/g, ''),
	//     href: item.url,
	//     duration: item.duration,
	//     thumb: this.getItemThumbnail(item)
	//   }));


	// }

	// addToFavorite(item: Item) {
	//   const itemIndex = this.videoFavoriteList.findIndex(list => list.id === item.id);
	//   if (itemIndex >= 0) {
	//     this.videoFavoriteList.splice(itemIndex, 1);
	//   } else {
	//     item['thumb'] = this.getItemThumbnail(item);
	//     this.videoFavoriteList.push(item);
	//   }
	//   const favoriteKey = 'favorite.video';
	//   this.playerService.setFavoritePlayList(0, this.videoFavoriteList);
	//   this.localForageService.set(favoriteKey, this.videoFavoriteList);
	// }

	// isFavorite(id) {
	//   return this.videoFavoriteList.findIndex(list => list.id === id)
	// }

	// loadMoreData(event) {
	//   setTimeout(() => {
	//     event.target.complete();
	//     if (this.itemLength < this.itemList.length) {
	//       this.itemLength += 20;
	//     } else {
	//       this.itemLength = this.itemList.length;
	//       event.target.disabled = true;
	//     }
	//   }, 500);
	// }

	// onScroll(e) {
	//   if (e.detail.currentY > 75) {
	//     this.fixedPlayer = true;
	//   } else {
	//     this.fixedPlayer = false
	//   }
	// }
	// public routerNavigation(url) {
	//   this.router.navigate(['/tabs', 'video', 'player'], { queryParams: { itemUrl: url } });
	// }

	// private getItemThumbnail(item: any) {
	//   return this.dataFetchService.getThumbnailUrl(item); // 'https://stream.fy.tv/fyV/01_BaiGiang/CacDienGia/MSNHB_DeHiepMotTrongPhucVu/preview/01.jpg';
	// }

	// ngOnDestroy(): void {
	//   (this.videoSub, this.favoriteSub as Subscription).unsubscribe();
	// }
}
