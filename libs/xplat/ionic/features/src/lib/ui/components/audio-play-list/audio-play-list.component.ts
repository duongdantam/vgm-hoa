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
  // @Output() public onItemPressed: EventEmitter<Item> = new EventEmitter<Item>();
  isViewInit = false;
  public favoriteList: Item[] = [];
  private playSub: Subscription;
  private favoriteSub: Subscription;
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
      const randomThumbUrl = `${this.dataFetchService.defaultImgs}/${Math.ceil(Math.random() * 50)}.webp`;
      const thumbCheck = await fetch(randomThumbUrl)
      this.item.thumb = thumbCheck.status === 200 ? randomThumbUrl : '/assets/imgs/default-image.svg';
    }
  }

  ngOnDestroy(): void {
    (this.playSub && (this.favoriteSub as Subscription)).unsubscribe();
  }

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

  formatName(name: string) {
    return name.replace(/^([0-9]+)(_|-)?/g, '');
  }

  // itemPressed(item) {
  //   this.onItemPressed.next(item);
  // }

  isFavorite(id) {
    return this.playerService.favoriteVideoPlaylist.findIndex((list) => list.id === id);
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

  async onDownload(item) {
    try {
      let playUrl = await this.dataFetchService.getPlayUrl(item, false);
      if (playUrl.includes('/ipfs/')) {
        playUrl = playUrl.replace(
          /.*(?=\/ipfs.*)/,
          this.dataFetchService.downloadGateway
        );
      }
      const itemDir = path.dirname(playUrl);
      const getKey = await this.offlineService.db.manifest.get({ id: item.id });
      let downloadedFile = 0;
      if (!getKey) {
        this.downloadingList.push(item.id);
        const pUrl = item.url.match(/.*(?=\.)/).toString();
        const pItem = await this.dataFetchService.fetchSingleTopic(pUrl);
        item.pid = pItem.id;
        item.pname = pItem.name;
        const m3u8AB = await (await fetch(playUrl)).arrayBuffer();
        await this.downloadData(
          itemDir,
          path.basename(playUrl),
          m3u8AB,
          'master',
          item
        );
        const enc = new TextDecoder('utf-8');
        const reader = new M3U8FileParser();
        const m3u8txt = await enc.decode(m3u8AB);
        await reader.read(m3u8txt);
        const m3u8 = await reader.getResult();
        console.log('onDownload clicked', m3u8.segments);
        const keyUri = /^http.*/.test(m3u8.segments[0].key.uri)
          ? m3u8.segments[0].key.uri
          : `${itemDir}/${m3u8.segments[0].key.uri}`;
        const keyAB = await (await fetch(keyUri)).arrayBuffer();
        await this.downloadData(itemDir, 'key.vgmk', keyAB, 'key', item);

        const downloadItem = async (i) => {
          return new Promise(async (resolve) => {
            const segmentUri = `${itemDir}/${m3u8.segments[i].url}`;
            const segmentAB = await (await fetch(segmentUri)).arrayBuffer();
            if (segmentAB)
              await this.downloadData(
                itemDir,
                `${m3u8.segments[i].url}`,
                segmentAB,
                'key',
                item
              );
            resolve('done');
          });
        };

        for (let i = 0; i < m3u8.segments.length; i++) {
          // list.length or endPoint
          (async () => {
            await this.queueService.aDownloadQueue.add(async () => {
              await downloadItem(i);
              downloadedFile++;
              console.log(m3u8.segments[i].url);
            });
          })();
        }

        this.queueService.aDownloadQueue.on('idle', async () => {
          if (downloadedFile === m3u8.segments.length) {
            await this.offlineService.db.manifest.put({
              id: item.id,
              type: 'audio',
              metadata: item,
            });
            await this.checkDownloaded();
            await this.presentToast(
              this.translateService.instant('msg.audio.downloaded')
            );
            const index = this.downloadingList.indexOf(item.id);
            if (index > -1) this.downloadingList.splice(index, 1);
            await this.offlineService.refreshOfflineList();
          }
        });
      } else {
        await this.offlineService.db.data.where('id').equals(item.id).delete();
        await this.offlineService.db.manifest
          .where('id')
          .equals(item.id)
          .delete();
        await this.checkDownloaded();
        if (this.downloadedList.indexOf(item.id) < 0) {
          this.presentToast(this.translateService.instant('msg.audio.delete'));
        }
        await this.offlineService.refreshOfflineList();
      }
    } catch (error) {
      console.log(error);
    }

    // const list = await fetch(playUrl).then(async response => {
    //   const m3u8 = await response.text();
    //   const reader = new M3U8FileParser();
    //   reader.read(m3u8);
    //   return reader.getResult().segments;
    // });
    // console.log(list);

    // const xhr = new XMLHttpRequest();
    // xhr.open('GET', playUrl, true);
    // xhr.responseType = 'arraybuffer';
    // xhr.onload = (e) => {

    //   // console.log(e.currentTarget);
    //   console.log(xhr.response);

    // };
    // xhr.send();

    // // if (this.platform.is('capacitor')) {
    // const list = await fetch(url).then(async response => {
    //   const m3u8 = await response.text();
    //   const reader = new M3U8FileParser();
    //   reader.read(m3u8);
    //   return reader.getResult().segments;
    // });
    // for (const file of list) {
    //   console.log('got fetched data', file);
    //   // const request: DownloadRequest = {
    //   //   uri: source,
    //   //   // title: 'MyDownload',
    //   //   // description: '',
    //   //   // mimeType: '',
    //   //   visibleInDownloadsUi: false,
    //   //   // notificationVisibility: NotificationVisibility.VisibleNotifyCompleted,
    //   //   destinationInExternalFilesDir: {
    //   //     dirType: 'Downloads',
    //   //     subPath: `MyDownloadedFile.mp4`
    //   //   }
    //   // };

    //   // this.downloader.download(request)
    //   //   .then((location: string) => {
    //   //     this.presentToast('Đã tải về 1 video');
    //   //     console.log('File downloaded at:' + location)
    //   //   }).catch((error: any) => console.error(error));

    // }

    // }

    // this.presentToast('Đang tải về  1 audio');
  }

  async downloadData(dir, file, data, type, item) {
    if (this.platform.is('ios')) {
      await this.file.writeFile(
        this.file.dataDirectory,
        `${item.url}/${file}`,
        data,
        { replace: true }
      );
    } else {
      const uri = `${dir
        .replace(/.*(?=\/encrypted(-\w+)?\/.*)/, '')
        .replace(/.*(?=\/ipfs\/.*)/, '')}/${file}`;
      await this.offlineService.db.data.put({
        uri: uri,
        data: data,
        type: type,
        id: item.id,
      });
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
