import axios, { AxiosResponse } from 'axios';
import pRetry from 'p-retry';
import pAny from 'p-any';
import { pipe, evolve, map } from 'ramda';
import { Item } from './model';
import { getPlayHash } from './crypto';
import { invoke } from '@tauri-apps/api/tauri';
import PQueue from 'p-queue';

const pinQueue = new PQueue({ concurrency: 10 });

export const fetchFn = async (
	url: string,
	timeout: number = 7000,
	retries: number = 1,
): Promise<AxiosResponse<any>> => {
	const toFetch = async (): Promise<AxiosResponse<any>> => {
		try {
			const response = await axios.request({ url, timeout });
			if (response.status === 404) {
				throw new pRetry.AbortError(response.statusText);
			}
			return response;
		} catch (error) {
			console.log(error);
		}
	};
	return await pRetry(toFetch, {
		retries,
		onFailedAttempt: error => {
			process.env.NODE_ENV === 'development' && console.log(
				`[WARN] Fetch ${url} attempt ${error.attemptNumber} failed. There are ${(error as any).retriesLeft
				} attempts left.`,
			);
		},
	});
};

export const fetchTimeout = async (url: string, timeout: number = 2000, method = 'GET') => {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);
	const response = await fetch(url, {
		method: method,
		signal: controller.signal
	});
	clearTimeout(id);
	return response;
}



export const getThumbnailUrl = async (ipfsGWs = [], cloudGW: string, item: Item, size: number = 480, select: number = 1) => {
	return new Promise<string>(async (resolve) => {
		// console.log("getThumbnailUrl::", ipfsGW, cloudGW);

		const today = new Date().getDay();
		// const imageNo = select !== 0 ? select : today + 1; // Math.floor(Math.random() * 6) + 1;
		const imageNo = 1; // Math.floor(Math.random() * 6) + 1;
		// // get playUrl from cloud
		// const itemPath = item.url.replace(/\./g, '/');
		// const cloudThumbUrl = `${cloudGW}/${item.isVideo ? 'VGMV' : 'VGMA'}/${itemPath}/${size}/${imageNo}.webp`;
		// const itemPath = item.url.replace(/\./g, '/');
		// const cloudThumbUrl = `${cloudGW}/${item.isVideo ? 'VGMV' : 'VGMA'}/${itemPath}/${size}/${imageNo}.webp`;
		const { url, hash } = item;
		// if (url && hash) {
		// get thumbUrl from ipfs
		const streamHash = getPlayHash(url, hash);
		const ipfsImgPath = `/ipfs/${streamHash ? streamHash : 'QmfF8bvmsYW53MzK1xkirsRMF5YLC29iiHHS2XZGjAFZqu'}/${size}`;
		const ipfsPath = `${ipfsImgPath}/${imageNo}.webp`;

		const buildFetcher = pipe(
			map((gateway) => `${gateway}${ipfsPath}`),
			map((url) => {
				console.log("fetching:: ", url);
				return fetchFn(url, 5000, 1)
			})
		);

		// [Math.floor(Math.random() * this.vgmCore.switcher.availableGateways.length)]
		// const ipfsGatewayUrl = `${ipfsGW}${ipfsPath}`;


		const result: any = await pAny(buildFetcher(ipfsGWs));
		// console.log("result::", result);

		if (result && result.status === 200) {
			resolve(result.request.responseURL)
		} else {
			resolve(`${ipfsGWs[0]}${ipfsPath}`);
		}



		// const fallbackIpfsGatewayUrl = ipfsGatewayUrl.replace(/\/\d+\.webp/, "/1.webp");
		// const cdnGatewayUrl = `${cloudGW.replace(/^http\:\/\//, "https://")}${ipfsPath}`;
		if (typeof window !== 'undefined' && window !== undefined && window.__TAURI_IPC__ !== undefined) {
			// If isTauri, pin image to local
			console.log("pinning::", ipfsImgPath);
			pinQueue.add(async () => {
				await invoke('pin_ipfs', { hash: ipfsImgPath }).catch(err => "")
			}
			)
		}
		// await fetchTimeout(ipfsGatewayUrl, 1500, 'HEAD').then(res => res && res.status === 200 ? resolve(ipfsGatewayUrl) : resolve(fallbackIpfsGatewayUrl)).catch(err => resolve(fallbackIpfsGatewayUrl));
		// resolve(ipfsGatewayUrl)
		// try {
		// 	// 	// const ipfsLocalUrl = `${location.origin}${ipfsPath}`;
		// 	let fetchLinks = [ipfsGatewayUrl, cdnGatewayUrl];
		// 	for (let i = 0; i < fetchLinks.length; i++) {
		// 		const res = await fetchTimeout(fetchLinks[i], 1500, 'HEAD');
		// 		if (res && res.status === 200) {
		// 			resolve(fetchLinks[i]);
		// 			break;
		// 		}
		// 		if (i === fetchLinks.length - 1) {
		// 			resolve(cdnGatewayUrl)
		// 		}
		// 	}
		// } catch (error) {
		// 	resolve(cdnGatewayUrl)
		// }
	})
}

