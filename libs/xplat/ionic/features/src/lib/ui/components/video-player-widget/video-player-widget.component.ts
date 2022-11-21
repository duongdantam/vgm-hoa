import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Location } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import videojs from 'video.js';
import '@videojs/http-streaming';
import 'videojs-contrib-quality-levels';
import 'videojs-hls-quality-selector';
import {
  BaseComponent,
  DataFetchService,
  Item,
  LocalforageService,
  OfflineService,
  PlayerEvent,
  PlayerService,
  GoogleAnalyticsService,
  QueueService,
  PlayState,
} from '@fy/xplat/core';
import { Subscription } from 'rxjs';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { File as nativeFile } from '@awesome-cordova-plugins/file/ngx';
import { Platform } from '@ionic/angular';
import { ToastController, ModalController, IonContent } from '@ionic/angular';
import { SocialShareModalComponent } from '../social-share-modal/social-share-modal.component';
import { Plugins } from '@capacitor/core';
const { CapacitorMusicControls } = Plugins;
import { Share } from '@capacitor/share';
import M3U8FileParser from 'm3u8-file-parser';
import * as path from 'path';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import pDebounce from 'p-debounce';
// import * as bitwise from 'bitwise';
// import { Buffer } from 'buffer';
// import { getPlayHash } from '@fy/xplat/core';
// import { key } from 'localforage';

export interface PlayerOptions {
  fluid?: boolean;
  aspectRation?: string;
  autoplay?: boolean;
  controls?: boolean;
  sources: {
    src: string;
    type: string;
  };
}

