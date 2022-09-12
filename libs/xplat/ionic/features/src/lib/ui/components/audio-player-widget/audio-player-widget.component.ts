import '@videojs/http-streaming';
import 'videojs-hls-quality-selector';
import {
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnChanges,
	Output,
	SimpleChanges,
	ViewChild,
} from '@angular/core';

import { BaseComponent, Item } from '@fy/xplat/core';
import { BehaviorSubject } from 'rxjs';
import videojs from 'video.js';
import { OfflineService, PlayerEvent, PlayerService, } from '@fy/xplat/core';

// import { Meta, Title } from '@angular/platform-browser';
import { Platform } from '@ionic/angular';
import { Location } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { Plugins } from '@capacitor/core';
const { CapacitorMusicControls } = Plugins;
// import * as bitwise from 'bitwise';
// import { Buffer } from 'buffer';
// import { getPlayHash } from '@vgm/xplat/core';
interface PlayerOptions {
	fluid: boolean;
	aspectRation: string;
	autoplay: boolean;
	sources: {
		src: string;
		type: string;
	};
}

@Component({
	selector: 'fy-audio-player-widget',
	templateUrl: 'audio-player-widget.component.html',
	styleUrls: ['./audio-player-widget.component.scss'],
})
export class AudioPlayerWidgetComponent
	extends BaseComponent
	implements OnChanges {
	@ViewChild('audio', { static: true }) target: ElementRef;
	@Input() public title: string = 'Loading...';
	@Input() public currentProgress: number;
	@Input() public isHidden: boolean = true;
	@Input() public isVideoControl: boolean = true;
	@Input() public isPlaying: boolean = false;
	@Input() public playingItem: Item;
	isMuted: boolean = true;
	@Input() public playingType: number = 1;
	@Input() public playingSource: number = 0;

	@Input() public playbackMode: number = 0;

	@Input() public playbackRate: number = 1;
	@Input()
	set options(options: PlayerOptions) {
		this._options = options;
	}

	// @Output() public onTogglePlayPause: EventEmitter<void> = new EventEmitter();

	// @Output() public onTogglePlayMode: EventEmitter<number> = new EventEmitter();

	// @Output() public onBackNForth: EventEmitter<number> = new EventEmitter();
	// @Output() public onTogglePlaybackRate: EventEmitter<void> = new EventEmitter();
	@Output() public onPlayerEvent: EventEmitter<PlayerEvent> = new EventEmitter();

	public currentTime$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
	public currentTime: number = 0;
	public volumeLevel: number = 1;
	public currentPlaybackRate: number = 1;
	public duration: number = 0;
	private _initialized: boolean = false;
	private _seeking: boolean = false;
	private _safeTop: any;
	private _safeBottom: any;
	private _audioWidget: any;
	private _audioPlayer: any;
	nowTime = 0;
	get options(): PlayerOptions {
		return this._options;
	}

	private _options: PlayerOptions;

	player: videojs.Player;

	constructor(
		// private elementRef: ElementRef,
		private playerService: PlayerService,
		private platform: Platform,
		private location: Location,
		private titleService: Title,
		private offlineService: OfflineService,
		private meta: Meta
	) {
		super();
	}

	async ngOnChanges(changes: SimpleChanges) {
		if ('isPlaying' in changes && this.player) {
			if (this._initialized) {
				if ((changes as any).isPlaying.currentValue === true) {
					if (this.player.paused()) {
						this.player.play();
					}
					if (this.platform.is('capacitor') && this.isVideoControl === true) {
						await this.createMusicControl();
					}
				} else {

					if (!this.player.paused()) {
						this.player.pause();
					}
				}
			}
		}


		if ('playbackRate' in changes && this.player) {
			this.setPlaybackRate((changes as any).playbackRate.currentValue);
		}

		if ('options' in changes && this.player) {
			document.getElementById('audio-widget').style.transform = 'translateY(0)';
			// if (this.platform.is('hybrid')) {
			//   const keyUri = this.options.sources[0].src.replace('128p.m3u8', 'key.vgmk');
			//   const secretCode = await (await fetch(this.options.sources[0].src)).text().then(function (str) {
			//     return str
			//       .match(/(IV=0x).+/)
			//       .toString()
			//       .replace('IV=0x', '')
			//       .slice(0, 4);
			//   });
			//   const keyAB = await (await fetch(keyUri)).arrayBuffer();
			//   const encryptedAB = bitwise.buffer.xor(Buffer.from(keyAB), Buffer.from(`VGM-${secretCode}`), false);
			//   console.log('xor-key:', secretCode, '\n', keyAB, '\n', encryptedAB);
			//   await this.offlineService.db.data.put({ uri: keyUri, data: encryptedAB, segNum: -1, id: this.playingItem.id });
			//   const keyDB = await this.offlineService.db.data.get({ uri: keyUri });
			//   const keyLocalURL = URL.createObjectURL(new Blob([keyDB.data], { type: 'mimeType' }));
			//   console.log('got key local URL::::', keyLocalURL);

			//   // const key = getPlayHash(this.playingItem.url, this.playingItem.khash);
			//   // modified key filepath
			//   videojs.Vhs.xhr.beforeRequest = function (options) {
			//     if (/(key\.vgmk)$/.test(options.uri)) {
			//       console.log('option before request', options);
			//       options.uri = keyLocalURL;
			//     }
			//     return options;
			//   };
			// }

			this.updateMetaTag();
			this.play();
			if (this.platform.is('capacitor')) {
				await this.createMusicControl();
			}
		}
	}

	onVolumeChange(newLevel) {
		this.player.volume(newLevel);
	}

	beginSeek(e) {
		this._seeking = true;
	}

	endSeek(e) {
		this.player.currentTime(this.currentTime);
		this._seeking = false;
	}

	play(): void {
		if (this.options && this.player) {
			this.player.src(this.options.sources);
			this.player.play();
		}
	}

	setPlaybackRate(rate: number) {
		this.player.playbackRate(rate);
		videojs.Vhs.GOAL_BUFFER_LENGTH = 120 * this.player.playbackRate();
		videojs.Vhs.MAX_GOAL_BUFFER_LENGTH = 150 * this.player.playbackRate();
	}

	ngOnInit() {
		this._initialized = false;
		this.player = videojs(this.target.nativeElement, {
			html5: {
				vhs: {
					withCredentials: false,
					overrideNative: true,
					cacheEncryptionKeys: true
				},
			},

		});
		videojs.Vhs.GOAL_BUFFER_LENGTH = 120;
		videojs.Vhs.MAX_GOAL_BUFFER_LENGTH = 150;
		// console.log('hlsssss', videojs.Vhs.GOAL_BUFFER_LENGTH, videojs.Vhs.MAX_GOAL_BUFFER_LENGTH);

		this.player.on('timeupdate', () => {
			if (!this._seeking) {
				this.currentTime = this.player.currentTime();
				this.currentTime$.next(this.currentTime);
				// this._seeking = false;
			}
		});
		this.player.on('loadedmetadata', () => {
			console.log('audio on loadedmetadata');

			this._initialized = true;
			this.duration = this.player.duration();
			this.setPlaybackRate(this.playbackRate);
			// document.getElementById('audio-widget').style.transform = 'translateY(0)';
		});
		this.player.on('ended', () => {
			console.log('audio ended');
			this.handlePlayerEvent('ended', this.title);
		});

		this.player.on('play', () => {
			// console.log('audio is playing');
			// if (this.playerService.videoPlayState.isPlaying) {
			//   this.playerService.videoPause();
			// }
			if (!this.playerService.audioPlayState.isPlaying) {
				this.playerService.audioResume();
			}
			if (this.platform.is('capacitor') && this.isHidden === false) {
				CapacitorMusicControls.updateIsPlaying({
					isPlaying: true, // affects Android only
					elapsed: 0 // affects iOS Only
				});
			}

		})
		this.player.on('pause', () => {
			if (this.playerService.audioPlayState.isPlaying) {
				this.playerService.audioPause()
			}
			if (this.platform.is('capacitor') && this.isHidden === false) {
				CapacitorMusicControls.updateIsPlaying({
					isPlaying: false, // affects Android only
					elapsed: 0 // affects iOS Only
				});
			}
		})

		this.player.on('canplaythrough', () => {
			this.player.muted(false);
		})
		// this.player.hlsQualitySelector();
	}

	ngAfterViewInit() {
		this._safeTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sat"), 10);
		this._safeBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sab"), 10);
		this._audioWidget = document.getElementById('audio-widget');
		this._audioPlayer = document.getElementById('audio-player');
		this._audioWidget.addEventListener('keydown', (e) => {
			e.stopPropagation();
			e.preventDefault();
			console.log(e);
			switch (e.code) {
				case 'Space':
					this.handleTogglePlayPause();
					break;
				case 'ArrowDown':
					this.volumeLevel = this.player.volume() - 0.1;
					this.onVolumeChange(this.volumeLevel);
					break;
				case 'ArrowUp':
					this.volumeLevel = this.player.volume() + 0.1;
					this.onVolumeChange(this.volumeLevel);
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


	updateMetaTag() {
		const pUrl = this.playingItem.url.match(/.*(?=\.)/).toString();
		const itemUrl = this.playingItem.url.replace(/.*\./, '');
		const playingUrl = `tabs/audio/playlist/${pUrl}?item=${itemUrl}`;
		this.location.go(playingUrl);
		this.titleService.setTitle(`${this.title} - VGM TV`);
		this.meta.updateTag({ property: 'og:url', content: `https://vgm.tv` });
		this.meta.updateTag({ property: 'og:title', content: `${this.title} - VGM TV` });
		this.meta.updateTag({ property: 'og:description', content: `${this.title} - description` });
		this.meta.updateTag({ property: 'og:image', content: `https://vgm.tv/assets/imgs/logo-vgm.svg` });
	}

	createMusicControl() {
		CapacitorMusicControls.removeAllListeners();
		CapacitorMusicControls.create({
			track: this.title,		// optional, default : ''
			artist: '',						// optional, default : ''
			album: '',     // optional, default: ''
			cover: '',			// optional, default : nothing
			// cover can be a local path (use fullpath 'file:///storage/emulated/...', or only 'my_image.jpg' if my_image.jpg is in the www folder of your app)
			//			 or a remote url ('http://...', 'https://...', 'ftp://...')

			// hide previous/next/close buttons:
			hasPrev: false,		// show previous button, optional, default: true
			hasNext: false,		// show next button, optional, default: true
			hasClose: true,		// show close button, optional, default: false

			// iOS only, optional
			duration: this.duration, // optional, default: 0
			elapsed: 10, // optional, default: 0
			hasSkipForward: false, //optional, default: false. true value overrides hasNext.
			hasSkipBackward: false, //optional, default: false. true value overrides hasPrev.
			skipForwardInterval: 15, //optional. default: 15.
			skipBackwardInterval: 15, //optional. default: 15.
			hasScrubbing: false, //optional. default to false. Enable scrubbing from control center progress bar 

			// Android only, optional
			isPlaying: true,							// optional, default : true
			dismissable: true,							// optional, default : false
			// text displayed in the status bar when the notification (and the ticker) are updated
			ticker: 'Now playing "Time is Running Out"',
			//All icons default to their built-in android equivalents
			//The supplied drawable name, e.g. 'media_play', is the name of a drawable found under android/res/drawable* folders
			playIcon: 'media_play',
			pauseIcon: 'media_pause',
			prevIcon: 'media_prev',
			nextIcon: 'media_next',
			closeIcon: 'media_close',
			notificationIcon: 'notification'
		}, (res) => { console.log('media control success', res); },
			(err) => { console.log('media control error', err); });

		CapacitorMusicControls.addListener('controlsNotification', (info: any) => {
			console.log('controlsNotification was fired');
			console.log(info);
			this.handleControlsEvent(info);
		});
		this.playerService.isOnVideoControl$.next(false);
	}

	handleControlsEvent(action) {

		console.log("hello from handleControlsEvent")
		const message = action.message;

		console.log("message: " + message)

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
				this.player.pause()
				CapacitorMusicControls.updateIsPlaying({
					isPlaying: false, // affects Android only
					elapsed: 0 // affects iOS Only
				});
				break;
			case 'music-controls-play':
				// resumed
				// this.handleTogglePlayPause();
				this.player.play();
				CapacitorMusicControls.updateIsPlaying({
					isPlaying: true, // affects Android only
					elapsed: 10 // affects iOS Only
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


	collapsePlayer() {
		document.getElementById('audio-widget').style.transform = 'translateY(210px)';
		// document.querySelector('.wrapper.collapsible').classList.add('collapsed');
		if (this.playerService.audioPlayState.isPlaying) {
			this.playerService.audioPause();
		}
	}

	ngOnDestroy() {
		if (this.player) {
			this.player.dispose();
		}
	}
	onTouchStart(event) {
		// this._audioWidget = document.getElementById('audio-widget');
		this._audioWidget.style.transition = 'transform 0s ease-out';
	}

	onTouchMove(event) {
		let movement = event.targetTouches[0].clientY - this._audioWidget.offsetTop - 63 - this._safeBottom;
		if (movement < 0) {
			movement = 0;
		} else if (movement > 210) {
			movement = 210
		}

		this._audioWidget.style.transform = `translateY(${movement}px)`;

	}
	onTouchEnd(event) {
		this._audioWidget.style.transition = 'transform 0.25s ease-out';
		if (event.changedTouches[0].clientY - 63 - this._safeBottom > ((window.innerHeight - this._audioWidget.offsetTop) / 2 + this._audioWidget.offsetTop)) {
			this.collapsePlayer();
		} else {
			this._audioWidget.style.transform = `translateY(0px)`;
		}
	}

	handleTogglePlayMode(mode: number) {
		this.playerService.setPlaybackMode(mode);
		// this.onTogglePlayMode.emit(mode);
		if (mode === 2) {
			this.player.loop(true)
		} else {
			this.player.loop(false)
		}

	}

	handleRewindForward(amount: number) {
		const nextTime = this.player.currentTime() + amount;
		this.player.currentTime(nextTime);
	}


	handleBackNForth(direction: number) {
		this.playerService.setBackNForth(direction, false);
	}

	// handleVolumeControl(amount: number) {
	//   const nextVolume = this.player.volume() + amount;
	//   this.player.volume(nextVolume);
	// }

	handleTogglePlayPause() {
		if (this.playerService.audioPlayState.isPlaying) {
			this.playerService.audioPause();
		} else {
			this.playerService.audioResume();

		}
	}

	handlePlaybackRateToggle() {
		this.playerService.togglePlaybackRate();
	}

	handlePlayerEvent(eventName: string, data?: any) {
		this.onPlayerEvent.next({ eventName, data });
	}
}
