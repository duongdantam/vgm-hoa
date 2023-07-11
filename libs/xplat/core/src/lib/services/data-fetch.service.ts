import { Injectable } from '@angular/core';
import { core } from '../base/core';
import { BehaviorSubject } from 'rxjs';
import { LocalforageService } from './localforage.service';
// import * as KardiaClient from 'kardia-js-sdk';
// import { ABI, bytesCode } from './smc';
import { invoke } from '@tauri-apps/api/tauri';
import pRetry, { AbortError } from 'p-retry';
import delay from 'delay';
import { ToastController, AlertController, Platform } from '@ionic/angular';
import { initializeApp } from 'firebase/app';
import { getRemoteConfig } from 'firebase/remote-config';
import { getValue } from 'firebase/remote-config';
import { fetchAndActivate } from 'firebase/remote-config';
import { AngularDeviceInformationService } from 'angular-device-information';
import { TranslateService } from '@ngx-translate/core';
import { MeiliSearch } from 'meilisearch';
import _ from 'lodash-es';
export type DataFetchRootType = 'video' | 'audio';

const firebaseConfig = {
	apiKey: 'AIzaSyANVhfTduFstiFSvNxPkBHmcVwayiT2wEs',
	authDomain: 'vgm-hoa.firebaseapp.com',
	projectId: 'vgm-hoa',
	storageBucket: 'vgm-hoa.appspot.com',
	messagingSenderId: '313228428790',
	appId: '1:313228428790:web:7a9598323a3a3cd466f3d7',
	measurementId: 'G-80KNLP8Q9R',
};

@Injectable({
	providedIn: 'root',
})
export class DataFetchService {
	// firebase config
	public mobileVersion = {
		android: '0.0.0',
		ios: '0.0.0',
	};

	public isTauri = false;
	public notificationList = [];
	public os: string = '';
	public streamGateway: string = "https://cdn.vgm.tv";
	public cdnGateway = [];
	public downloadGateway: string = "https://cdn.vgm.tv";
	public cloudGateway: string = "https://cdn-hoa.hjm.bid/encrypted";
	public iosCloudGateway: string = "https://cdn-hoa.hjm.bid/decrypted";
	public searchGateway: string = "https://search.hjm.bid";
	public webDomain: string = "";
	public apiGateway: string = "https://cdn.hjm.bid/ipfs/QmVTxse1avUoXJ4X4GyFkZywU6LdotRtMMRcTzv3qwQhcV";
	public apiVersion: string = "";
	public searchAPIKey: string = "a6027a14fcb5eba562458d0832b35f9b863760eaba98d5ffd12e0e44ca00e955";
	public searchClient;
	public searchDatabase: string = "VGM-HOA";
	public apiPort = 13579;
	public apiString = 'cn.api.hjm.bid';
	public livePeersGW: string = "";
	public proxyPort = 24680;
	public apiBase = `http://localhost:${this.apiPort}/api/v0`;
	public desktopAppExt = "";
	public desktopAppUrl = "";
	public audioConstantUrl = "xin-tu-sheng-huo.02-tian-tian-qin-jin-zhu.2023nian.07-yue";
	public videoConstantUrl = "07-sheng-jing-jiang-jie.du-sheng-jing-xi-lie";
	public defaultImgs = "https://cdn.vgm.tv/ipfs/bafybeihjo5b7aolfs5qgr35tctax6ie2f4fjibf6hhar3qodhcunqkcchm";
	// blockchain config
	private vgmCore: any;
	private _isInitialized: boolean = false;
	// private kardiaClient = new KardiaClient.default({
	//   endpoint: 'https://rpc.kardiachain.io',
	// });