@Component({
  selector: 'fy-video-player-widget',
  templateUrl: 'video-player-widget.component.html',
  styleUrls: ['./video-player-widget.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class VideoPlayerWidgetComponent
  extends BaseComponent
  implements OnChanges {
  @ViewChild('video', { static: true }) target: ElementRef;
  @ViewChild(IonContent) content: IonContent;
  private _options: PlayerOptions;
  player: videojs.Player;
  _initialized: boolean;
  // Video Info
  videoFavoriteList: Item[] = [];
  videoSearchList: Item[] = [];
  private videoWidget: any;
  private videoPlayer: any;
  private videoInfo: any;
  private videoList: any;
  private videoPlaylistSub: any;
  videoItemList: any[] = [];
  itemLength = 40;

  // Audio Info
  audioFavoriteList: Item[] = [];
  audioSearchList: Item[] = [];
  audioItemList: any[] = [];
  private audioPlaylistSub: any;

  isFavorite = false;
  isDownloaded = false;
  isDownloading = false;

  // Player config
  playingState: PlayState;
  playingItem: Item;
  playingThumbUrl: string;
  playingItemName: string;
  playingItemDuration: string;
  playingItemId: string;
  firstItemId: string;
  touchStartPos: number;
  movementPos: number;
  windowHeight: number;
  private _minimizeHeight = 100;
  private _offsetHeight = 98;
  downloadProgress = 0;
  shareUrl: string;
  downloadBtn = false;
  isMuted = true;
  private _safeTop: any;
  private _safeBottom: any;
  // private favoriteSub: any;
  private playerElem: any;
  private minimizedControlBar: any;
  private _seeking = false;

  @Input() isVideoPlaying = true;

  @Input() videoIsPlaying = false;
  @Input() audioIsPlaying = false;
  // @Input() isFavoriteItem: boolean = false;
  @Input() videoPlayingSource = 0;
  @Input() videoPlayingItem: Item;

  @Input() audioPlayingSource = 0;
  @Input() audioPlayingItem: Item;

  @Input() isHidden = true;
  // @Input() isVideoControl = true;
  @Input() widgetLocation = 2;
  @Input() menuOpen = true;

  @Input()
  set options(options: PlayerOptions) {
    this._options = options;
  }
  get options(): PlayerOptions {
    return this._options;
  }
  @Output()
  public onVideoPlayerEvent: EventEmitter<PlayerEvent> = new EventEmitter();
  @Output()
  public onAudioPlayerEvent: EventEmitter<PlayerEvent> = new EventEmitter();

  constructor(
    private elementRef: ElementRef,
    private dataFetchService: DataFetchService,
    private localForageService: LocalforageService,
    private platform: Platform,
    private screenOrientation: ScreenOrientation,
    // private downloader: Downloader,
    private router: Router,
    private location: Location,
    private offlineService: OfflineService,
    public playerService: PlayerService,
    public toastController: ToastController,
    public modalController: ModalController,
    private titleService: Title,
    private ga: GoogleAnalyticsService,
    private meta: Meta,
    private translateService: TranslateService,
    private file: nativeFile,
    private queueService: QueueService
  ) {
    super();
    this.videoPlaylistSub = this.playerService.videoPlaylist$.subscribe(
      (list) => {
        this.videoItemList = list;
        this.videoItemList.map(async (item) => {
          item.value = item.name.replace(/[\-\_]+/g, ' ');
          item.href = item.url;
          item.thumb = await this.getItemThumbnail(item);
        });
      }
    );
    this.audioPlaylistSub = this.playerService.audioPlaylist$.subscribe(
      (list) => {
        this.audioItemList = list;
        this.audioItemList.map(async (item) => {
          item.value = item.name.replace(/[\-\_]+/g, ' ');
          item.href = item.url;
          // item.thumb = await this.getItemThumbnail(item);
        });
      }
    );
    this.screenOrientation.onChange().subscribe(() => {
      if (
        this.platform.is('capacitor') &&
        document.fullscreenEnabled &&
        this.widgetLocation === 0
      ) {
        if (this.screenOrientation.type === 'landscape-primary') {
          this.player.requestFullscreen();
        } else if (this.screenOrientation.type === 'portrait-primary') {
          this.player.exitFullscreen();
        }
      }
    });
  }

  async ngOnChanges(changes: SimpleChanges) {
    if ('widgetLocation' in changes) {
      // console.log(this.widgetLocation, 'location');

      if (this.widgetLocation === 0) {
        this.videoPlayer.style.paddingTop = '56.25%';
      } else if (this.widgetLocation === 1) {
        this.videoPlayer.style.paddingTop = `${
          (56.25 * (this._minimizeHeight + this._offsetHeight)) /
          this.windowHeight
        }%`;
      }

      if (this.platform.is('capacitor') && this.player) {
        if ((changes as any).videoIsPlaying.currentValue !== 0) {
          this.screenOrientation.lock(
            this.screenOrientation.ORIENTATIONS.PORTRAIT
          );
        } else if (
          (changes as any).videoIsPlaying.currentValue === 0 &&
          this.screenOrientation.type === 'portrait-primary'
        ) {
          this.screenOrientation.unlock();
        }
      }
    }

    if (
      'videoIsPlaying' in changes &&
      this.player &&
      this.playerService.isVideoPlaying &&
      this._initialized
    ) {
      if ((changes as any).videoIsPlaying.currentValue === true) {
        if (this.player.paused()) {
          this.player.play();
        }
        if (this.widgetLocation === 2) {
          this.playerService.playerWidgetLocation$.next(0);
        }
        // if (this.platform.is('capacitor') && this.isVideoControl === false) {
        // 	await this.createMusicControl();
        // }
      } else {
        if (!this.player.paused()) {
          this.player.pause();
        }
      }
    }

    // if ('isMuted' in changes && this.player) {
    //   if (this._initialized) {
    //     if ((changes as any).videoIsPlaying.currentValue === true) {
    //       if (!this.player.muted()) {
    //         this.player.muted(true);
    //       }
    //     } else {
    //       if (this.player.muted()) {
    //         this.player.muted(false);
    //       }
    //     }
    //   }
    // }

    if (
      'audioIsPlaying' in changes &&
      this.player &&
      !this.playerService.isVideoPlaying &&
      this._initialized
    ) {
      if ((changes as any).audioIsPlaying.currentValue === true) {
        if (this.player.paused()) {
          this.player.play();
        }
        if (this.widgetLocation === 2) {
          this.playerService.playerWidgetLocation$.next(0);
        }
        // if (this.platform.is('capacitor') && this.isVideoControl === false) {
        // 	await this.createMusicControl();
        // }
      } else {
        if (!this.player.paused()) {
          this.player.pause();
        }
      }
    }

    if ('options' in changes && this.player) {
      this.itemLength = 40;
      if (this.platform.is('desktop')) {
        this.content.scrollToTop();
      }
      // const m3u8MasterName = path.basename(this.options.sources[0].src);
      // const qualities = ['playlist', '480p', '720p', '1080p'];
      // console.log('videoPlayingItem change', this.platform.platforms(), this.videoPlayingItem, m3u8MasterName);
      try {
        // if (this.platform.is('hybrid')) {
        //   // // decrypt key into indexedDB
        //   // handle m3u8
        //   // const decryptedKey = getPlayHash(this.videoPlayingItem.url, this.videoPlayingItem.khash);
        //   let m3u8Txt: string;
        //   qualities.forEach(async quality => {
        //     const m3u8Uri = this.options.sources[0].src.replace(m3u8MasterName, `${quality}.m3u8`);
        //     m3u8Txt = await (await fetch(m3u8Uri)).text()
        //     // .then(function (str) {
        //     //   return str
        //     //   // .replace('key.vgmk', `http://ipfs.io/ipfs/${decryptedKey}`)
        //     //   // .replace(/(480p)/g, `${path.dirname(m3u8Uri)}/480p`)
        //     // });
        //     console.log('local cached Dir:::', this.file.cacheDirectory);
        //     await this.file.writeExistingFile(`${this.file.cacheDirectory}`, `video/${quality}.m3u8`, m3u8Txt);

        //   })
        //   // const keyUri = this.options.sources[0].src.replace('playlist.m3u8', 'key.vgmk');

        //   // handle key
        //   const keyAB = await (await fetch(`${this.options.sources[0].src.replace(m3u8MasterName, 'key.vgmk')}`)).arrayBuffer();
        //   const secretCode = m3u8Txt
        //     .match(/(IV=0x).+/)
        //     .toString()
        //     .replace('IV=0x', '')
        //     .slice(0, 4);
        //   const encryptedAB = bitwise.buffer.xor(Buffer.from(keyAB), Buffer.from(`VGM-${secretCode}`), false);
        //   console.log('key::::::', encryptedAB.toString());
        //   await this.file.writeExistingFile(this.file.cacheDirectory, 'video/key.vgmk', new Blob([encryptedAB]));
        //   console.log('xor-key:', secretCode, '\n', new Uint8Array(keyAB), '\n', encryptedAB);

        //   // await this.offlineService.db.data.put({ uri: m3u8Uri, data: m3u8Buff, segNum: -1, id: this.videoPlayingItem.id });
        //   // const keyDB = await this.offlineService.db.data.get({ uri: m3u8Uri });

        //   // const m3u8LocalURL = window.URL.createObjectURL(new Blob([m3u8Buff], { type: 'application/x-mpegURL' }));
        //   // console.log('got edited m3u8::::', m3u8LocalURL);
        //   // const fetchLocal = await fetch('http://localhost:9999/video.m3u8');
        //   // console.log('fetch local:::', fetchLocal);
        //   // console.log('reading local file:::', await this.file.readAsText(`${this.file.cacheDirectory}`, 'VGMV.m3u8'));

        //   // // // decrypt key into indexedDB
        //   // if (this.platform.is('capacitor')) {
        //   //   const m3u8Uri = this.options.sources[0].src.replace('playlist.m3u8', '480p.m3u8');
        //   //   const keyUri = this.options.sources[0].src.replace('playlist.m3u8', 'key.vgmk');
        //   //   const secretCode = await (await fetch(m3u8Uri)).text().then(function (str) {
        //   //     return str
        //   //       .match(/(IV=0x).+/)
        //   //       .toString()
        //   //       .replace('IV=0x', '')
        //   //       .slice(0, 4);
        //   //   });
        //   //   const keyAB = await (await fetch(keyUri)).arrayBuffer();
        //   //   const encryptedAB = bitwise.buffer.xor(Buffer.from(keyAB), Buffer.from(`VGM-${secretCode}`), false);
        //   //   console.log('xor-key:', secretCode, '\n', new Uint8Array(keyAB), '\n', encryptedAB);
        //   //   await this.offlineService.db.data.put({ uri: keyUri, data: encryptedAB, segNum: -1, id: this.videoPlayingItem.id });
        //   //   const keyDB = await this.offlineService.db.data.get({ uri: keyUri });
        //   //   const keyLocalURL = window.URL.createObjectURL(new Blob([keyDB.data], { type: 'mimeType' }));
        //   //   console.log('got key local URL::::', keyLocalURL);

        //   //   // const key = getPlayHash(this.videoPlayingItem.url, this.videoPlayingItem.khash);
        //   //   // modified key filepath
        //   //   videojs.Vhs.xhr.beforeRequest = function (options) {
        //   //     if (/(key\.vgmk)$/.test(options.uri)) {
        //   //       console.log('option before request', options);
        //   //       options.uri = keyLocalURL;
        //   //     }
        //   //     return options;
        //   //   };
        //   // }
        // }

        // console.log(
        //   'window.innerHeight', window.innerHeight, '\n',
        //   'window.outerHeight', window.outerHeight, '\n',
        //   'screenHeight', screen.height, '\n',
        //   'screenAvaiHeight', screen.availHeight, '\n',
        //   'download.body.clientHeight', document.body.clientHeight, '\n',
        // );
        await this.getPlayingInfo();
        console.log('playingItem::', this.playingItem);
        // if (this.widgetLocation !== 0 || !this.platform.is('capacitor')) {
        //   await this.getvideoItemList();
        // }
        // console.log(this.options.sources);
        // if (this.videoPlayingSource === 3) {
        // 	const offlineInfo = await this.offlineService.db.manifest.get({ id: this.videoPlayingItem.id });
        // 	const offlineQuality = offlineInfo.quality;
        // 	this.options.sources[0].src = this.platform.is('ios') ? `http://localhost:9999/${this.videoPlayingItem.url}/${offlineQuality}.m3u8` : `${path.dirname(this.options.sources[0].src)}/${offlineQuality}.m3u8`;
        // }
        // console.log(this.options.sources);
        await this.player.poster(this.playingThumbUrl);
        // if (this.platform.is('capacitor')) {
        //   await this.player.src(`http://localhost:9999/video/${m3u8MasterName}`)
        // } else {
        await this.player.src(this.options.sources[0].src); //m3u8LocalURL  // this.options.sources[0].src // 'http://localhost:9999/480p.m3u8' // this.options.sources[0].src
        // };
        console.log('playing SRC::', this.player.src());
        await this.checkFavorite(
          this.playerService.isVideoPlaying
            ? this.videoPlayingItem.id
            : this.audioPlayingItem.id
        );
        await this.checkDownloaded();
        // this.player.muted(this.isMuted);
        // console.log('asdfasdfasdf', this.videoPlayingItem, this.isMuted);

        this.player.play();
        this.updateMetaTag();
        document.title = `${
          this.playerService.isVideoPlaying
            ? this.videoPlayingItem.name
            : this.audioPlayingItem.name
        } - FUYIN TV`;
        if (this.platform.is('capacitor')) {
          await this.createMusicControl();
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  async ngOnInit() {
    this._safeTop = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--sat'),
      10
    );
    this._safeBottom = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--sab'),
      10
    );
    this.windowHeight = window.innerHeight - this._safeTop - this._safeBottom;
    // const test = document.getElementsByClassName("widget-minimize")
    // test.classList
    //     // Get the element with id="myDIV" (a div), then get all elements inside div with class="example"
    // var x = document.getElementById("myDIV").querySelectorAll(".example");
    // // Set the background color of the first element with class="example" (index 0) in div
    // x[0].style.backgroundColor = "red";
    //     this.minimizePaddingTop = `${56.25 * this._minimizeHeight / this.windowHeight}% !important`;
    //     console.log('minimizePadding', this.minimizePaddingTop, this.widgetLocation);

    this._initialized = false;
    this.player = videojs('video-player', {
      html5: {
        vhs: {
          withCredentials: false,
          overrideNative: true,
          smoothQualityChange: true,
          cacheEncryptionKeys: true,
        },
        nativeAudioTracks: false,
        nativeTextTracks: false,
      },
      playbackRates: [0.5, 1, 1.25, 1.5, 1.75, 2],
      controlBar: {
        children: [
          {
            name: 'progressControl',
          },
          {
            name: 'playToggle',
          },
          {
            name: 'volumePanel',
            inline: false,
          },
          {
            name: 'currentTimeDisplay',
          },
          {
            name: 'timeDivider',
          },
          {
            name: 'durationDisplay',
          },
          {
            name: 'customControlSpacer',
          },
          {
            name: 'playbackRateMenuButton',
          },
          {
            name: 'pictureInPictureToggle',
          },
          {
            name: 'fullscreenToggle',
          },
          //  "playToggle",
          // "volumePanel",
          // "currentTimeDisplay",
          // "timeDivider",
          // "durationDisplay",
          // "progressControl",
          // "liveDisplay",
          // "remainingTimeDisplay",
          // "customControlSpacer",
          // "playbackRateMenuButton",
          // "chaptersButton",
          // "descriptionsButton",
          // "subsCapsButton",
          // "audioTrackButton",
          // "chromeCastButton",
          // "resolutionButton",
          // "fullscreenToggle",
          // 'qualitySelector'
        ],
      },
    });

    videojs.Vhs.GOAL_BUFFER_LENGTH = 3;
    videojs.Vhs.MAX_GOAL_BUFFER_LENGTH = 150;

    /* ADD PREVIOUS */
    var Button = videojs.getComponent('Button');

    // Extend default
    var PrevButton = videojs.extend(Button, {
      constructor: function () {
        Button.apply(this, arguments);
        /* NEW VIDEOJS ICON PREV NEXT */
        this.addClass('vjs-icon-previous-item');
        this.controlText('Previous');
      },
      handleClick: function () {
        // console.log("previous click");
        // this.handleBackNForth(-1);
        document.getElementById('previous-btn').click();
      },
    });

    // Extend default
    var NextButton = videojs.extend(Button, {
      constructor: function () {
        Button.apply(this, arguments);
        /* NEW VIDEOJS ICON PREV NEXT */
        this.addClass('vjs-icon-next-item');
        this.controlText('Next');
      },
      handleClick: function () {
        // console.log("next click");
        document.getElementById('next-btn').click();
        // this.handleBackNForth(1);
      },
    });

    // Extend default
    var ForwardButton = videojs.extend(Button, {
      constructor: function () {
        Button.apply(this, arguments);
        /* NEW VIDEOJS ICON PREV NEXT */
        this.addClass('vjs-icon-forward-10s');
        this.controlText('Forward10s');
      },
      handleClick: function () {
        document.getElementById('forward10s-btn').click();
        console.log('forward click');
      },
    });

    // Extend default
    var RewindButton = videojs.extend(Button, {
      constructor: function () {
        Button.apply(this, arguments);
        /* NEW VIDEOJS ICON PREV NEXT */
        this.addClass('vjs-icon-rewind-10s');
        this.controlText('Rewind10s');
      },
      handleClick: function () {
        document.getElementById('rewind10s-btn').click();
        console.log('rewind click');
      },
    });

    // Register the new component
    videojs.registerComponent('NextButton', NextButton);
    videojs.registerComponent('PrevButton', PrevButton);
    videojs.registerComponent('ForwardButton', ForwardButton);
    videojs.registerComponent('RewindButton', RewindButton);
    //player.getChild('controlBar').addChild('SharingButton', {});
    this.player.getChild('controlBar').addChild('PrevButton', {}, 1);
    this.player.getChild('controlBar').addChild('NextButton', {}, 3);
    this.player.getChild('controlBar').addChild('ForwardButton', {}, 4);
    this.player.getChild('controlBar').addChild('RewindButton', {}, 5);
    // await this.player.poster(this.videoThumbUrl);
    // await this.player.src(this.options.sources);
    // await this.player.play();
    // this.player.on('sourceset', () => {
    //   console.log('new source changed');
    // })
    //  this.player.getChild("controlBar").getChild("progressControl").getChild("seekBar").handleFocus();

    this.player.on('play', () => {
      this._seeking = false;
      if (this.playerService.isVideoPlaying) this.videoIsPlaying = true;
      else this.audioIsPlaying = true;
      // if (!this.playingState.isPlaying && !this._seeking) {
      if (this.playerService.isVideoPlaying) this.playerService.videoResume();
      else this.playerService.audioResume();
      // }
      // if (this.platform.is('capacitor') && this.isHidden === false) {
      //   CapacitorMusicControls.updateIsPlaying({
      //     isPlaying: true, // affects Android only
      //     elapsed: 10 // affects iOS Only
      //   });
      // }
      console.log('onplay', this.playingState.isPlaying);
      // console.log('on play');
      // const playingQuality = this.player.qualityLevels().levels_[this.player.qualityLevels().selectedIndex_];
      // if (typeof playingQuality != 'undefined') {
      //   for (let i = 0; i < 4; i++) {
      //     (async () => {
      //       await queue.add(async () => {
      //         const url = `${path.dirname(path.dirname(this.videoThumbUrl))}/${playingQuality.height}p/data${Math.round((this.player.currentTime() / 10)) + i}.vgmx`;
      //         console.log(url);
      //         fetch(url);
      //       });
      //     })();
      //   }
      // }
    });

    this.player.one('play', () => {
      this.player.hlsQualitySelector({ displayCurrentQuality: true });
    });
    this.player.on('pause', () => {
      if (this.playerService.isVideoPlaying) this.videoIsPlaying = false;
      else this.audioIsPlaying = false;
      if (this.playingState.isPlaying && !this._seeking) {
        // console.log('video isplaying', this.playerService.videoPlayState.isPlaying);
        if (this.playerService.isVideoPlaying) this.playerService.videoPause();
        else this.playerService.audioPause();
      }
      if (this.platform.is('capacitor') && this.isHidden === false) {
        CapacitorMusicControls.updateIsPlaying({
          isPlaying: false, // affects Android only
          elapsed: 0, // affects iOS Only
        });
      }
      console.log('onpause', this.playingState.isPlaying);
    });

    this.player.on('loadeddata', () => {
      console.log('onloadeddata');
      this._initialized = true;
    });

    this.player.on('canplaythrough', async () => {
      console.log('on canplaythrough');
      // this.player.controlBar.show();
      if (!this.playingState.isPlaying && !this._seeking) {
        if (this.playerService.isVideoPlaying) this.playerService.videoResume();
        else this.playerService.audioResume();
      }
      if (this.platform.is('capacitor') && this.isHidden === false) {
        CapacitorMusicControls.updateIsPlaying({
          isPlaying: true, // affects Android only
          elapsed: 10, // affects iOS Only
        });
      }
    });

    this.player.on('waiting', () => {
      console.log('onwaiting');

      // this.player.controlBar.hide();
    });

    this.player.on('ended', () => {
      console.log('playing Item Ended');
      this.handlePlayerEvent('ended', this.playingItemName);
    });

    this.player.on('loadedmetadata', () => {
      this.player.muted(false);
      console.log('onloadedmetadata');
      this._initialized = true;
      this.videoInfo.style.opacity = '1';
      this.videoList.style.opacity = '1';
      this.minimizedControlBar.style.opacity = '0';
      // if (this.videoPlayingSource !== 3) {
      //   this.player.hlsQualitySelector.setQuality(480);
      //   setTimeout(() => {
      //     this.player.hlsQualitySelector.setQuality('auto');
      //   }, 10000);
      // }
    });

    this.player.controlBar.playbackRateMenuButton.on('click', () => {
      videojs.Vhs.GOAL_BUFFER_LENGTH = 3 * this.player.playbackRate();
      videojs.Vhs.MAX_GOAL_BUFFER_LENGTH = 150 * this.player.playbackRate();
      this.ga.trackEvent(
        'video_playbackrate',
        `Set playback rate to: '${this.player.playbackRate()}x'`
      );
    });
    this.player.controlBar.progressControl.seekBar.on('touchstart', () => {
      this._seeking = true;
    });
    this.player.controlBar.progressControl.seekBar.on('touchend', () => {
      this._seeking = false;
    });
    const preFetchDebounce = pDebounce(async (url) => {
      await fetch(url as string, { method: 'HEAD' });
      console.log('prefetching:', url);
    }, 150);
    this.player.on('seeking', async () => {
      const preFetchUrl = `${path.dirname(this.options.sources[0].src)}/${
        this.player.qualityLevels().levels_[
          this.player.qualityLevels().selectedIndex_
        ].height
      }p/content${Math.floor(this.player.currentTime() / 3)}.vgmx`;
      await preFetchDebounce(preFetchUrl);
      this._seeking = true;
      console.log('seeking');
      if (this.player.controlBar.progressControl.seekBar.currentWidth() !== 0) {
        const seekPos =
          (this.player.controlBar.progressControl.seekBar.currentWidth() *
            this.player.currentTime()) /
          this.player.duration();
        this.player.controlBar.progressControl.seekBar.playProgressBar.width(
          seekPos
        );
      }
    });
    this.player.on('seeked', () => {
      console.log('seek end');
      // this.player.currentTime(Math.floor((this.player.currentTime() + 1) / 10) * 10);
      // const playingQuality = this.player.qualityLevels().levels_[this.player.qualityLevels().selectedIndex_].height;
      // for (let i = 0; i < 5; i++) {
      //   (async () => {
      //     await queue.add(async () => {
      //       const url = `${path.dirname(path.dirname(this.videoThumbUrl))}/${playingQuality}p/data${Math.round((this.player.currentTime() / 10)) - 1 + i}.vgmx`;
      //       console.log(url);

      //       fetch(url);
      //     });
      //   })();
      // }
    });

    // this.player.controlBar.fullscreenToggle.on('tap', () => {
    //   // console.log('fullscreen', document.fullscreenElement && document.fullscreenElement.nodeName);
    //   // console.log('fullscreen', this.player.isFullscreen());

    //   if (this.screenOrientation.type === ('portrait-primary' || 'portrait-secondary') && document.fullscreenElement && document.fullscreenElement.nodeName) {
    //     // if (this.platform.is('capacitor')) {
    //     //   this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE);
    //     // }
    //     this.player.requestFullscreen();
    //   } else if (this.screenOrientation.type === ('landscape-primary' || 'landscape-secondary') && document.fullscreenElement && document.fullscreenElement.nodeName) {

    //     this.player.exitFullscreen();
    //   }
    // });

    this.player.on('fullscreenchange', () => {
      console.log('fullscreenchange', this.player.isFullscreen());
      if (this.player.isFullscreen()) {
        this.playerElem.classList.add('is-fullscreen');
        this.player.controlBar.addClass('is-fullscreen');
        if (this.platform.is('capacitor')) {
          this.screenOrientation.lock(
            this.screenOrientation.ORIENTATIONS.LANDSCAPE
          );
        }
      } else {
        this.player.controlBar.removeClass('is-fullscreen');
        this.playerElem.classList.remove('is-fullscreen');
        if (this.platform.is('capacitor')) {
          this.screenOrientation.lock(
            this.screenOrientation.ORIENTATIONS.PORTRAIT
          );
          this.screenOrientation.unlock();
        }
      }
    });

    // const favoriteList = await this.dataFetchService.fetchFavorite('video');
    // this.playerService.setFavoritePlayList(0, favoriteList);

    // this.favoriteSub = await this.playerService.favoriteVideoPlaylist$.subscribe((state) => {
    //   this.videoFavoriteList = state;
    // });

    // this.searchSub = await this.playerService.videoSearchList$.subscribe((state) => {
    //   this.videoSearchList = state;
    // });
  }

  ngAfterViewInit() {
    this.videoWidget = document.getElementById('video-widget');
    this.videoPlayer = document.getElementById('video-player');
    this.videoInfo = document.getElementById('video-info');
    this.videoList = document.getElementById('video-list');
    this.playerElem = document.getElementById('video-player_html5_api');
    this.minimizedControlBar = document.getElementById('minimized-control-bar');
    this.videoPlayer.addEventListener('keydown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log(e);
      switch (e.code) {
        case 'Space':
          this.handleTogglePlayPause();
          break;
        case 'ArrowDown':
          this.handleVolumeControl(-0.1);
          break;
        case 'ArrowUp':
          this.handleVolumeControl(0.1);
          break;
        case 'ArrowLeft':
          this.handleRewindForward(-10);
          break;
        case 'ArrowRight':
          this.handleRewindForward(10);
          break;
        default:
        // e.preventDefault();
        // code block
      }
    });
  }

  createMusicControl() {
    CapacitorMusicControls.removeAllListeners();
    CapacitorMusicControls.create(
      {
        track: this.videoPlayingItem.name, // optional, default : ''
        artist: '', // optional, default : ''
        album: '', // optional, default: ''
        cover: this.videoPlayingItem.thumb, // optional, default : nothing
        // cover can be a local path (use fullpath 'file:///storage/emulated/...', or only 'my_image.jpg' if my_image.jpg is in the www folder of your app)
        //			 or a remote url ('http://...', 'https://...', 'ftp://...')

        // hide previous/next/close buttons:
        hasPrev: false, // show previous button, optional, default: true
        hasNext: false, // show next button, optional, default: true
        hasClose: true, // show close button, optional, default: false

        // iOS only, optional
        duration: this.videoPlayingItem.duration, // optional, default: 0
        elapsed: 10, // optional, default: 0
        hasSkipForward: false, //optional, default: false. true value overrides hasNext.
        hasSkipBackward: false, //optional, default: false. true value overrides hasPrev.
        skipForwardInterval: 15, //optional. default: 15.
        skipBackwardInterval: 15, //optional. default: 15.
        hasScrubbing: false, //optional. default to false. Enable scrubbing from control center progress bar

        // Android only, optional
        isPlaying: true, // optional, default : true
        dismissable: true, // optional, default : false
        // text displayed in the status bar when the notification (and the ticker) are updated
        ticker: 'Now playing',
        //All icons default to their built-in android equivalents
        //The supplied drawable name, e.g. 'media_play', is the name of a drawable found under android/res/drawable* folders
        playIcon: 'media_play',
        pauseIcon: 'media_pause',
        prevIcon: 'media_prev',
        nextIcon: 'media_next',
        closeIcon: 'media_close',
        notificationIcon: 'notification',
      },
      (res) => {
        console.log('media control success', res);
      },
      (err) => {
        console.log('media control error', err);
      }
    );

    CapacitorMusicControls.addListener('controlsNotification', (info: any) => {
      console.log('controlsNotification was fired');
      console.log(info);
      this.handleControlsEvent(info);
    });
    // this.playerService.isOnVideoControl$.next(true);
  }

  handleControlsEvent(action) {
    console.log('hello from handleControlsEvent');
    const message = action.message;

    console.log('message: ' + message);

    switch (message) {
      case 'music-controls-next':
        // next
        this.handleBackNForth(1);
        // document.getElementById("next-btn").click();
        break;
      case 'music-controls-previous':
        // previous
        this.handleBackNForth(-1);
        // document.getElementById("previous-btn").click();
        break;
      case 'music-controls-pause':
        // paused
        // this.handleTogglePlayPause();
        this.player.pause();
        CapacitorMusicControls.updateIsPlaying({
          isPlaying: false, // affects Android only
          elapsed: 0, // affects iOS Only
        });
        break;
      case 'music-controls-play':
        // resumed
        // this.handleTogglePlayPause();
        this.player.play();
        CapacitorMusicControls.updateIsPlaying({
          isPlaying: true, // affects Android only
          elapsed: 10, // affects iOS Only
        });
        break;
      case 'music-controls-destroy':
        // controls were destroyed
        break;

      // External controls (iOS only)
      case 'music-controls-toggle-play-pause':
        // do something
        // this.handleTogglePlayPause();
        break;
      case 'music-controls-seek-to':
        // do something
        break;
      case 'music-controls-skip-forward':
        // Do something
        // this.handleBackNForth(1);
        break;
      case 'music-controls-skip-backward':
        // Do something
        // this.handleBackNForth(-1);
        break;

      // Headset events (Android only)
      // All media button events are listed below
      case 'music-controls-media-button':
        // Do something
        break;
      case 'music-controls-headset-unplugged':
        // Do something
        break;
      case 'music-controls-headset-plugged':
        // Do something
        break;
      default:
        break;
    }
  }

  async getPlayingInfo() {
    this.playingState = this.playerService.isVideoPlaying
      ? this.playerService.videoPlayState
      : this.playerService.audioPlayState;
    this.playingItem = this.playerService.isVideoPlaying
      ? this.videoPlayingItem
      : this.audioPlayingItem;
    this.playingThumbUrl =
      this.playingItem.thumb || 'assets/imgs/default-image.svg';
    this.playingItemDuration = this.playingItem.duration || '';
    this.playingItemName = this.playingItem.name || '';
    this.playingItemId = this.playingItem.id || '';
  }

  getListTitle() {
    switch (this.videoPlayingSource) {
      case 0:
        return `${this.translateService.instant(
          'download.play'
        )}${this.translateService.instant('download.document')}`;
        break;
      case 1:
        return `${this.translateService.instant(
          'download.favorite'
        )}${this.translateService.instant('download.document')}`;
        break;
      case 2:
        return `${this.translateService.instant(
          'download.search'
        )}${this.translateService.instant('download.document')}`;
        break;
      case 3:
        return `${this.translateService.instant(
          'download.download'
        )}${this.translateService.instant('download.document')}`;
        break;
      default:
        return `${this.translateService.instant(
          'download.play'
        )}${this.translateService.instant('download.document')}`;
        break;
    }
  }

  updateMetaTag() {
    const pUrl = this.playingItem.url.match(/.*(?=\.)/).toString();
    const itemUrl = this.playingItem.url.replace(/.*\./, '');
    const playingUrl = `tabs/${
      this.playingItem.isVideo ? 'video' : 'audio'
    }/playlist/${pUrl}?item=${itemUrl}`;
    this.location.go(playingUrl);
    this.shareUrl = `${this.dataFetchService.webDomain}/${playingUrl}`;
    this.titleService.setTitle(`${this.playingItem.name} - FUYIN TV`);
    this.meta.updateTag({
      property: 'og:title',
      content: `${this.playingItem.name} - FUYIN TV`,
    });
    this.meta.updateTag({
      property: 'og:image',
      content: `${this.playingItem.thumb}`,
    });
    this.meta.updateTag({ property: 'og:url', content: this.shareUrl });
    this.meta.updateTag({
      property: 'og:description',
      content: `${this.playingItem.name} - description`,
    });
  }

  // async getvideoItemList() {
  //   if (this.videoPlayingSource === 0) {
  //     const allItemUrl = this.videoPlayingItem.url.match(/.*(?=\.)/).toString();
  //     const videoItemList = await this.dataFetchService.fetchvideoItemList(allItemUrl);
  //     this.videoItemList = videoItemList.children.map((item) => ({
  //       ...item,
  //       key: item.id,
  //       value: item.name.replace(/[0-9]+\-/g, ''),
  //       thumb: this.getItemThumbnail(item)
  //     }));
  //   } else if (this.videoPlayingSource === 1) {
  //     this.videoItemList = this.videoFavoriteList;
  //   } else if (this.videoPlayingSource === 2) {
  //     this.videoItemList = this.videoSearchList;
  //   }
  //   this.firstItemId = this.videoItemList[0].id;
  //   this.playerService.setVideoPlaylist(this.videoItemList);
  // }

  public selectItem(item) {
    if (item.isVideo) {
      this.playerService.playVideo(item);
      this.playerService.isVideoPlaying$.next(true);
    } else {
      this.playerService.playAudio(item);
      this.playerService.isVideoPlaying$.next(false);
    }
    this.playerService.playerWidgetLocation$.next(0);
  }

  async onShare(item) {
    if (this.platform.is('capacitor')) {
      try {
        await Share.share({
          title: this.translateService.instant('msg.share'),
          text: item.name,
          url: this.shareUrl,
          dialogTitle: this.translateService.instant('msg.share'),
        });
      } catch (error) {
        console.log(error);
      }
    }
    //  if (this.platform.is('electron'))
    else {
      this.presentModal(this.shareUrl);
    }
  }

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

  async onDownloadSelector(item, event: string) {
    if (event === 'focus' && !this.downloadBtn) {
      const getKey = await this.offlineService.db.manifest.get({
        id: this.videoPlayingItem.id,
      });
      // console.log(playUrl, getKey);
      if (!getKey) {
        this.downloadBtn = true;
      } else {
        this.isDownloading = false;
        this.downloadProgress = 0;
        await this.removeOfflineDB(item);
        await this.checkDownloaded();
        if (!this.isDownloaded && this.downloadProgress === 0) {
          this.presentToast(this.translateService.instant('msg.video.delete'));
          this.offlineService.refreshOfflineList();
        }
      }
    } else if (event === 'blur' && this.downloadBtn) {
      setTimeout(() => {
        this.downloadBtn = false;
      }, 200);
    }
  }

  async removeOfflineDB(item) {
    if (this.platform.is('ios')) {
      // remove native local data
      const dirExist = await this.file.checkDir(
        this.file.dataDirectory,
        item.url
      );
      if (dirExist)
        await this.file.removeRecursively(this.file.dataDirectory, item.url);
    } else {
      // remove indexeddb data
      await this.offlineService.db.data.where('id').equals(item.id).delete();
    }
    await this.offlineService.db.manifest.where('id').equals(item.id).delete();
  }

  async onDownload(item, quality: string = '480p') {
    this.downloadBtn = false;
    console.log('onDownload clicked', item);
    try {
      if (this.platform.is('ios')) {
        await this.file.createDir(this.file.dataDirectory, item.url, true);
        await this.file.createDir(
          this.file.dataDirectory,
          `${item.url}/${quality}`,
          true
        );
      }

      const downloadQuality = quality;
      let downloadedFile = 0;
      let playUrl = this.options.sources[0].src;
      if (playUrl.includes('/ipfs/')) {
        playUrl = this.options.sources[0].src.replace(
          /.*(?=\/ipfs.*)/,
          this.dataFetchService.downloadGateway
        );
      }
      console.log();

      const itemDir = path.dirname(playUrl);
      // const getKey = await this.offlineService.db.manifest.get({ id: this.videoPlayingItem.id });
      // // console.log(playUrl, getKey);
      // if (!getKey) {
      if (!this.isDownloading) {
        this.downloadProgress = 0.5;
        this.isDownloading = true;
        const reader = new M3U8FileParser();
        const pUrl = this.videoPlayingItem.url.match(/.*(?=\.)/).toString();
        const pItem = await this.dataFetchService.fetchSingleTopic(pUrl);
        item.pid = pItem.id;
        item.pname = pItem.name;

        const masterM3u8AB = await (await fetch(playUrl)).arrayBuffer();
        await this.downloadData(
          itemDir,
          path.basename(playUrl),
          masterM3u8AB,
          'master',
          item
        );
        // await this.offlineService.db.data.put({ uri: playUrl, data: masterM3u8AB, m3u8: 'master', id: item.id });
        const segmentUrl = `${itemDir}/${downloadQuality}.m3u8`;
        const segmentM3u8TXT = await (await fetch(segmentUrl)).text();
        // await this.offlineService.db.data.put({ uri: segmentUrl, data: segmentM3u8AB, m3u8: 'segment', id: item.id });
        // const enc = new TextDecoder("utf-8");
        // const m3u8txt = await enc.decode(segmentM3u8AB);
        await reader.read(segmentM3u8TXT);
        const m3u8 = await reader.getResult();
        const keyUri = /^http.*/.test(m3u8.segments[0].key.uri)
          ? m3u8.segments[0].key.uri
          : `${itemDir}/${m3u8.segments[0].key.uri}`;
        const segmentM3u8 = segmentM3u8TXT.replace(
          m3u8.segments[0].key.uri,
          'key.vgmk'
        );
        await this.downloadData(
          itemDir,
          `${downloadQuality}.m3u8`,
          segmentM3u8,
          'segment',
          item
        );
        const keyAB = await (await fetch(keyUri)).arrayBuffer();
        await this.downloadData(itemDir, 'key.vgmk', keyAB, 'key', item);
        // await this.offlineService.db.data.put({ uri: keyUri, data: keyAB, id: item.id});

        const downloadItem = async (i) => {
          return new Promise(async (resolve) => {
            const segmentUri = `${itemDir}/${m3u8.segments[i].url}`;
            try {
              const segmentBlob = await fetch(segmentUri);
              if (segmentBlob.ok) {
                const segmentAB = await segmentBlob.arrayBuffer();

                if (segmentAB)
                  await this.downloadData(
                    itemDir,
                    `${m3u8.segments[i].url}`,
                    segmentAB,
                    'key',
                    item
                  );
                // await this.offlineService.db.data.put({ uri: segmentUri, data: segmentAB, segNum: i, id: item.id });
              }
              resolve('done');
            } catch (error) {
              resolve('done');
            }
          });
        };

        let tasks = [];
        for (let i = 0; i < m3u8.segments.length; i++) {
          // list.length or endPoint
          tasks.push(async () => {
            await downloadItem(i);
            downloadedFile++;
            this.downloadProgress = Math.round(
              (downloadedFile * 100) / m3u8.segments.length
            );
            console.log(
              'downloaded',
              m3u8.segments[i].url,
              i,
              '/',
              m3u8.segments.length
            );
          });
        }

        await Promise.all(
          tasks.map((task) => this.queueService.vDownloadQueue.add(task))
        ).then(async () => {
          console.log('all task finish');
          console.log('download done', downloadedFile, m3u8.segments.length);
          if (downloadedFile === m3u8.segments.length) {
            await this.offlineService.db.manifest.put({
              id: item.id,
              type: 'video',
              metadata: item,
              quality: downloadQuality,
            });
            await this.checkDownloaded().then(() => {
              if (this.isDownloaded) {
                this.presentToast(
                  this.translateService.instant('msg.video.download')
                );
                this.isDownloading = false;
                this.downloadProgress = 0;
                downloadedFile = 0;
              }
            });
            this.offlineService.refreshOfflineList();
          }
        });
      } else {
        this.isDownloading = false;
        this.queueService.vDownloadQueue.clear();
        // console.log('clear queue called');
        this.downloadProgress = 0;
        await this.offlineService.db.data.where('id').equals(item.id).delete();
      }
      // } else {
      //   this.isDownloading = false;
      //   this.downloadProgress = 0;
      //   await this.offlineService.db.data.where('id').equals(item.id).delete();
      //   await this.offlineService.db.manifest.where('id').equals(item.id).delete();
      //   await this.checkDownloaded();
      //   if (!this.isDownloaded && this.downloadProgress === 0) {
      //     this.presentToast('Đã xóa 1 video khỏi danh sách tải về')
      //     this.offlineService.refreshOfflineList();
      //   };
      // }
    } catch (error) {
      console.log(error);
    }
    // const source = 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_30MB.mp4';
    // if (this.platform.is('capacitor')) {
    //   const request: DownloadRequest = {
    //     uri: source,
    //     title: 'MyDownload',
    //     description: '',
    //     mimeType: '',
    //     visibleInDownloadsUi: true,
    //     notificationVisibility: NotificationVisibility.VisibleNotifyCompleted,
    //     destinationInExternalFilesDir: {
    //       dirType: 'Downloads',
    //       subPath: 'MyDownloadedFile.mp4'
    //     }
    //   };

    //   this.downloader.download(request)
    //     .then((location: string) => {
    //       this.presentToast('Đã tải về 1 video');
    //       console.log('File downloaded at:' + location)
    //     }).catch((error: any) => console.error(error));
    // }
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

  async checkDownloaded() {
    this.isDownloaded = await this.offlineService.db.manifest
      .get({ id: this.playingItem.id })
      .then((result) => {
        if (result) return true;
        else return false;
      });
  }

  async imgOnLoad(status, thumbnail) {
    if (status === 'loaded') {
      thumbnail.el.firstChild.style.display = 'none';
      thumbnail.el.classList.add('auto-height');
    }
  }

  async preloadData(item: Item) {
    if (
      item.isLeaf === null &&
      this.dataFetchService.prefetchList.findIndex((elem) => elem === item.id) <
        0
    ) {
      const playUrl = await this.dataFetchService.getPlayUrl(item, true);
      const dirUrl = path.dirname(playUrl);
      this.dataFetchService.prefetchList.push(item.id);
      (async () => {
        await this.queueService.queue.add(async () => {
          const fetchItems = [
            'key.vgmk',
            'playlist.m3u8',
            '480p/content0.vgmx',
          ];
          fetchItems.forEach((item) => {
            const url = `${dirUrl}/${item}`;
            fetch(url);
          });
        });
      })();
    }
  }

  toggleMinimized(pos) {
    this.playerService.playerWidgetLocation$.next(pos);
    if (pos === 2) {
      this.collapsePlayer();
    }
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

  async addToFavorite(item: Item) {
    const favoriteList = this.playerService.isVideoPlaying
      ? await this.dataFetchService.fetchFavorite('video')
      : await this.dataFetchService.fetchFavorite('audio');
    const itemIndex = favoriteList.findIndex((list) => list.id === item.id);
    if (itemIndex >= 0) {
      favoriteList.splice(itemIndex, 1);
      this.isFavorite = false;
      this.presentToast(
        this.translateService.instant(
          this.playerService.isVideoPlaying
            ? 'msg.video.remove'
            : 'msg.audio.remove'
        )
      );
    } else {
      favoriteList.push(item);
      this.isFavorite = true;
      this.presentToast(
        this.translateService.instant(
          this.playerService.isVideoPlaying ? 'msg.video.add' : 'msg.audio.add'
        )
      );
    }
    const favoriteKey = this.playerService.isVideoPlaying
      ? 'favorite.video'
      : 'favorite.audio';
    this.localForageService.set(favoriteKey, favoriteList);
    this.playerService.setFavoritePlayList(
      this.playerService.isVideoPlaying ? 0 : 1,
      favoriteList
    );
  }

  async checkFavorite(id) {
    const favoriteList = this.playerService.isVideoPlaying
      ? await this.dataFetchService.fetchFavorite('video')
      : await this.dataFetchService.fetchFavorite('audio');
    const itemIndex = favoriteList.findIndex((list) => list.id === id);
    if (itemIndex >= 0) {
      this.isFavorite = true;
    } else {
      this.isFavorite = false;
    }
  }

  loadMoreData(event) {
    const itemListLength = this.playerService.isVideoPlaying
      ? this.videoItemList.length
      : this.audioItemList.length;
    setTimeout(() => {
      event.target.complete();
      if (this.itemLength < itemListLength) {
        this.itemLength += 20;
      } else {
        this.itemLength = itemListLength;
      }
    }, 500);
  }

  collapsePlayer() {
    this.playerService.playerWidgetLocation$.next(2);
    this.player.pause();
    if (this.playerService.isVideoPlaying) {
      this.playerService.videoPause();
    } else {
      this.playerService.audioPause();
    }
  }

  controlBarTap() {
    this.playerService.playerWidgetLocation$.next(0);
  }

  handleTogglePlayPause() {
    if (this.playingState.isPlaying) {
      if (this.playerService.isVideoPlaying) this.playerService.videoPause();
      else this.playerService.audioPause();
    } else {
      if (this.playerService.isVideoPlaying) this.playerService.videoResume();
      else this.playerService.audioResume();
    }
  }

  handleRewindForward(amount: number) {
    const nextTime = this.player.currentTime() + amount;
    this.player.currentTime(nextTime);
  }

  handleVolumeControl(amount: number) {
    const nextVolume = this.player.volume() + amount;
    this.player.volume(nextVolume);
  }

  handleBackNForth(direction: number) {
    this.playerService.setBackNForth(direction, true);
  }

  handlePlayerEvent(eventName: string, data?: any) {
    if (this.playerService.isVideoPlaying)
      this.onVideoPlayerEvent.next({ eventName, data });
    else this.onAudioPlayerEvent.next({ eventName, data });
  }

  onDoubleTap(event) {
    if (event.center.x / window.innerWidth > 0.75) {
      this.handleRewindForward(10);
    } else if (event.center.x / window.innerWidth < 0.25) {
      this.handleRewindForward(-10);
    }
  }
  onTouchStart(event) {
    if (!this._seeking) {
      this.movementPos = 0;
      this.touchStartPos = event.changedTouches[0].clientY;
      this.videoWidget.style.transition = 'transform 0s ease-out';
      this.videoPlayer.style.transition = 'padding-top 0s ease-in';
      this.videoInfo.style.transition = 'margin-top 0s ease-in';
    }
  }

  onTouchMove(event) {
    if (!this._seeking) {
      this.movementPos = event.changedTouches[0].clientY - this.touchStartPos;
      if (Math.abs(this.movementPos) > 15) {
        this.videoPlayer.classList.add('vjs-controls-disabled');
        // const windowHeight = window.innerHeight;
        // const _minimizeHeight = 205;
        let translatePos: number;
        if (this.widgetLocation === 1) {
          if (this.movementPos > this._minimizeHeight) {
            translatePos = this.windowHeight;
          } else if (
            this.movementPos <
            this._minimizeHeight - this.windowHeight
          ) {
            translatePos = 0;
          } else {
            translatePos =
              this.movementPos + this.windowHeight - this._minimizeHeight;
          }
        } else {
          if (this.movementPos > this.windowHeight - this._minimizeHeight) {
            translatePos = this.windowHeight - this._minimizeHeight;
          } else if (this.movementPos < 0) {
            translatePos = 0;
          } else {
            translatePos = this.movementPos;
          }
        }

        if (this.widgetLocation === 0) {
          if (translatePos > this.windowHeight - this._minimizeHeight - 70) {
            this.playerElem.style.width = 'auto';
            this.playerElem.style.height = '100%';
          } else {
            this.playerElem.style.height = 'calc(100vw * 0.5625)';
            this.playerElem.style.width = '100%';
          }
        } else if (this.widgetLocation === 1) {
          if (translatePos < this.windowHeight - this._minimizeHeight) {
            this.playerElem.style.height = 'calc(100vw * 0.5625)';
            this.playerElem.style.width = '100%';
            this.videoPlayer.style.width = '100%';
          } else {
            this.playerElem.style.height = '100%';
            this.playerElem.style.width = 'auto';
            this.videoPlayer.style.width = '0';
          }
        }

        this.videoWidget.style.transform = `translateY(${translatePos}px)`;
        const opacityRatio =
          (this.windowHeight - translatePos * 1.5) / this.windowHeight;
        this.videoInfo.style.opacity = opacityRatio;
        this.videoList.style.opacity = opacityRatio;
        this.minimizedControlBar.style.opacity = 1 - opacityRatio * 3;

        this.videoPlayer.style.paddingTop = `${
          (56.25 * (this.windowHeight - translatePos + this._offsetHeight)) /
          this.windowHeight
        }%`;

        this.videoInfo.style.marginTop = `calc(100vw * ${
          (0.5625 * (this.windowHeight - translatePos + this._offsetHeight)) /
          this.windowHeight
        })`;
      }
    }
  }

  onTouchEnd(event) {
    if (!this._seeking) {
      this.videoWidget.style.removeProperty('transform');
      this.videoInfo.style.removeProperty('margin-top');
      this.videoInfo.style.removeProperty('opacity');
      this.videoInfo.style.removeProperty('transition');
      this.videoList.style.removeProperty('opacity');
      this.minimizedControlBar.style.removeProperty('opacity');
      this.videoPlayer.style.removeProperty('transition');
      this.videoPlayer.style.removeProperty('width');
      this.videoWidget.style.removeProperty('transition');
      this.playerElem.style.removeProperty('height');
      this.playerElem.style.removeProperty('width');
      this.videoPlayer.classList.remove('vjs-controls-disabled');

      if (this.widgetLocation === 1) {
        this.videoPlayer.style.paddingTop = `${
          (56.25 * (this._minimizeHeight + this._offsetHeight)) /
          this.windowHeight
        }%`;
        if (
          this.movementPos < 0 &&
          Math.abs(this.movementPos) > this.windowHeight / 2 - 100
        ) {
          this.playerService.playerWidgetLocation$.next(0);
        } else if (this.movementPos > 50) {
          this.collapsePlayer();
        }
      } else if (this.widgetLocation === 0) {
        this.videoPlayer.style.paddingTop = '56.25%';
        // console.log(this.movementPos, ((this.windowHeight / 2) - 100));

        if (this.movementPos > this.windowHeight / 2 - 100) {
          this.playerService.playerWidgetLocation$.next(1);
        }
      }
    }
  }

  private async getItemThumbnail(item: any) {
    return await this.dataFetchService.getThumbnailUrl(item); // 'https://stream.vgm.tv/VGMV/01_BaiGiang/CacDienGia/MSNHB_DeHiepMotTrongPhucVu/preview/01.jpg';
  }

  ngOnDestroy() {
    // destroy player
    if (this.player) {
      this.player.dispose();
    }
    (this.videoPlaylistSub as Subscription).unsubscribe();
  }
}