export const getPlayUrl = async (ipfsGWs = [], cloudGW: string, item: Item, isVideo: boolean = true) => {
	return new Promise<string>(async (resolve) => {

		// const testUrl = "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8"

		// // get playUrl from cloud
		// const itemPath = item.url.replace(/\./g, '/');
		// const cloudUrl = `${cloudGW}/${isVideo ? 'VGMV' : 'VGMA'}/${itemPath}/${isVideo ? 'playlist.m3u8' : '128p.m3u8'}`;
		// const itemPath = item.url.replace(/\./g, '/');
		// const cloudUrl = `${cloudGW}/${isVideo ? 'VGMV' : 'VGMA'}/${itemPath}/${isVideo ? 'playlist.m3u8' : '128p.m3u8'}`;
		const { url, hash } = item;
		// // get playUrl from ipfs
		// resolve(`https://cdn-ipfs-sgp.hjm.bid/ipfs/bafybeie65uuexn4xu2v5a5ibyvyyw6elvyp2levkjixv264itxn5uvw7mq/playlist.m3u8`)
		// if (url && khash) {
		// console.log('url hash:', url, hash);
		const streamHash = getPlayHash(url, hash);
		const ipfsPath = `/ipfs/${streamHash}/${isVideo ? 'playlist.m3u8' : '128p.m3u8'}`;


		const buildFetcher = pipe(
			map((gateway) => `${gateway}${ipfsPath}`),
			map((url) => {
				console.log("fetching:: ", url);
				return fetchFn(url, 5000, 1)
			})
		);
		const result: any = await pAny(buildFetcher(ipfsGWs));
		// console.log("result::", result);

		if (result && result.status === 200) {
			resolve(result.request.responseURL)
		} else {
			resolve(`${ipfsGWs[0]}${ipfsPath}`);
		}


		// const ipfsGatewayUrl = `${ipfsGW}${ipfsPath}`;
		// const cdnGatewayUrl = `${cloudGW.replace(/^http\:\/\//, "https://")}${ipfsPath}`;
		// resolve(ipfsGatewayUrl)
		// try {
		// 	// 	// const ipfsLocalUrl = `${location.origin}${ipfsPath}`;
		// 	let fetchLinks = [ipfsGatewayUrl, cdnGatewayUrl];
		// 	for (let i = 0; i < fetchLinks.length; i++) {
		// 		const res = await fetchTimeout(fetchLinks[i], 1500);
		// 		if (res && res.status === 200) {
		// 			resolve(fetchLinks[i])
		// 		}
		// 		if (i === fetchLinks.length - 1) {
		// 			resolve(cdnGatewayUrl)
		// 		}
		// 	}
		// } catch (error) {
		// 	resolve(cdnGatewayUrl)
		// }
	})
};
