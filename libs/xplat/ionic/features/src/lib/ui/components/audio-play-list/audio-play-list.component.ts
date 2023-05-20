import {
	Component,
	Input,
	Output,
	EventEmitter,
	OnInit,
	OnDestroy,
} from '@angular/core';
import {
	PlayerService,
	BaseComponent,
	DataFetchService,
	Item,
	LocalforageService,
	OfflineService,
	QueueService,
} from '@fy/xplat/core';
import { Observable, Subscription } from 'rxjs';
import M3U8FileParser from 'm3u8-file-parser';
import * as path from 'path';
import { Platform } from '@ionic/angular';
import { ToastController, ModalController } from '@ionic/angular';
// import { Plugins } from '@capacitor/core';
// const { Share } = Plugins
import { Share } from '@capacitor/share';
import { SocialShareModalComponent } from '../social-share-modal/social-share-modal.component';
// import { Downloader, DownloadRequest, NotificationVisibility } from '@ionic-native/downloader/ngx';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { File as nativeFile } from '@awesome-cordova-plugins/file/ngx';

@Component({
	selector: 'fy-audio-play-list',
	templateUrl: 'audio-play-list.component.html',
	styleUrls: ['audio-play-list.component.scss'],
})
export class AudioPlayListComponent
	extends BaseComponent
	implements OnInit, OnDestroy {
	@Input() public item;
	@Input() public parentThumb: string = '';
	@Input() public playingItem: Item = null;
	@Input() public parent = 'audio';
	@Output() public onSelectItem: EventEmitter<Item> = new EventEmitter<Item>();
	// @Output() public onItemPressed: EventEmitter<Item> = new EventEmitter<Item>();
	isViewInit = false;
	public favoriteList: Item[] = [];
	// private playSub: Subscription;
	// private favoriteSub: Subscription;
	public currentPlayingState: any;
	public downloadingList = [];
	public downloadedList = [];
	// itemUrl$: Observable<string>;
	// itemUrl: string;

	constructor(
		public playerService: PlayerService,
		private dataFetchService: DataFetchService,
		private localForageService: LocalforageService,
		public platform: Platform,
		// private downloader: Downloader,
		private offlineService: OfflineService,
		public toastController: ToastController,
		public modalController: ModalController,
		private translateService: TranslateService,
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private titleService: Title,
		private file: nativeFile,
		private meta: Meta,
		private queueService: QueueService
	) {
		super();
	}

	async ngOnInit() {
		if (!this.dataFetchService.isInitialized) {
			await this.dataFetchService.init();
		}
		// this.playSub = this.playerService.audioPlayState$.subscribe((state) => {
		//   this.currentPlayingState = state;
		// });
		// this.favoriteSub = this.playerService.favoriteAudioPlaylist$.subscribe(
		//   (state) => {
		//     this.favoriteList = state;
		//   }
		// );
		await this.checkDownloaded();

		// this.itemUrl$ = this.activatedRoute.queryParamMap.pipe(
		//   map((params: ParamMap) => params.get('item'))
		// );

		// this.itemUrl$.subscribe(async (param) => {
		//   if (param) {
		//     console.log(
		//       this.activatedRoute.snapshot.params.topicUrl,
		//       this.router.url
		//     );

		//     const url = `${this.activatedRoute.snapshot.params.topicUrl}.${param}`;
		//     // const index = this.list.findIndex((list) => list.url === url);
		//     this.itemPressed(this.item);
		//   }
		// });
		if (!this.item.thumb) {
			const randomThumbUrl = `${this.dataFetchService.defaultImgs}/${Math.ceil(
				Math.random() * 50
			)}.webp`;
			const thumbCheck = await fetch(randomThumbUrl);
			this.item.thumb =
				thumbCheck.status === 200
					? randomThumbUrl
					: '/assets/imgs/default-image.svg';
		}
	}

	// ngOnDestroy(): void {
	//   (this.playSub && (this.favoriteSub as Subscription)).unsubscribe();
	// }

	// loadMoreData(event) {
	//   setTimeout(() => {
	//     event.target.complete();
	//     if (this.itemLength < this.list.length) {
	//       this.itemLength += 20;
	//     } else {
	//       this.itemLength = this.list.length;
	//       event.target.disabled = true;
	//     }
	//   }, 500);
	// }

	selectItem(item: Item) {
		this.onSelectItem.emit(item)
	}

	formatName(name: string) {
		return name.replace(/^([0-9]+)(_|-)?/g, '');
	}

	// itemPressed(item) {
	//   this.onItemPressed.next(item);
	// }

	isFavorite(id) {
		return this.playerService.favoriteVideoPlaylist.findIndex(
			(list) => list.id === id
		);
	}

	updateMetaTag(title, url) {
		this.titleService.setTitle(`${title} - FUYIN TV`);
		this.meta.updateTag({ property: 'og:url', content: url });
		this.meta.updateTag({
			property: 'og:title',
			content: `${title} - FUYIN TV`,
		});
		this.meta.updateTag({
			property: 'og:description',
			content: `${title} - description`,
		});
		this.meta.updateTag({
			property: 'og:image',
			content: `https://vgm.tv/assets/imgs/logo-vgm.svg`,
		});
	}

	async checkDownloaded() {
		this.downloadedList = await this.offlineService.db.manifest
			.where('type')
			.equals('audio')
			.primaryKeys();
	}

	async onShare(item) {
		const pUrl = item.url.match(/.*(?=\.)/).toString();
		const itemUrl = item.url.replace(/.*\./, '');
		const shareUrl = `https://vgm.tv/tabs/audio/playlist/${pUrl}?item=${itemUrl}`;
		this.updateMetaTag(item.name, shareUrl);
		console.log('share click', item);
		if (this.platform.is('capacitor')) {
			try {
				await Share.share({
					title: this.translateService.instant('msg.share'),
					text: `${item.name}`,
					url: shareUrl,
					dialogTitle: this.translateService.instant('msg.share'),
				});
			} catch (error) {
				console.log(error);
			}
		}
		//  if (this.platform.is('electron'))
		else {
			this.presentModal(shareUrl);
		}
	}

	async toogleFabBtn(e, fab, index) {
		if (e.type === 'ionBlur') {
			setTimeout(() => {
				fab.close();
			}, 100);

			document.getElementById(`fabBtn${index}`).style.opacity = '100%';
		} else {
			if (fab.el.firstChild.className.includes('fab-button-close-active')) {
				document.getElementById(`fabBtn${index}`).style.opacity = '100%';
			} else {
				document.getElementById(`fabBtn${index}`).style.opacity = '0%';
			}
		}
	}

	async onDownloadSingleSelector(item) {
		const getKey = await this.offlineService.db.manifest.get({ id: item.id });
		if (!getKey) {
			const selectedQuality = await this.offlineService.downloadMediaAlertConfirm(item);
			console.log("on selectedQuality::", selectedQuality.role);
			if (selectedQuality.role !== 'backdrop' && selectedQuality.role !== 'cancel') {
				await this.offlineService.onAudioDownload(item);
			}
		} else {
			console.log("onRemoveDownloadedItem::", item);
			const confirmRemove = await this.offlineService.removeMediaAlertConfirm(item)
			console.log("confirm remove downloaded::", confirmRemove);
			if (confirmRemove.role === 'ok') {
				await this.offlineService.removeOfflineDB(getKey.metadata);
				this.offlineService.refreshOfflineList();
				if (this.offlineService.offlineAudioPlaylistID.indexOf(item.id) < 0) {
					console.log("remove audio item::");
					this.presentToast(this.translateService.instant('msg.audio.delete'))
				};
				if (this.dataFetchService.isTauri) {
					fetch(`${this.dataFetchService.apiBase}/repo/gc?quiet=true&silent=true`, { method: "POST" });
				}
			}
		}
	}

	// async nativeDownloader() {
	//  const request: DownloadRequest = {
	//       uri: source,
	//       // title: 'MyDownload',
	//       // description: '',
	//       // mimeType: '',
	//       visibleInDownloadsUi: false,
	//       // notificationVisibility: NotificationVisibility.VisibleNotifyCompleted,
	//       destinationInExternalFilesDir: {
	//         dirType: 'Downloads',
	//         subPath: `MyDownloadedFile.mp4`
	//       }
	//     };

	//     this.downloader.download(request)
	//       .then((location: string) => {
	//         this.presentToast('Đã tải về 1 video');
	//         console.log('File downloaded at:' + location)
	//       }).catch((error: any) => console.error(error));
	// }

	async presentModal(url) {
		const modal = await this.modalController.create({
			component: SocialShareModalComponent,
			cssClass: 'share-modal',
			animated: false,
			componentProps: {
				sharedMessage: url,
			},
		});
		return await modal.present();
	}

	addToFavorite(item: Item) {
		const itemIndex = this.favoriteList.findIndex(
			(list) => list.id === item.id
		);
		if (itemIndex >= 0) {
			this.favoriteList.splice(itemIndex, 1);
			this.presentToast(this.translateService.instant('msg.audio.remove'));
		} else {
			this.favoriteList.push(item);
			this.presentToast(this.translateService.instant('msg.audio.add'));
		}
		const favoriteKey = 'favorite.audio';
		this.playerService.setFavoritePlayList(1, this.favoriteList);
		this.localForageService.set(favoriteKey, this.favoriteList);
	}

	async presentToast(message) {
		const toast = await this.toastController.create({
			message: message,
			position: 'top',
			duration: 2000,
			cssClass: 'toast-info',
		});
		toast.present();
	}
}
