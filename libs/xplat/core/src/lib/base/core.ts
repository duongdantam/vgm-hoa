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
		// temporary disable cache for blockchain config
		const { finder, gateway, gateways, api, thumbnails } = await this.loadCache();
		if (!finder) {
			await this.reload();
		}
		if (finder && finder.api) {
			const localReady = await this.options.storage.get("localReady");
			const os = this.options.config.os;
			const initGateway = (os === 'Linux' || os === 'Windows' || os === 'Mac OS X') && localReady && typeof window !== 'undefined' && window !== undefined && window.__TAURI_IPC__ !== undefined ? [gateway] : gateways

			console.log(`Using cache value`, { finder, api, gateway, thumbnails });
			this.switcher = createSwitcher(gateway, initGateway, api, thumbnails);
			this.navigator = createNavigator(this.switcher, this.options);
			await this.switcher.load(finder);
			await this.navigator.init();
		}
		this.onInitialized && this.onInitialized();
	}

	async reload() {
		// const finder = await find(); // deprecarted due to blockchain data
		// const response = await this.switcher.load(finder); // deprecated due to blockchain data
		const finder = this.options.config as unknown as FindObject;
		if (this.options.config) {
			const { gateway, gateways, api, thumbnails } = this.options.config;
			await this.options.storage.set('finder', finder, 300); // Store cache of finder for 1 days
			console.log(`Save cache`, { finder, gateway, api, thumbnails });
			await this.options.storage.set('gateway', gateway, 300);
			await this.options.storage.set('gateways', gateways, 300);
			await this.options.storage.set('api', api, 300);
			await this.options.storage.set('thumbnails', thumbnails, 300);

			this.switcher = createSwitcher(gateway, gateways, api, thumbnails);
			this.navigator = createNavigator(this.switcher, this.options);

			await this.switcher.load(finder);
			await this.navigator.init();
		}
	}

	public getThumbnailUrl = async (
		ipfsGateway = this.switcher.availableGateways,
		cloudGateway,
		item: Item,
		size: number = 480,
		select: number = 1
	) => {
		return await getThumbnailUrl(ipfsGateway, cloudGateway, item, size, select);
	};

	public getPlayUrl = async (
		ipfsGateway = this.switcher.availableGateways,
		cloudGateway,
		item: Item,
		isVideo: boolean = true
	) => {
		return await getPlayUrl(ipfsGateway, cloudGateway, item, isVideo);
	};

	private async loadCache() {
		const finder = (await this.options.storage.get('finder')) as FindObject;
		const gateway = await this.options.storage.get('gateway');
		const gateways = await this.options.storage.get('gateways');
		const api = await this.options.storage.get('api');
		const thumbnails = await this.options.storage.get('thumbnails');
		return { finder, gateway, gateways, api, thumbnails };
	}
}

export const core = (
	options?: CoreOptions | CoreCallback,
	onInitialized?: CoreCallback
) => new Core(options, onInitialized);
