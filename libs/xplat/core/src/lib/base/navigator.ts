import { pipe, evolve, map } from 'ramda';
import pAny from 'p-any';
import { Topic, TopicList, Item, ItemList, CoreOptions } from './model';
import { Switcher } from './switcher';
import { fetchFn } from './helpers';
import { filterContent } from './filter';

const filterRestrictedContent = (topicList: TopicList, excludeList: string[]) =>
	evolve(
		{ list: (list) => filterContent(list, excludeList || []) },
		topicList as any
	);

/**
 * This class will help the client get different topic and item
 */
export class Navigator {
	/**
	 * IPFS Hash in form of `Qm...` prepresent the API root directory
	 */
	public api: string = '';
	public gateway: string = '';
	public thumbnails: string = '';
	public isInitialized: boolean = false;

	constructor(public switcher: Switcher, private options: CoreOptions) {
		this.api = this.switcher.api || '';
		this.gateway = this.switcher.availableGateways[0] || '';
		this.thumbnails = this.switcher.thumbnails || '';
	}

	async init(gateway: string) {
		try {
			this.api = this.switcher.api;
			this.gateway = gateway || this.switcher.availableGateways[0];
			this.thumbnails = this.switcher.thumbnails;
			this.isInitialized = true;
			console.log(
				`Navigator initialized!\n\tGateway: ${this.gateway}\n\tAPI: ${this.api}`
			);
			// TODO save api and gateway to local storage for faster use later
		} catch (err) {
			throw new Error(
				`Could not load the Switcher ${err.code}: ${err.message}`
			);
		}
	}

	public async fetchHomeList(listType: string = 'video'): Promise<Topic[]> {
		const path = `topics/list/home.${listType}`;
		try {
			const root = await this.fetchData(path);

			return filterContent(root.children, this.options.exclude!);
		} catch (err) {
			throw new Error(`Could not fetch root list ${err.code}: ${err.message}`);
		}
	}

	public async fetchTopicList(url: string): Promise<TopicList> {
		const path = `topics/list/${url}`;
		try {
			const topicList = await this.fetchData(path);
			return filterRestrictedContent(
				topicList,
				this.options.exclude!
			) as TopicList;
		} catch (err) {
			throw new Error(`${err.code}: ${err.message}`);
		}
	}

	public async fetchItemList(url: string): Promise<ItemList> {
		const path = `items/list/${url}`;
		try {
			const itemList = await this.fetchData(path);
			return itemList;
		} catch (err) {
			throw new Error(`${err.code}: ${err.message}`);
		}
	}

	public async fetchSingleTopic(url: string): Promise<Topic> {
		const path = `topics/single/${url}`;
		try {
			const topic = await this.fetchData(path);
			return topic;
		} catch (err) {
			throw new Error(`${err.code}: ${err.message}`);
		}
	}

	public async fetchSingleItem(url: string): Promise<Item> {
		const path = `items/single/${url}`;
		try {
			const item = await this.fetchData(path);
			return item;
		} catch (err) {
			throw new Error(`${err.code}: ${err.message}`);
		}
	}

	public async fetchAPIVersion(url: string) {
		try {
			const item = await this.fetchData(url);
			return item;
		} catch (err) {
			throw new Error(`${err.code}: ${err.message}`);
		}
	}

	// public async fetchSearch(url: string) {
	//   const path = url;
	//   try {
	//     const url = /^http/.test(this.api) ? `${this.api}/${path}.json` : ''
	//     const item = await (await fetch(url)).json();
	//     return item;
	//   } catch (err) {
	//     throw new Error(`${err.code}: ${err.message}`);
	//   }
	// }

	private async fetchData(path: string): Promise<any> {
		const buildFetcher = pipe(
			map((gateway) => {
				const url = /^http/.test(this.api) ? `${this.api}/${path}.json` : `${gateway}/ipfs/${this.api}/${path}.json`;
				return url;
			}),  // location for fetching api `${gateway}/ipfs/${this.api}/${path}.json` or `https://cdn.vgm.tv/encrypted-hoa/API/${path}.json`;
			map((url) => fetchFn(url, 10000, 1))
		);
		try {
			const result: any = await pAny(
				buildFetcher(this.switcher.availableGateways)
			);
			if (result && result.status === 200 && ('id' in result.data || 'version' in result.data)) {
				return result.data;
			}
			// else {
			// 	return null;
			// 	// throw new Error(`Receive unknown data at ${path}`);
			// }
		} catch (err) {
			throw new Error(
				`Unable to fetch content at ${path} ${err.code}: ${err.message}`
			);
		}
	}
}

export const createNavigator = (switcher: Switcher, options: CoreOptions) =>
	new Navigator(switcher, options);
