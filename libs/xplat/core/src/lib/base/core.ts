import { find, FindObject } from './find';
import { createSwitcher, Switcher } from './switcher';
import { createNavigator, Navigator } from './navigator';
import { Item, CoreOptions, CoreCallback } from './model';
import { getThumbnailUrl, getPlayUrl } from './helpers';

export class Core {
  // blockchain config
  public switcher: Switcher;
  public navigator: Navigator;
  private onInitialized: CoreCallback;
  private options: CoreOptions;

  constructor(
    options?: CoreOptions | CoreCallback,
    onInitialized?: CoreCallback
  ) {

    if (typeof options === 'function') {
      this.options = {};
      this.onInitialized = options;
    } else {
      this.options = options as any;
      this.onInitialized = onInitialized as CoreCallback;
    }
    this.init().catch((err) => console.error(err));
  }

  async init() {
    // // temporary disable cache for blockchain config
    // const { finder, api, gateway, thumbnails } = await this.loadCache();
    // if (!finder) {
    await this.reload();
    // }
    // if (finder && finder.api) {
    //   console.log(`Using cache value`, { finder, api, gateway, thumbnails });
    //   this.switcher = createSwitcher(gateway, api, thumbnails);
    //   this.navigator = createNavigator(this.switcher, this.options);
    //   await this.switcher.load(finder);
    //   await this.navigator.init(gateway as string);
    // }
    this.onInitialized && this.onInitialized();
  }

  async reload() {
    // const finder = await find(); // deprecarted due to blockchain data
    // const response = await this.switcher.load(finder); // deprecated due to blockchain data
    const finder = this.options.config as unknown as FindObject;
    if (this.options.config) {
      const { gateway, api, thumbnails } = this.options.config;
      await this.options.storage.set('finder', finder, 86400); // Store cache of finder for 1 days
      console.log(`Save cache`, { finder, gateway, api, thumbnails });
      await this.options.storage.set('gateway', gateway);
      await this.options.storage.set('api', api);
      await this.options.storage.set('thumbnails', thumbnails);

      this.switcher = createSwitcher(gateway, api, thumbnails);
      this.navigator = createNavigator(this.switcher, this.options);

      await this.switcher.load(finder);
      await this.navigator.init(gateway);
    }
  }

  public getThumbnailUrl = async (
    ipfsGateway: string = this.navigator.gateway,
    cloudGateway,
    item: Item,
    size: number = 480,
    select: number = 1
  ) => {
    return await getThumbnailUrl(ipfsGateway, cloudGateway, item, size, select);
  };

  public getPlayUrl = async (
    ipfsGateway: string = this.navigator.gateway,
    cloudGateway,
    item: Item,
    isVideo: boolean = true
  ) => {
    return await getPlayUrl(ipfsGateway, cloudGateway, item, isVideo);
  };

  private async loadCache() {
    const finder = (await this.options.storage.get('finder')) as FindObject;
    const gateway = await this.options.storage.get('gateway');
    const api = await this.options.storage.get('api');
    const thumbnails = await this.options.storage.get('thumbnails');
    return { finder, gateway, api, thumbnails };
  }
}

export const core = (
  options?: CoreOptions | CoreCallback,
  onInitialized?: CoreCallback
) => new Core(options, onInitialized);
