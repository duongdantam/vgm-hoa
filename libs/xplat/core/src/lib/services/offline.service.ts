import Dexie from 'dexie';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Platform } from '@ionic/angular';
@Injectable({
  providedIn: 'root',
})
export class OfflineService {
  db: any;
  public offlineVideoPlaylist: any[] = [];
  public offlineVideoPlaylist$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  public offlineAudioPlaylist: any[] = [];
  public offlineAudioPlaylist$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  constructor(
    private platform: Platform
  ) {
    this.offlineVideoPlaylist$.subscribe((newOfflineVideoPlaylist: any[]) => {
      this.offlineVideoPlaylist = newOfflineVideoPlaylist;
    });
    this.offlineAudioPlaylist$.subscribe((newOfflineAudioPlaylist: any[]) => {
      this.offlineAudioPlaylist = newOfflineAudioPlaylist;
    });
  }

  initializeOfflineDB(): void {
    this.db = new Dexie('OfflineDB');
    this.db.version(1).stores({
      manifest: 'id, type',
      data: 'uri, id'
    });
    this.connectOfflineDB();
  }

  connectOfflineDB(): void {
    this.db.open().catch((error) => {
      alert("Errod during connecting to database : " + error);
    });
    this.refreshOfflineList();
  }

  async refreshOfflineList() {
    try {
      await this.db.manifest.where("type").equals("audio").toArray().then((list) => {
        const tmp = list.map(item => item.metadata);
        this.offlineAudioPlaylist$.next(tmp);
      });
      await this.db.manifest.where("type").equals("video").toArray().then((list) => {
        const tmp = list.map(item => item.metadata);
        this.offlineVideoPlaylist$.next(tmp);
      })
    } catch (error) {
      console.log(error);
    }
  }

}
