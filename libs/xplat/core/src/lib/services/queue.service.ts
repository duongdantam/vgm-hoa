import { Injectable } from '@angular/core';
import PQueue from 'p-queue';
@Injectable({
	providedIn: 'root',
})
export class QueueService {
	queue = new PQueue({ concurrency: 20 });
	tauriQueue = new PQueue({ concurrency: 1 });
	downloadQueue = new PQueue({ concurrency: 5 });
	// vDownloadQueue = new PQueue({ concurrency: 5 });
	// aDownloadQueue = new PQueue({ concurrency: 5 });
	downloading = false;
	downloadProgress = 0;
	downloadingList = [];
	constructor() {
		this.downloadQueue.on('active', () => {
			this.downloading = true;
		});
		this.downloadQueue.on('idle', () => {
			this.downloading = false;
		});
	}
}