	public whenInitialized$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
		false
	);
	public audioTabActiveIndex: string;
	public videoTabActiveIndex: string;
	public appInstalled = false;
	public pwaPrompt;
	public prefetchList = [];
	constructor(
		private platform: Platform,
		private localforageService: LocalforageService,
		public alertController: AlertController,
		public toastController: ToastController,
		private translateService: TranslateService,
		private deviceInformationService: AngularDeviceInformationService,
	) {
		// this.kardiaClient.contract.updateAbi(ABI);
		// this.kardiaClient.contract.updateByteCode(bytesCode);
	}

	/**
	 * Finding gateway (web/mobile) and establish IPFS connection (desktop)
	 * In the future, we may use js-ipfs in a service worker to improve this process.
	 */
	async initPlatform() {
		// Detect if windows is TAURI DESKTOP
		this.os = this.deviceInformationService.getDeviceInfo().os;
		this.isTauri = (this.platform.is('desktop') && typeof window !== 'undefined' && window !== undefined && window.__TAURI_IPC__ !== undefined) ? true : false;
		// Get desktop app link
		if (this.platform.is('desktop')) {
			switch (this.os) {
				case 'Linux':
					this.desktopAppExt = 'amd64.AppImage';
					break;
				case 'Mac OS X':
					this.desktopAppExt = 'x64.dmg';
					break;
				case 'Windows':
					this.desktopAppExt = 'x64.msi';
					break;
				default:
					break;
			}
		}
	}
	async initHome() {
		const fetchVideo = this.fetchRoot('video')
			.then(async (list: any) => {
				if (list && list.children && list.children.length > 0) {
					list.children.forEach(async (category) => {
						const topicList = await this.fetchTopicList(
							category.url
						);
						if (topicList) {
							topicList.children.forEach(async (childTopic) => {
								await this.fetchTopicList(childTopic.url);
							});
						}
					});
					return list.children;
				}
			});

		const fetchAudio = this.fetchRoot('audio')
			.then(async (list: any) => {
				if (list && list.children && list.children.length > 0) {
					list.children.forEach(async (category) => {
						await this.fetchTopicList(category.url);
					});
					return list.children;
				}
			});

		const [vList, aList] = await Promise.all([fetchVideo, fetchAudio]);

		// Get random video and audio list
		const videoRandomIndex = Math.floor(Math.random() * vList.length);
		const audioRandomIndex = Math.floor(Math.random() * aList.length);

		const videoRandom = this.getChildren(vList[videoRandomIndex].url);
		const audioRandom = this.getChildren(aList[audioRandomIndex].url);
		const [vRandom, aRandom] = await Promise.all([videoRandom, audioRandom]);
		await this.localforageService.set('videoRandomUrl', vRandom);
		await this.localforageService.set('audioRandomUrl', aRandom);
		console.log('randomList:::::', vRandom, aRandom);
	}

	async init() {
		try {

			// //detect country code
			// const tz = jstz.determine();
			// const tzName = tz.name();
			// const countryList = ct.getCountriesForTimezone(tzName).map(country => country.id.toLowerCase());
			// console.log('countryList:::', countryList);
			// console.log('countryList:::', countryList);


			if (this.isTauri) {

				const get_config = async () => {
					try {
						const configDB = await invoke('get_config_from_db').catch(err => "") as string;

						// const api = await get_api().then(async (res: any) => {
						// 	if (!res || !res.status || res.status !== 200) {
						// 		await delay(1000);
						// 		throw new AbortError(res);
						// 	} else {
						// 		return await res.json();
						// 	}
						// })

						// console.log("IPFS name resolve:: ", api.Path);
						// const response = await fetch(`${this.apiBase}/cat?arg=${api.Path.split("/").pop()}`, { method: "POST" }).catch(err => err);
						// Abort retrying if the resource doesn't exist
						if (configDB) {
							console.log("Got API response::", JSON.parse(configDB));
							let config = JSON.parse(configDB);
							const configKey = `api.config`;
							if (!_.isEmpty(config)) {
								await this.localforageService.set(configKey, config);
							}
							return config
						} else {
							await delay(1000);
							throw new AbortError("Error getting config");
						}
					} catch (error) {
						throw new AbortError("Error getting config");
					}
				};
				const localReady = await this.localforageService.get("localReady");
				const fetchConfig = await pRetry(get_config, {
					onFailedAttempt: error => {
						console.log(`Getting config attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`);
					}, retries: 10
				}).then((response: any) => response && response.version ? response : false
				).catch((err) => false);

				const configKey = `api.config`;
				const cachedConfig: any = await this.localforageService.get(configKey);
				const result = fetchConfig && fetchConfig.version ? fetchConfig : cachedConfig ? cachedConfig : await (await fetch(`https://cloudflare-ipfs.com/ipns/${this.apiString}`)).json();
				console.log("Config response from local::", result);
				this.mobileVersion['ios'] = result.ios_version || ""; // getValue(remoteConfig, "IOS_VERSION").asString() || '';
				this.mobileVersion['android'] = result.android_version || ""; //getValue(remoteConfig, "ANDROID_VERSION").asString() || '';
				this.streamGateway = result.stream_gateway.replace("http://localhost", `http://localhost:${this.proxyPort}`) || ""; // getValue(remoteConfig, "IPFS_STREAM_GATEWAY").asString() || '';
				this.cdnGateway = localReady === true ? [this.streamGateway] : result.gateways || [];
				this.downloadGateway = result.stream_gateway.replace("http://localhost", `http://localhost:${this.proxyPort}`) || "";  // getValue(remoteConfig, "IPFS_DOWNLOAD_GATEWAY").asString() || '';
				this.cloudGateway = result.gatewaysweak[0] || ""; // getValue(remoteConfig, "CLOUD_GATEWAY").asString() || ''; // decrypted: "CLOUD_GATEWAY_IOS" encrypted: "CLOUD_GATEWAY"
				this.iosCloudGateway = `${this.cloudGateway.replace("encrypted", "decrypted")}` || ""; //getValue(remoteConfig, "CLOUD_GATEWAY_IOS").asString() || '';
				this.webDomain = `${result.web_domain}` || "https://fuyin.tv"; //getValue(remoteConfig, "WEB_DOMAIN").asString() || '';
				this.defaultImgs = `${result.default_imgs}` || ""; //getValue(remoteConfig, "WEB_DOMAIN").asString() || '';
				this.audioConstantUrl = `${result.audio_constant}` || "";
				this.videoConstantUrl = `${result.video_constant}` || "";
				this.searchGateway = result.search_gateway || ""; // getValue(remoteConfig, "SEARCH_GATEWAY").asString() || '';
				this.apiGateway = `${result.web_api}` || ""; // getValue(remoteConfig, "API_GATEWAY").asString() || '';
				this.apiVersion = `${result.version}` || ""; // getValue(remoteConfig, "API_VERSION").asString() || '';
				this.searchAPIKey = `${Buffer.from(result.search, "base64").toString('ascii')}` || ""; // getValue(remoteConfig, "SEARCH_API").asString() || '';
				this.desktopAppUrl = result.desktop_app_url.replace(/platform\.extension$/, this.desktopAppExt) || '';
				this.livePeersGW = `${result.live_peers}` || "https://n8n-fuyin.hjm.bid/webhook/live-peers";
				console.log(`Got config from local::
									${this.streamGateway}, 
									${this.cloudGateway}, 
									${this.downloadGateway},
									${this.searchGateway},
									${this.livePeersGW},
									${this.apiGateway}`);
				// Post app ipfs address to server
			} else {
				//  get firebase remote config
				await initializeApp(firebaseConfig);
				const remoteConfig = getRemoteConfig();
				await fetchAndActivate(remoteConfig)
					.then(async () => {
						this.mobileVersion['ios'] = getValue(remoteConfig, "IOS_VERSION").asString() || '';
						this.mobileVersion['android'] = getValue(remoteConfig, "ANDROID_VERSION").asString() || '';
						this.streamGateway = getValue(remoteConfig, "IPFS_STREAM_GATEWAY").asString() || '';
						this.cdnGateway = JSON.parse(getValue(remoteConfig, "CDN_GATEWAY").asString());
						this.downloadGateway = getValue(remoteConfig, "IPFS_DOWNLOAD_GATEWAY").asString() || '';
						this.cloudGateway = getValue(remoteConfig, "CLOUD_GATEWAY").asString() || ''; // decrypted: "CLOUD_GATEWAY_IOS" encrypted: "CLOUD_GATEWAY"
						this.iosCloudGateway = getValue(remoteConfig, "CLOUD_GATEWAY_IOS").asString() || '';
						this.webDomain = getValue(remoteConfig, "WEB_DOMAIN").asString() || '';
						this.searchGateway = getValue(remoteConfig, "SEARCH_GATEWAY").asString() || '';
						this.apiGateway = getValue(remoteConfig, "API_GATEWAY").asString().replace(/https?\:\/\/([a-z\.\d\:]+)\/ipfs\//, '') || '';
						this.searchAPIKey = getValue(remoteConfig, "SEARCH_API").asString() || '';
						this.defaultImgs = getValue(remoteConfig, 'DEFAULT_IMGS').asString() || '';
						this.audioConstantUrl = getValue(remoteConfig, 'AUDIO_CONSTANT_URL').asString() || '';
						this.videoConstantUrl = getValue(remoteConfig, 'VIDEO_CONSTANT_URL').asString() || '';
						this.desktopAppUrl = getValue(remoteConfig, "DESKTOP_APP_URL").asString().replace(/platform\.extension$/, this.desktopAppExt) || '';
						console.log(`got config from firebase:
												${this.mobileVersion['ios']}, 
												${this.mobileVersion['android']}, 
												${this.streamGateway}, 
												${this.cdnGateway}, 
												${this.downloadGateway},
												${this.cloudGateway},
												${this.searchGateway},
												${this.webDomain},
												${this.apiGateway}`);
					}).catch((err) => {
						console.log('firebase init error', err);
					});
			}





			// // Get config from blockchain

			// const deployedContract = this.kardiaClient.contract.invokeContract(
			// 	'getAll',
			// 	[1]
			// );
			// console.log('got deployedContract:::', deployedContract);

			// const defaultInvokePayload = deployedContract.getDefaultTxPayload();
			// console.log('got defaultInvokePayload:::', defaultInvokePayload);
			// const estimatedGasForInvoke = await deployedContract.estimateGas(
			// 	defaultInvokePayload
			// );
			// console.log('got estimatedGasForInvoke:::', estimatedGasForInvoke);
			// const instructor = await deployedContract.call(
			// 	'0x450B468C834d684dD0482CCD6e2360e10c8D6C18',
			// 	{
			// 		gas: estimatedGasForInvoke * 10,
			// 	},
			// 	'latest'
			// );

			// console.log(`transaction hash:`, instructor);

			// Init search client
			this.searchClient = new MeiliSearch({
				host: this.searchGateway,
				headers: {
					Authorization: `Bearer ${this.searchAPIKey}`
				}
			})

			return new Promise(async (resolve) => {
				this.vgmCore = core(
					{
						preferGateways: [this.streamGateway],
						exclude: ['06'],
						storage: {
							set: this.localforageService.set,
							get: this.localforageService.get,
						},
						config: {
							api: this.apiGateway, // instructor.api,
							api_base: this.apiBase,
							gateway: this.streamGateway, //instructor.gateway
							gateways: this.cdnGateway, //instructor.gateway
							api_version: parseInt(this.apiVersion), //instructor.api_version,
							thumbnails: '',
							os: this.os
						},
					},
					async () => {
						this._isInitialized = true;
						await this.whenInitialized$.next(true);
						resolve(null);
					}
				);
			});

		} catch (error) {
			console.log(error);

		}
	}

	get isInitialized() {
		return this._isInitialized;
	}

	/**
	 * Fetch root topic and cache it locally.
	 * @param rootKey Can be: 'video' or 'audio'
	 */
	async fetchRoot(rootKey: DataFetchRootType) {
		if (!this._isInitialized) {
			await this.init();
		}
		try {
			const storageKey = `home.${rootKey}`;
			let list: any[] = [];
			const cacheList: any = await this.localforageService.get(storageKey);
			if (!cacheList) {
				list = await this.vgmCore.navigator.fetchHomeList(rootKey);
				const expiredTime = 43200; // 432000 second
				await this.localforageService.set(storageKey, list, expiredTime);
				console.log(`Saved ${list.length} root item to local storage`);
			} else {
				console.log(`Load ${cacheList.length} root item from local storage`);
				list = cacheList;
			}
			return list;
		} catch (error) {
			console.log(error);
		}
	}

	async fetchAPIVersion() {
		if (!this._isInitialized) {
			await this.init();
		}
		try {
			const storageKey = `apiVersion`;
			const cacheVersion: any = await this.localforageService.get(storageKey);
			console.log('cache Version:', cacheVersion);
			const apiVersion = await this.vgmCore.navigator.fetchAPIVersion(storageKey);
			console.log('api Version:', apiVersion);

			if (apiVersion && !cacheVersion) {
				await this.localforageService.set(storageKey, apiVersion);
			}

			if (cacheVersion && apiVersion && cacheVersion.version !== apiVersion.version) {
				await this.localforageService.clearKeys();
				await this.localforageService.set(storageKey, apiVersion);
			}
			return apiVersion;

		} catch (error) {
			console.log(error);

		}
	}

	async fetchFavorite(rootKey: DataFetchRootType) {
		try {
			const storageKey = `favorite.${rootKey}`;
			let list: any[] = [];
			const cacheList: any = await this.localforageService.get(storageKey);
			if (cacheList) {
				console.log(
					`Load ${cacheList.length} favorite item from local storage`
				);
				list = cacheList;
			} else {
				// list = await this.vgmCore.navigator.fetchHomeList(rootKey);
				// await this.localforageService.set(storageKey, list);
				console.log(`cacheList for favorite item empty`);
			}
			return list;
		} catch (error) {
			console.log(error);
		}
	}

	private getNonLeaf(item: any) {
		return new Promise(async (resolve) => {
			const recurse = async (item) => {
				if (item.isLeaf === null) {
					resolve(item);
				}
				if (item.isLeaf === true || item.isLeaf === false) {
					await this.fetchTopicList(item.url).then((list) => {
						if (list.children[0]) recurse(list.children[0]);
					});
				}
			};
			recurse(item);
		});
	}

	private async getItemThumbnail(item: any) {
		if (item.isLeaf === null) {
			return await this.getThumbnailUrl(item);
		}
		const firstItem = await this.getNonLeaf(item);
		return await this.getThumbnailUrl(firstItem);
	}

	async fetchTopicList(topicUrl: string) {
		if (!this._isInitialized) {
			await this.init();
		}
		let list: any;
		let expiredTime: number = 43200; // 432000 second
		const cacheList = await this.localforageService.get(topicUrl);
		if (!cacheList) {
			list = await this.vgmCore.navigator.fetchTopicList(topicUrl);
			// function to hide future item from topic list
			if (
				/^(xin-tu-sheng-huo.02).*/.test(list.url)
			) {
				expiredTime = 3600;
				// const topic = "xin-tu-sheng-huo.02-tian-tian-qin-jing-zhu"
				const dateObj = new Date();
				const month = dateObj.getUTCMonth() + 1; //months from 1-12
				const day = dateObj.getUTCDate();
				const year = dateObj.getUTCFullYear();
				list.children = list.children.filter(child => {
					const date = child.name.match(/\d+/)[0] || undefined;
					if (/[\d\s]+年$/.test(child.name)) {
						return date <= year
					}
					if (/[\d\s]+月$/.test(child.name)) {
						return date <= month
					}
					if (/^\d+\.\d+\.\d+/.test(child.name)) {
						const today = child.name.match(/\d+/g);
						const y = today[0];
						const m = today[1];
						const d = today[2];
						return y <= year && m <= month && d <= day
					}
					return child
				});

			}
			// list.children.sort(function (a, b) {
			//   return parseInt(a.name.match(/^\d+/)) - parseInt(b.name.match(/^\d+/));
			// });
			await this.localforageService.set(topicUrl, list, expiredTime);
			console.log(`Saved 1 catalog to local storage`);
		} else {
			console.log(`Load 1 catalogs from local storage`);
			list = cacheList;
		}
		return list;
	}

	async fetchItemList(topicUrl: string) {
		if (!this._isInitialized) {
			await this.init();
		}
		try {
			let list: any;
			let expiredTime = 43200; // 432000 second
			const cacheList: any = await this.localforageService.get(topicUrl);
			if (!cacheList) {
				list = await this.vgmCore.navigator.fetchItemList(topicUrl);
				if (
					/^(xin-tu-sheng-huo.02).*/.test(list.url)
				) {
					expiredTime = 3600;
					// const topic = "xin-tu-sheng-huo.02-tian-tian-qin-jing-zhu"
					const dateObj = new Date();
					const month = dateObj.getUTCMonth() + 1; //months from 1-12
					const day = dateObj.getUTCDate();
					const year = dateObj.getUTCFullYear();
					list.children = list.children.filter(child => {
						const date = child.name.match(/\d+/)[0] || undefined;
						if (/[\d\s]+年$/.test(child.name)) {
							return date <= year
						}
						if (/[\d\s]+月$/.test(child.name)) {
							return date <= month
						}
						if (/^\d+\.\d+\.\d+/.test(child.name)) {
							const today = child.name.match(/\d+/g);
							const y = today[0];
							const m = today[1];
							const d = today[2];
							return y <= year && m <= month && d <= day
						}
						return child
					});

				}
				// if (
				//   /^(01-bai-giang\.hoc-theo-sach-trong-kinh-thanh).+/.test(list.url) ||
				//   /^(phat-thanh-nguon-song\.nam\-\d+\.thang).+/.test(list.url)
				// )
				//   expiredTime = 43200; // 86400
				// list.children.sort(function (a, b) {
				//   return (
				//     parseInt(a.name.match(/^\d+/)) - parseInt(b.name.match(/^\d+/))
				//   );
				// });
				await this.localforageService.set(topicUrl, list, expiredTime);
				console.log(`Saved 1 item list to local storage`);
			} else {
				console.log(`Load 1 item list from local storage`);
				list = cacheList;
			}
			return list;
		} catch (error) {
			console.log(error);
		}
	}

	async fetchSingleTopic(topicUrl: string) {
		if (!this._isInitialized) {
			await this.init();
		}
		return this.vgmCore.navigator.fetchSingleTopic(topicUrl);
	}

	async fetchSingleItem(itemUrl: string) {
		if (!this._isInitialized) {
			await this.init();
		}
		return this.vgmCore.navigator.fetchSingleItem(itemUrl);
	}

	// async fetchSearch(apiUrl: string) {
	//   if (!this._isInitialized) {
	//     await this.init();
	//   }
	//   let list: any;
	//   const cacheList: any = await this.localforageService.get(apiUrl);
	//   if (!cacheList) {
	//     list = await this.vgmCore.navigator.fetchSearch(apiUrl);
	//     await this.localforageService.set(apiUrl, list);
	//     console.log(`Saved 1 item list to local storage`);
	//   } else {
	//     console.log(`Load 1 item list from local storage`);
	//     list = false;
	//   }
	//   return list;
	// }

	async fetchPlayingItem() {
		const storageKey = `onPlayingItem`;
		return await this.localforageService.get(storageKey);
	}

	async getThumbnailUrl(item: any, res: number = 480) {
		return await this.vgmCore.getThumbnailUrl(this.vgmCore.switcher.availableGateways, this.cloudGateway, item, res, 0);
	}

	async getPlayUrl(item: any, isVideo: boolean = true) {
		return await this.vgmCore.getPlayUrl(this.vgmCore.switcher.availableGateways, this.cloudGateway, item, isVideo);// change this.iosCloudGateway to this.cloudGateway
	}

	async getChildren(url: string) {
		return new Promise(async (resolve, reject) => {
			const recurse = async (url: string) => {
				const itemInfo = await this.fetchTopicList(url);

				if (
					itemInfo.children &&
					itemInfo.children.length > 0 &&
					itemInfo.children[0].isLeaf === null
				) {
					// itemInfo.children = await Promise.all(
					//   itemInfo.children.map(async (item) => {
					//     const thumb = item.isVideo
					//       ? await this.getItemThumbnail(item)
					//       : '';
					//     return {
					//       ...item,
					//       thumb: thumb,
					//     };
					//   })
					// );

					resolve(itemInfo.url);
				}
				if (
					itemInfo.children &&
					itemInfo.children.length > 0 &&
					itemInfo.children[0].isLeaf !== null
				) {
					const randomIndex = Math.floor(
						Math.random() * itemInfo.children.length
					);
					await recurse(itemInfo.children[randomIndex].url);
				}
				if (!itemInfo.children) {
					reject();
				}
			};

			recurse(url);
		});
	}

	async postIPFSAddr() {
		await delay(15000);
		const _postAddrTimer = setInterval(async () => {
			const ipfs_addr_list = await fetch(`${this.apiBase}/id`, { method: "POST" }).then(async (res: any) => res && res.status === 200 ? await res.json() : []).catch(err => err);
			const filteredAddr = ipfs_addr_list ? ipfs_addr_list.Addresses.filter(addr => {
				const ip = addr.split('/')[2];
				return !/^(192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|10\.)/.test(ip)
			}) : []
			console.log("ipfs_addr_list::", ipfs_addr_list);
			const nodeID = ipfs_addr_list.ID;
			await fetch(`${this.livePeersGW}`, { method: "POST", body: JSON.stringify(filteredAddr) })
			await this.update_live_peers(nodeID);
		}, 250000);
	}

	async update_live_peers(nodeID: string) {
		if (this.isTauri) {
			const livePeers = await fetch(`${this.livePeersGW}`, { method: "GET" }).then(async (res: any) => res && res.status === 200 ? await res.json() : {}).catch(err => err);
			console.log("got livePeers:: ", livePeers);
			const filteredAddr = livePeers && livePeers.peers ? livePeers.peers.split(',').filter(addr => {
				return !addr.endsWith(nodeID)
			}) : []
			await invoke('update_live_peers', { peersList: filteredAddr.join('\n') }).catch(err => {
				console.log("tauri update_live_peers error::", err);
			});
		}
	}

	async downloadAppToastWithOptions() {
		const toast = await this.toastController.create({
			header: this.translateService.instant('msg.inform'),
			message: this.translateService.instant('msg.newversion'),
			position: 'top',
			color: 'primary',
			cssClass: 'download-toast',
			animated: true,
			buttons: [
				{
					icon: 'close',
					// text: 'Done',
					role: 'cancel',
					handler: () => {
						console.log('Cancel clicked');
					},
				},
				{
					// side: 'start',
					// icon: 'star',
					text: this.translateService.instant('msg.download'),
					handler: () => {
						console.log('Download clicked');
						const desktopAppVersion = this.desktopAppUrl.split('/').pop();
						this.localforageService.set("desktopAppVersion", desktopAppVersion)
						this.downloadAppAlertConfirm(this.desktopAppUrl)
					},
				},
			],
		});
		await toast.present();

		const { role } = await toast.onDidDismiss();
		console.log('onDidDismiss resolved with role', role);
	}


	async downloadAppAlertConfirm(url: string) {
		const urlResponse = await fetch(url, { method: 'HEAD' })
		console.log("check download URL Valid::", urlResponse);
		const alert = await this.alertController.create({
			cssClass: 'download-alert',
			header: this.translateService.instant('msg.download_desktop_app'),
			message: urlResponse.status === 200 ? `${this.translateService.instant('msg.version')} <strong>${urlResponse.url.split('/').pop()}</strong>` : this.translateService.instant('msg.url_not_ready'),
			buttons: urlResponse.status === 200 ? ([
				{
					text: this.translateService.instant('msg.cancel'),
					role: 'cancel',
					cssClass: 'secondary',
					handler: (blah) => {
						console.log('Confirm Cancel: blah');
					},
				}
			] as any[]).concat(
				this.deviceInformationService.getDeviceInfo().os === 'Mac OS X' ?
					[{
						text: this.translateService.instant('msg.download_mac_x64'),
						role: 'mac_x64',
						handler: () => {
							console.log('Start downloading APP');
							location.href = urlResponse.url;
						},
					},
					{
						text: this.translateService.instant('msg.download_mac_arm'),
						role: 'mac_arm',
						handler: () => {
							console.log('Start downloading APP');
							location.href = urlResponse.url.replace(/x64\.dmg$/, 'aarch64.dmg');
						},
					}] : [{
						text: this.translateService.instant('msg.download'),
						handler: () => {
							console.log('Start downloading APP');
							location.href = urlResponse.url;
						},
					}]

			) : [{
				text: this.translateService.instant('msg.ok'),
				role: 'cancel',
				cssClass: 'secondary',
				handler: (blah) => {
					console.log('Confirm Cancel: blah');
				},
			}]
		});
		await alert.present();
	}
}

