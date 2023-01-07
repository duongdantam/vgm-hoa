import { Injectable } from '@angular/core';
import { core } from '../base/core';
import { BehaviorSubject } from 'rxjs';
import { LocalforageService } from './localforage.service';
import * as KardiaClient from 'kardia-js-sdk';
import { ABI, bytesCode } from './smc';

import { initializeApp } from 'firebase/app';
import { getRemoteConfig } from 'firebase/remote-config';
import { getValue } from 'firebase/remote-config';
import { fetchAndActivate } from 'firebase/remote-config';
import { MeiliSearch } from 'meilisearch';

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
  public streamGateway: string;
  public downloadGateway: string;
  public cloudGateway: string;
  public iosCloudGateway: string;
  public searchGateway: string;
  public webDomain: string;
  public apiGateway: string;
  public searchAPIKey: string;
  public audioConstantUrl: string;
  public videoConstantUrl: string;
  public audioRandomUrl: string;
  public videoRandomUrl: string;
  public defaultImgs: string;
  public searchClient;
  public searchDatabase: string = 'VGM-HOA';
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
  public downloading = false;
  public prefetchList = [];
  constructor(private localforageService: LocalforageService) {
    // this.kardiaClient.contract.updateAbi(ABI);
    // this.kardiaClient.contract.updateByteCode(bytesCode);
  }

  /**
   * Finding gateway (web/mobile) and establish IPFS connection (desktop)
   * In the future, we may use js-ipfs in a service worker to improve this process.
   */
  async init() {
    // get firebase remote config
    await initializeApp(firebaseConfig);
    const remoteConfig = getRemoteConfig();
    await fetchAndActivate(remoteConfig)
      .then(() => {
        this.mobileVersion['ios'] =
          getValue(remoteConfig, 'IOS_VERSION').asString() || '';
        this.mobileVersion['android'] =
          getValue(remoteConfig, 'ANDROID_VERSION').asString() || '';
        this.streamGateway =
          getValue(remoteConfig, 'IPFS_STREAM_GATEWAY').asString() || '';
        this.downloadGateway =
          getValue(remoteConfig, 'IPFS_DOWNLOAD_GATEWAY').asString() || '';
        this.cloudGateway =
          getValue(remoteConfig, 'CLOUD_GATEWAY').asString() || ''; // decrypted: "CLOUD_GATEWAY_IOS" encrypted: "CLOUD_GATEWAY"
        this.iosCloudGateway =
          getValue(remoteConfig, 'CLOUD_GATEWAY_IOS').asString() || '';
        this.webDomain = getValue(remoteConfig, 'WEB_DOMAIN').asString() || '';
        this.searchGateway =
          getValue(remoteConfig, 'SEARCH_GATEWAY').asString() || '';
        // this.apiGateway = 'https://cdn.vgm.tv/encrypted/API'; // getValue(remoteConfig, "API_GATEWAY").asString() || '';
        this.apiGateway =
          getValue(remoteConfig, 'API_GATEWAY').asString() || '';
        this.searchAPIKey =
          getValue(remoteConfig, 'SEARCH_API').asString() || '';
        this.audioConstantUrl =
          getValue(remoteConfig, 'AUDIO_CONSTANT_URL').asString() || '';
        this.videoConstantUrl =
          getValue(remoteConfig, 'VIDEO_CONSTANT_URL').asString() || '';
        this.defaultImgs =
          getValue(remoteConfig, 'DEFAULT_IMGS').asString() || '';
        console.log(`got config from firebase:
            ${this.streamGateway}, 
            ${this.downloadGateway},
            ${this.cloudGateway},
            ${this.searchGateway},
            ${this.webDomain},
            ${this.audioConstantUrl},
            ${this.videoConstantUrl},
            ${this.defaultImgs},
            ${this.apiGateway}`);
      })
      .then(() => {
        this.searchClient = new MeiliSearch({
          host: this.searchGateway,
          headers: {
            Authorization: `Bearer ${this.searchAPIKey}`,
          },
        });
      })
      .catch((err) => {
        console.log('firebase init error', err);
      });

    // const deployedContract = this.kardiaClient.contract.invokeContract(
    //   'getAll',
    //   [1]
    // );
    // const defaultInvokePayload = deployedContract.getDefaultTxPayload();
    // const estimatedGasForInvoke = await deployedContract.estimateGas(
    //   defaultInvokePayload
    // );
    // const instructor = await deployedContract.call(
    //   '0x450B468C834d684dD0482CCD6e2360e10c8D6C18',
    //   {
    //     gas: estimatedGasForInvoke * 10,
    //   },
    //   'latest'
    // );
    // console.log(`transaction hash:`, instructor);
    return new Promise((resolve) => {
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
            gateway: this.streamGateway,
            api_version: 221119,
            thumbnails: '',
          },
        },
        async () => {
          this._isInitialized = true;
          await this.whenInitialized$.next(true);
          resolve(null);
        }
      );
    });
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
      const apiVersion = await this.vgmCore.navigator.fetchAPIVersion(
        storageKey
      );
      console.log('api Version:', apiVersion);

      if (apiVersion && !cacheVersion) {
        await this.localforageService.set(storageKey, apiVersion);
      }

      if (
        cacheVersion &&
        apiVersion &&
        cacheVersion.version !== apiVersion.version
      ) {
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
      // if (
      //   /^(01-bai-giang.hoc-theo-sach-trong-kinh-thanh).*/.test(list.url) ||
      //   /^(phat-thanh-nguon-song).*/.test(list.url)
      // )
      //   expiredTime = 43200; // 172800
      // if (list.url === '01-bai-giang.cac-dien-gia') {
      //   for (let i = list.children.length - 1; i > 0; i--) {
      //     const j = Math.floor(Math.random() * (i + 1));
      //     const temp = list.children[i];
      //     list.children[i] = list.children[j];
      //     list.children[j] = temp;
      //   }
      // }
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
    // let resolution: number = res || 480;
    // if (window.screen.availWidth >= 2560) {
    //   resolution = 1080;
    // } else if (window.screen.availWidth >= 1920 && window.screen.availWidth < 2560) {
    //   resolution = 720;
    // }
    return await this.vgmCore.getThumbnailUrl(
      this.streamGateway,
      this.cloudGateway,
      item,
      res,
      0
    );
  }

  async getPlayUrl(item: any, isVideo: boolean = true) {
    return await this.vgmCore.getPlayUrl(
      this.streamGateway,
      this.cloudGateway,
      item,
      isVideo
    ); // change this.iosCloudGateway to this.cloudGateway
  }
}
