import { Injectable } from '@angular/core';
import PQueue from 'p-queue';
import { DataFetchService } from './data-fetch.service';
@Injectable({
  providedIn: 'root',
})
export class QueueService {
  queue = new PQueue({ concurrency: 20 });
  vDownloadQueue = new PQueue({ concurrency: 5 });
  aDownloadQueue = new PQueue({ concurrency: 5 });
  constructor(
    private dataFetchService: DataFetchService
  ) {
    this.vDownloadQueue.on('active', () => {
      this.dataFetchService.downloading = true;
    });
    this.vDownloadQueue.on('idle', () => {
      this.dataFetchService.downloading = false;
    });
    this.aDownloadQueue.on('active', () => {
      this.dataFetchService.downloading = true;
    });
    this.aDownloadQueue.on('idle', () => {
      this.dataFetchService.downloading = false;
    });
  }
}
