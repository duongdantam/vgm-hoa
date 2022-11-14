import { ComponentFactoryResolver, Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Item } from '../base/model';
// import { GoogleAnalytics } from '@ionic-native/google-analytics/ngx';
import { GoogleAnalyticsService } from './google-analytics.service';

export const PLAYBACK_RATE = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export enum PlaybackMode {
  REPEAT,
  ALL,
  SHUFFLE,
}

export enum PlayingType {
  VIDEO,
  AUDIO,
}

export enum PlayingSource {
  NORMAL,
  FAVORITE,
  SEARCH,
  DOWNLOAD,
}

export interface PlayerEvent {
  eventName: string;
  data?: any;
}

export interface PlayState {
  isPlaying: boolean;
  playingSource: PlayingSource;
  playingMode: PlaybackMode;
  playingType: PlayingType;
  playingUrl?: string;
  playingTitle?: string;
  item?: Item;
}

export enum WidgetLocation {
  SHOW,
  MINIMIZE,
  HIDE,
}

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  public audioIsHidden = true;
  public audioIsHidden$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    true
  );

  public videoIsHidden = true;
  public videoIsHidden$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    true
  );

  public isOnVideoControl = true;
  public isOnVideoControl$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    true
  );

  public videoWidgetLocation: WidgetLocation = 2;
  public videoWidgetLocation$: BehaviorSubject<WidgetLocation> = new BehaviorSubject<WidgetLocation>(
    2
  );

  public playbackMode: PlaybackMode;
  public playbackMode$: BehaviorSubject<PlaybackMode> = new BehaviorSubject<PlaybackMode>(
    PlaybackMode.ALL
  );

  public playbackRateIndex = 2;
  public playbackRate$: BehaviorSubject<number> = new BehaviorSubject<number>(
    PLAYBACK_RATE[this.playbackRateIndex]
  );

  public audioPlaylist: Item[] = [];
  public audioPlaylist$: BehaviorSubject<Item[]> = new BehaviorSubject<Item[]>(
    []
  );

  public videoPlaylist: Item[] = [];
  public videoPlaylist$: BehaviorSubject<Item[]> = new BehaviorSubject<Item[]>(
    []
  );

  public favoriteAudioPlaylist: Item[] = [];
  public favoriteAudioPlaylist$: BehaviorSubject<Item[]> = new BehaviorSubject<
    Item[]
  >([]);

  public favoriteVideoPlaylist: Item[] = [];
  public favoriteVideoPlaylist$: BehaviorSubject<Item[]> = new BehaviorSubject<
    Item[]
  >([]);

  public audioSearchList: Item[] = [];
  public audioSearchList$: BehaviorSubject<Item[]> = new BehaviorSubject<
    Item[]
  >([]);

  public videoSearchList: Item[] = [];
  public videoSearchList$: BehaviorSubject<Item[]> = new BehaviorSubject<
    Item[]
  >([]);

  public favoritePlayingType: PlayingType = 0;
  public favoritePlayingType$: BehaviorSubject<PlayingType> = new BehaviorSubject<PlayingType>(
    0
  );

  public documentPlayingType: PlayingType = 0;
  public documentPlayingType$: BehaviorSubject<PlayingType> = new BehaviorSubject<PlayingType>(
    0
  );

  public allList: Item[] = [];
  public repeatList: Item[] = [];
  public shuffleList: Item[] = [];
  public currentAudioPlayList: Item[] = [];

  public videoPlayState: PlayState | null;
  public videoPlayState$: BehaviorSubject<Partial<PlayState> | null> = new BehaviorSubject<Partial<PlayState> | null>(
    { playingTitle: '', playingSource: PlayingSource.NORMAL, isPlaying: false }
  );

  public audioPlayState: PlayState | null;
  public audioPlayState$: BehaviorSubject<Partial<PlayState> | null> = new BehaviorSubject<Partial<PlayState> | null>(
    { playingTitle: '', playingSource: PlayingSource.NORMAL, isPlaying: false }
  );

  public audioPlayerEvent$: Subject<PlayerEvent> = new Subject();
  public videoPlayerEvent$: Subject<PlayerEvent> = new Subject();

  constructor(private ga: GoogleAnalyticsService) {
    this.audioPlaylist$.subscribe((newPlaylist: Item[]) => {
      this.audioPlaylist = newPlaylist;
    });
    this.videoPlaylist$.subscribe((newPlaylist: Item[]) => {
      this.videoPlaylist = newPlaylist;
    });
    this.audioSearchList$.subscribe((newSearchList: Item[]) => {
      this.audioSearchList = newSearchList;
    });
    this.videoSearchList$.subscribe((newSearchList: Item[]) => {
      this.videoSearchList = newSearchList;
    });
    this.favoriteVideoPlaylist$.subscribe(
      (newFavoriteVideoPlaylist: Item[]) => {
        this.favoriteVideoPlaylist = newFavoriteVideoPlaylist;
      }
    );
    this.favoriteAudioPlaylist$.subscribe(
      (newFavoriteAudioPlaylist: Item[]) => {
        this.favoriteAudioPlaylist = newFavoriteAudioPlaylist;
      }
    );

    this.videoPlayState$.subscribe((newVideoPlayState: PlayState) => {
      this.videoPlayState = { ...this.videoPlayState, ...newVideoPlayState };
    });
    this.audioPlayState$.subscribe((newAudioPlayState: PlayState) => {
      this.audioPlayState = { ...this.audioPlayState, ...newAudioPlayState };
    });
    this.playbackMode$.subscribe((newPlaybackMode: PlaybackMode) => {
      this.playbackMode = newPlaybackMode;
    });
    this.audioPlayerEvent$
      .pipe(
        filter(({ eventName, data }: PlayerEvent) => eventName === 'ended'),
        map(({ eventName, data }: PlayerEvent) => {
          console.log(eventName, data);
          this.setBackNForth(1, false);
          this.ga.trackEvent('audio_complete', `${data}`);
        })
      )
      .subscribe();

    this.videoPlayerEvent$
      .pipe(
        filter(({ eventName, data }: PlayerEvent) => eventName === 'ended'),
        map(({ eventName, data }: PlayerEvent) => {
          console.log(eventName, data);
          this.setBackNForth(1, true);
          this.ga.trackEvent('video_complete', `${data}`);
        })
      )
      .subscribe();
    this.audioIsHidden$.subscribe((newState: boolean) => {
      this.audioIsHidden = newState;
    });
    this.videoIsHidden$.subscribe((newState: boolean) => {
      this.videoIsHidden = newState;
    });
    this.isOnVideoControl$.subscribe((newState: boolean) => {
      this.isOnVideoControl = newState;
    });
    this.videoWidgetLocation$.subscribe((newState: WidgetLocation) => {
      this.videoWidgetLocation = newState;
    });
    this.favoritePlayingType$.subscribe((newType: PlayingType) => {
      this.favoritePlayingType = newType;
    });
    this.documentPlayingType$.subscribe((newType: PlayingType) => {
      this.documentPlayingType = newType;
    });
  }

  emitAudioEvent(eventName: string, data?: any) {
    this.audioPlayerEvent$.next({ eventName, data });
  }

  emitVideoEvent(eventName: string, data?: any) {
    this.videoPlayerEvent$.next({ eventName, data });
  }

  setVideoPlaylist(itemList: Item[]) {
    this.videoPlaylist$.next(itemList);
  }

  setAudioPlaylist(itemList: Item[]) {
    this.allList = itemList;
    this.shuffleList = itemList
      .map((x) => x)
      .sort((a, b) => 0.5 - Math.random());
    this.setCurrentAudioPlayList();
  }

  setPlaybackMode(mode: PlaybackMode) {
    let nextModeIndex = mode + 1;
    if (nextModeIndex >= 3) {
      nextModeIndex = 0;
    }
    this.playbackMode$.next(nextModeIndex);
    if (nextModeIndex !== 0) {
      this.setCurrentAudioPlayList();
    }
  }

  setCurrentAudioPlayList() {
    if (this.playbackMode === 1) {
      this.currentAudioPlayList = this.allList;
    } else if (this.playbackMode === 2) {
      this.currentAudioPlayList = this.shuffleList;
    }
    this.audioPlaylist$.next(this.currentAudioPlayList);
  }

  setMyFavorite(type: PlayingType, favoriteList: Item[]) {
    if (type === 0) {
      this.favoriteVideoPlaylist$.next(favoriteList);
    } else if (type === 1) {
      this.favoriteAudioPlaylist$.next(favoriteList);
    }
  }

  playVideo(item: Item, source?: number) {
    this.videoPlayState$.next({
      isPlaying: true,
      playingSource: source,
      playingType: PlayingType.VIDEO,
      playingUrl: item.url,
      playingTitle: item.name,
      item: item,
    });
    this.setVideoControlsHidden(false);
    this.ga.trackEvent(
      'video_play',
      `${item.name} - from source: '${PlayingSource[source]}'`
    );
  }

  playAudio(item: Item, source?: number) {
    this.audioPlayState$.next({
      isPlaying: true,
      playingSource: source,
      playingType: PlayingType.AUDIO,
      playingUrl: item.url,
      playingTitle: item.name,
      item: item,
    });
    this.setAudioControlsHidden(false);
    this.ga.trackEvent(
      'audio_play',
      `${item.name} - from source: '${PlayingSource[source]}'`
    );
  }

  setBackNForth(direction: number, isVideo: boolean) {
    let state: PlayState;
    let list: Item[];
    if (isVideo) {
      state = this.videoPlayState;
      list = this.videoPlaylist;
    } else {
      state = this.audioPlayState;
      list = this.audioPlaylist;
    }

    const currentIndex = this.getItemIndex(state.item, list);

    // Next item index validation before setting next playing item
    let nextItemIndex = currentIndex + direction;
    if (nextItemIndex >= list.length) {
      nextItemIndex = 0;
    } else if (nextItemIndex < 0) {
      nextItemIndex = list.length - 1;
    }

    // console.log(state, currentIndex, nextItemIndex);
    if (isVideo) {
      this.playVideo(list[nextItemIndex]);
    } else {
      this.playAudio(list[nextItemIndex]);
    }

    // Issue playback
    // if (this.audioPlayState.playingType === PlayingType.AUDIO) {
    // this.playAudio(list[nextItemIndex]);
    // } else {
    //   this.playVideo(this.playlist[nextItemIndex]);
    // }
  }

  togglePlaybackRate() {
    // Next item index validation before setting next playing item
    this.playbackRateIndex = this.playbackRateIndex + 1;
    if (this.playbackRateIndex >= PLAYBACK_RATE.length) {
      this.playbackRateIndex = 0;
    } else if (this.playbackRateIndex < 0) {
      this.playbackRateIndex = PLAYBACK_RATE.length - 1;
    }
    this.playbackRate$.next(PLAYBACK_RATE[this.playbackRateIndex]);
    this.ga.trackEvent(
      'audio_playbackrate',
      `Set playback rate to: '${PLAYBACK_RATE[this.playbackRateIndex]}x'`
    );
  }

  videoPause() {
    this.videoPlayState$.next({ ...this.videoPlayState, isPlaying: false });
  }

  videoResume() {
    this.audioPause();
    this.videoPlayState$.next({ ...this.videoPlayState, isPlaying: true });
  }

  audioPause() {
    this.audioPlayState$.next({ ...this.audioPlayState, isPlaying: false });
  }

  audioResume() {
    this.videoPause();
    this.audioPlayState$.next({ ...this.audioPlayState, isPlaying: true });
  }

  setAudioControlsHidden(flag: boolean) {
    // Only when playing audio to show up controls
    if (flag === false) {
      this.audioIsHidden$.next(false);
      this.setVideoControlsHidden(true);
    } else {
      this.audioIsHidden$.next(true);
    }
  }

  setVideoControlsHidden(flag: boolean) {
    // Only when playing audio to show up controls
    if (flag === false) {
      this.videoIsHidden$.next(false);
      this.setAudioControlsHidden(true);
    } else {
      this.videoIsHidden$.next(true);
    }
  }

  public getItemIndex(item: Item, itemList: Item[]) {
    return itemList.findIndex((searchItem: Item) => searchItem.id === item.id);
  }
}
