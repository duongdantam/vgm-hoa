import Dexie from 'dexie';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AlertController, Platform, ToastController } from '@ionic/angular';
import { DataFetchService } from './data-fetch.service';
import { QueueService } from './queue.service';
import M3U8FileParser from 'm3u8-file-parser';
import * as path from 'path';
import { TranslateService } from '@ngx-translate/core';
import { invoke } from '@tauri-apps/api/tauri';
import { getPlayHash } from '../base/crypto';
@Injectable({
	providedIn: 'root',
})
export class OfflineService {
	db: any;
	public offlineVideoPlaylist: any[] = [];
	public offlineVideoPlaylistID: any[] = [];
	public offlineVideoPlaylist$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
	public offlineAudioPlaylist: any[] = [];
	public offlineAudioPlaylistID: any[] = [];
	public offlineAudioPlaylist$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
	constructor(
		private platform: Platform,
		private dataFetchService: DataFetchService,
		private queueService: QueueService,
		public toastController: ToastController,
		public alertController: AlertController,
		private translateService: TranslateService
	) {
		this.offlineVideoPlaylist$.subscribe((newOfflineVideoPlaylist: any[]) => {
			this.offlineVideoPlaylist = newOfflineVideoPlaylist;
			this.offlineVideoPlaylistID = newOfflineVideoPlaylist.map((item) => (item.id));
		});
		this.offlineAudioPlaylist$.subscribe((newOfflineAudioPlaylist: any[]) => {
			this.offlineAudioPlaylist = newOfflineAudioPlaylist;
			this.offlineAudioPlaylistID = newOfflineAudioPlaylist.map((item) => (item.id));
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

	async updateOfflineSize(newSize: number = 0, method = 'add') {
		const mediaSize = this.dataFetchService.isTauri ? newSize : newSize * 0.6;
		const currentSize = await this.db.data.get("offline-size");
		let size = currentSize && currentSize.data ? currentSize.data : 0;
		size = method === 'add' ? size + mediaSize : size - mediaSize;
		size = size > 0 ? size : 0;
		await this.db.data.put({ uri: 'offline-size', data: size });
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


	async removeOfflineDB(item) {
		await this.db.manifest.where('id').equals(item.id).delete();
		await this.updateOfflineSize(parseInt(item.size), 'sub');
		await this.offlineTreeDBRecursive(item.url, 'sub');
		if (this.platform.is('capacitor') && this.platform.is('ios')) {
			// remove native local data
			// const dirExist = await this.file.checkDir(this.file.dataDirectory, item.url);
			// if (dirExist) await this.file.removeRecursively(this.file.dataDirectory, item.url);
		} else {
			// remove indexeddb data
			await this.db.data.where('id').equals(item.id).delete();
			// if (this.dataFetchService.isTauri && streamHash) {
			// const streamHash = getPlayHash(item.url, item.hash);
			// 	await invoke('unpin_ipfs', { hash: streamHash }).catch(err => console.log(err));
			// 	// await fetch(`${this.dataFetchService.apiBase}/pin/rm?arg=${getPlayHash(item.url, item.hash)}`, { method: "POST" });
			// }
		}
	}

	async onVideoDownload(item, quality: string = '480p', background: boolean = false) {
		console.log('onDownload clicked', item);
		if (!background) {
			this.queueService.downloadingList.push(item);
		}
		try {
			// if (this.platform.is('capacitor') && this.platform.is('ios')) {
			// await this.file.createDir(this.file.dataDirectory, item.url, true);
			// await this.file.createDir(this.file.dataDirectory, `${item.url}/${quality}`, true);
			// }

			const downloadQuality = quality;
			let downloadedFile = 0;
			let playUrl = await this.dataFetchService.getPlayUrl(item, true);

			const itemDir = path.dirname(playUrl);
			// const getKey = await this.offlineService.db.manifest.get({ id: this.playingItem.id });
			// // console.log(playUrl, getKey);
			// if (!getKey) {
			// if (!this.isDownloading) {
			this.queueService.downloadProgress = 0.5;
			// this.isDownloading = true;
			const reader = new M3U8FileParser();
			const pUrl = item.url.match(/.*(?=\.)/).toString();
			const pItem = await this.dataFetchService.fetchTopicList(pUrl);
			item.pid = pItem.id;
			item.pname = pItem.name;
			item.size = this.dataFetchService.isTauri ? await invoke('check_size', { hash: `${getPlayHash(item.url, item.hash)}/${downloadQuality}` }).then((res: string) => res ? res.replace(/\D+/, '') : item.size).catch(err => item.size) : item.size;
			// // Download playlist.m3u8
			await this.downloadData(itemDir, path.basename(playUrl), 'playlist', item);
			// await this.offlineService.db.data.put({ uri: playUrl, data: masterM3u8AB, m3u8: 'playlist', id: item.id });
			const segment = `${downloadQuality}.m3u8`;
			const segmentUrl = `${itemDir}/${segment}`;
			const segmentM3u8TXT = await (await fetch(segmentUrl)).text();
			// // Download quality.m3u8
			await this.downloadData(itemDir, segment, 'segment', item);
			// await this.offlineService.db.data.put({ uri: segmentUrl, data: segmentM3u8AB, m3u8: 'segment', id: item.id });
			// const enc = new TextDecoder("utf-8");
			// const m3u8txt = await enc.decode(segmentM3u8AB);
			await reader.read(segmentM3u8TXT);
			const m3u8 = await reader.getResult();
			// const keyUri = /^http.*/.test(m3u8.segments[0].key.uri) ? m3u8.segments[0].key.uri : `${itemDir}/${m3u8.segments[0].key.uri}`;
			// const segmentM3u8 = segmentM3u8TXT.replace(m3u8.segments[0].key.uri, 'key.vgmk');
			// await this.offlineService.downloadData(itemDir, `${downloadQuality}.m3u8`, segmentM3u8, 'segment', item);
			// // Download key.vgmk
			await this.downloadData(itemDir, m3u8.segments[0].key.uri, 'key', item);
			// await this.offlineService.db.data.put({ uri: keyUri, data: keyAB, id: item.id});

			let tasks = [];
			if (!background) {
				for (let i = 0; i < m3u8.segments.length; i++) { // list.length or endPoint
					tasks.push(async () => {
						await this.downloadData(itemDir, `${m3u8.segments[i].url}`, 'data', item);
						downloadedFile++;
						this.queueService.downloadProgress = Math.round(downloadedFile * 100 / m3u8.segments.length);
						console.log('downloaded', m3u8.segments[i].url, i, '/', m3u8.segments.length);
					});
				}
			}

			await Promise.all(tasks.map(task => this.queueService.downloadQueue.add(task))).then(async () => {
				console.log('all task finish');
				console.log('download done', downloadedFile, m3u8.segments.length);
				if (background || (downloadedFile === m3u8.segments.length)) {
					await this.db.manifest.put({ id: item.id, type: 'video', metadata: item, quality: downloadQuality });
					await this.checkMediaIsDownloaded(item).then((isDownloaded) => {
						if (isDownloaded) {
							if (!background) {
								this.presentToast(`${this.translateService.instant('msg.video.download')}: ${item.name}`);
							}
							const index = this.queueService.downloadingList.findIndex(result => result.id === item.id);
							if (index > -1) {
								this.queueService.downloadingList.splice(index, 1);
							}
							// this.isDownloading = false;
							this.queueService.downloadProgress = 0;
							downloadedFile = 0;
						};
					});
					await this.updateOfflineSize(parseInt(item.size), 'add');
					await this.offlineTreeDBRecursive(item.url, 'add')
					this.refreshOfflineList();
				}
			});

			// } else {
			// 	this.isDownloading = false;
			// 	this.queueService.vDownloadQueue.clear();
			// 	// console.log('clear queue called');
			// 	this.queueService.downloadProgress = 0;
			// 	await this.offlineService.db.data.where('id').equals(item.id).delete();
			// }
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



	async onAudioDownload(item, background = false) {
		try {
			if (!background) {
				this.queueService.downloadingList.push(item);
			}
			let playUrl = await this.dataFetchService.getPlayUrl(item, false);
			if (playUrl.includes('/ipfs/')) {
				playUrl = playUrl.replace(/.*(?=\/ipfs.*)/, this.dataFetchService.downloadGateway);
			}
			const itemDir = path.dirname(playUrl);
			// const getKey = await this.offlineService.db.manifest.get({ id: item.id });
			let downloadedFile = 0;
			// if (!getKey) {

			const pUrl = item.url.match(/.*(?=\.)/).toString();
			const pItem = await this.dataFetchService.fetchSingleTopic(pUrl);
			item.pid = pItem.id;
			item.pname = pItem.name;
			item.size = this.dataFetchService.isTauri ? await invoke('check_size', { hash: getPlayHash(item.url, item.hash) }).then((res: string) => res ? res.replace(/\D+/, '') : item.size).catch(err => item.size) : item.size;

			// const m3u8AB = await (await fetch(playUrl)).arrayBuffer();

			const segmentM3u8TXT = await (await fetch(playUrl)).text();
			// // download 128p.m3u8
			await this.downloadData(itemDir, path.basename(playUrl), 'playlist', item);
			// const enc = new TextDecoder("utf-8");
			const reader = new M3U8FileParser();
			// const m3u8txt = enc.decode(m3u8AB);
			await reader.read(segmentM3u8TXT);
			const m3u8 = await reader.getResult();
			console.log('onDownload clicked', m3u8.segments);
			// const keyUri = /^http.*/.test(m3u8.segments[0].key.uri) ? m3u8.segments[0].key.uri : `${itemDir}/${m3u8.segments[0].key.uri}`;
			// const keyAB = await (await fetch(keyUri)).arrayBuffer();
			// // download key.vgmk
			await this.downloadData(itemDir, m3u8.segments[0].key.uri, 'key', item);
			let tasks = [];
			if (!background) {
				for (let i = 0; i < m3u8.segments.length; i++) { // list.length or endPoint
					tasks.push(async () => {
						await this.downloadData(itemDir, `${m3u8.segments[i].url}`, 'data', item);
						downloadedFile++;
						console.log(m3u8.segments[i].url);
						this.queueService.downloadProgress = Math.round(downloadedFile * 100 / m3u8.segments.length);
						console.log('downloaded', m3u8.segments[i].url, i, '/', m3u8.segments.length);
					});
				}
			}

			await Promise.all(tasks.map(task => this.queueService.downloadQueue.add(task))).then(async () => {
				console.log('all task finish');
				console.log('download done', downloadedFile, m3u8.segments.length);
				if (background || (downloadedFile === m3u8.segments.length)) {
					await this.db.manifest.put({ id: item.id, type: 'audio', metadata: item });
					await this.checkAudioDownloadedList().then((isDownloaded) => {
						if (isDownloaded.indexOf(item.id) > -1) {
							if (!background) {
								this.presentToast(`${this.translateService.instant('msg.audio.download')}: ${item.name}`);
							}
							const index = this.queueService.downloadingList.findIndex(result => result.id === item.id);
							if (index > -1) {
								this.queueService.downloadingList.splice(index, 1);
							}
							// this.isDownloading = false;
							this.queueService.downloadProgress = 0;
							downloadedFile = 0;
						};
					});
					await this.updateOfflineSize(parseInt(item.size), 'add');
					await this.offlineTreeDBRecursive(item.url, 'add')
					this.refreshOfflineList();
				}
			});
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

	}


	async downloadData(dir, file, type, item) {
		return new Promise(async (resolve, reject) => {
			try {
				const uri = `${dir.replace(/.*(?=\/encrypted\/.*)/, '').replace(/.*(?=\/ipfs\/.*)/, '')}/${file}`;
				if (this.platform.is('capacitor') && this.platform.is('ios')) {
					// await this.file.writeFile(this.file.dataDirectory, `${item.url}/${file}`, data, { replace: true })
				} else if (this.dataFetchService.isTauri) {
					// If platform is tauri - Store data to IPFS
					await fetch(`${this.dataFetchService.apiBase}/pin/add?arg=${uri}`, { method: "POST" })
				} else {

					// If other remaining platform - Store data to IndexDB
					const data = await (await fetch(`${dir}/${file}`)).arrayBuffer();
					await this.db.data.put({ uri: uri, data: data, type: type, id: item.id });
				}
				resolve('done');
			} catch (error) {
				resolve('done');
			}
		})
	}

	async checkAudioDownloadedList() {
		return await this.db.manifest.where("type").equals("audio").primaryKeys();
	}
	async checkMediaIsDownloaded(item) {
		return this.db.manifest.get({ id: item.id }).then(result => { if (result) return true; else return false; });
	}


	async updateOfflineTree(url: string, isLeaf: boolean, pUrl: string | undefined, method = 'add') {
		console.log("processing URL:", url, isLeaf, pUrl);
		if (method === 'add') {
			if (isLeaf) {
				await this.db.manifest.put({ id: url, data: true });
			}
			if (pUrl) {
				let pItem = await this.db.manifest.get(pUrl);
				if (!pItem || !pItem.data) {
					pItem = {};
					pItem.data = [url]
				}
				if (pItem.data.indexOf(url) < 0) {
					pItem.data.push(url)
				}
				console.log("pItem.data::", pItem.data);
				await this.db.manifest.put({ id: pUrl, data: pItem.data });
			}
		}
		if (method === 'sub') {
			console.log("deleting offlineTreeDBRecursive called::", url);
			if (isLeaf) {
				await this.db.manifest.where('id').equals(url).delete();
			}
			const selfItem = await this.db.manifest.get(url);
			console.log("selfItem::", url, selfItem);
			const pItem = pUrl ? await this.db.manifest.get(pUrl) : undefined;
			if (pItem && pItem.data && !selfItem) {
				const index = pItem.data.indexOf(url);
				if (index > -1) {
					pItem.data.splice(index, 1);
				}
				console.log("pItem.data::", pItem.data);
				if (pItem.data.length > 0) {
					await this.db.manifest.put({ id: pUrl, data: pItem.data });
				} else {
					const deletion = await this.db.manifest.where('id').equals(pUrl).delete();
					console.log("deleting pItem::", deletion);
				}
			}
		}
	}

	async offlineTreeDBRecursive(url: string, method: string = 'add') {

		// Store offline db status to IndexDB
		const pList = this.getPItemList(url).reverse();
		console.log("testing offlineTreeDBRecursive::", pList);
		for await (const i of pList.keys()) {
			const url = pList[i];
			const pUrl = pList[i + 1];
			const isLeaf = i === 0 ? true : false;
			await this.updateOfflineTree(url, isLeaf, pUrl, method);
		}
	}

	private getPItemList(input, pushPoint = 0) {
		const parts = input.split(".");
		const output = [];
		let currentPath = "";
		for (let i = 0; i < parts.length; i++) {
			currentPath += (i > 0 ? "." : "") + parts[i];
			if (i >= pushPoint) {
				output.push(currentPath);
			}
		}
		return output;
	}

	formatByte(bytes: number): string {
		if (!+bytes) return '0 Bytes'
		const decimals = 2;
		const k = 1024
		const dm = decimals < 0 ? 0 : decimals
		const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
	}

	async downloadMediaAlertConfirm(item) {
		const fhdSize: any = item.isVideo && this.dataFetchService.isTauri ? await invoke('check_size', { hash: `${getPlayHash(item.url, item.hash)}/1080p` }).then((res: string) => res ? res.replace(/\D+/, '') : item.size).catch(err => item.size * 0.3) : item.size * 0.3;
		const hdSize: any = item.isVideo && this.dataFetchService.isTauri ? await invoke('check_size', { hash: `${getPlayHash(item.url, item.hash)}/720p` }).then((res: string) => res ? res.replace(/\D+/, '') : item.size).catch(err => item.size * 0.15) : item.size * 0.15;
		const sdSize: any = item.isVideo && this.dataFetchService.isTauri ? await invoke('check_size', { hash: `${getPlayHash(item.url, item.hash)}/480p` }).then((res: string) => res ? res.replace(/\D+/, '') : item.size).catch(err => item.size * 0.1) : item.size * 0.1;
		const audioSize: any = !item.isVideo && this.dataFetchService.isTauri ? await invoke('check_size', { hash: `${getPlayHash(item.url, item.hash)}` }).then((res: string) => res ? res.replace(/\D+/, '') : item.size).catch(err => item.size * 0.5) : item.size * 0.5;
		const alert = await this.alertController.create({
			cssClass: 'download-alert',
			header: item.isVideo ? this.translateService.instant('button.choose_quality') : this.translateService.instant('button.download'),
			message: item.isLeaf === null ? `${this.translateService.instant('button.download_media')}: ${item.name}` : `${this.translateService.instant('button.download_list')}:  <Strong>${item.name}</Strong>`,
			buttons: (
				item.isVideo ?
					[{
						role: '1080p',
						text: `1080p (~${this.formatByte(parseInt(fhdSize))})`,
						handler: () => {
							console.log('Downloading 1080p');
						},
					},
					{
						role: '720p',
						text: `720p (~${this.formatByte(parseInt(hdSize))})`,
						handler: () => {
							console.log('Downloading 720p');
						},
					},
					{
						role: '480p',
						text: `480p (~${this.formatByte(parseInt(sdSize))})`,
						handler: () => {
							console.log('Downloading 480p');
						},
					}] : [{
						role: '128p',
						text: `${this.translateService.instant('msg.download.download')} (~${this.formatByte(parseInt(audioSize))})`,
						handler: () => {
							console.log('Downloading 128p');
						},
					}] as any
			).concat([
				{
					text: this.translateService.instant('msg.cancel'),
					role: 'cancel',
					cssClass: 'secondary',
					handler: (blah) => {
						console.log('Confirm Cancel: blah');
					},
				}
			]),
		});
		await alert.present();
		return await alert.onDidDismiss();
	}

	async removeMediaAlertConfirm(item) {
		const alert = await this.alertController.create({
			cssClass: 'delete-alert',
			header: this.translateService.instant('msg.delete_list'),
			message: (item.isLeaf === null ? item.isVideo ? `${this.translateService.instant('tabs.video')}: ` : `${this.translateService.instant('tabs.audio')}: ` : `${this.translateService.instant('msg.media_list')}: `) +
				`<Strong>${item.name}</Strong>`,
			buttons: [
				{
					text: this.translateService.instant('msg.ok'),
					role: 'ok',
					handler: (blah) => {
						console.log('Confirm Ok: blah');
					},
				},
				{
					text: this.translateService.instant('msg.cancel'),
					cssClass: 'secondary',
					role: 'cancel',
					handler: (blah) => {
						console.log('Confirm Cancel: blah');
					},
				}
			]
		});
		await alert.present();
		return await alert.onDidDismiss();
	}

	async presentToast(message) {
		const toast = await this.toastController.create({
			message: message,
			position: 'top',
			duration: 2000,
			cssClass: 'toast-info'
		});
		toast.present();
	}

}
