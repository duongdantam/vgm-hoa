export interface Topic {
	id: string;
	pid: string;
	url: string;
	name: string;
	count: string;
	children?: Topic[];
	items?: Item[];
}

export interface Item {
	id: string;
	name: string;
	duration: string;
	audience: number;
	size: number;
	mtime: number;
	isLeaf?: boolean;
	isVideo?: boolean;
	url: string;
	location: string;
	hash: string;
	khash: string;
	thumb: string;
}

export interface Breadcrumb {
	topicId: string;
	name: string;
	level: number;
}

export interface TopicList {
	id: string;
	pid: string;
	name: string;
	audience: string;
	url: string;
	breadcrumb: Breadcrumb[];
	count: number;
	isLeaf: boolean;
	isVideo: boolean;
	children: Topic[];
}

export interface ItemList {
	id: string;
	pid: string;
	name: string;
	audience: number;
	url: string;
	count: number;
	isLeaf: boolean;
	isVideo: boolean;
	breadcrumb: Breadcrumb[];
	children: Item[];
}

export interface LocalStorageIO {
	set: (key: string, data: unknown, expire?: number | boolean) => void;
	get: (key: string) => Promise<unknown>;
}

export interface CoreConfig {
	api: string;
	api_base: string;
	gateway: string;
	gateways: string[];
	thumbnails: string;
	api_version: number;
	os: string;
}

export interface CoreOptions {
	/**
	 * Prefer gateways in order
	 */
	preferGateways?: string[];
	/**
	 * Exclude list of item name
	 */
	exclude?: string[];
	storage?: LocalStorageIO;
	config?: CoreConfig;
}

export interface CoreCallback {
	(): void;
}
