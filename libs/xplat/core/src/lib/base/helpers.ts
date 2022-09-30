import axios, { AxiosResponse } from 'axios';
import pRetry from 'p-retry';
import { Item } from './model';
import { getPlayHash } from './crypto';

export const fetchFn = async (
  url: string,
  timeout: number = 7000,
  retries: number = 1
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
  return pRetry(toFetch, {
    retries,
    onFailedAttempt: (error) => {
      process.env.NODE_ENV === 'development' &&
        console.log(
          `[WARN] Fetch ${url} attempt ${
            error.attemptNumber
          } failed. There are ${(error as any).retriesLeft} attempts left.`
        );
    },
  });
};

export const fetchTimeout = async (resource) => {
  const timeout = 1000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    method: 'GET',
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
};

export const getThumbnailUrl = async (
  ipfsGW: string,
  cloudGW: string,
  item: Item,
  size: number = 480,
  select: number = 1
) => {
  return new Promise<string>(async (resolve) => {
    const today = new Date().getDay();
    const imageNo = select !== 0 ? select : today + 1; // Math.floor(Math.random() * 6) + 1;
    // // get playUrl from cloud
    const itemPath = item.url.replace(/\./g, '/');
    const cloudThumbUrl = `${cloudGW}/${
      item.isVideo ? 'VGMV' : 'VGMA'
    }/${itemPath}/${size}/${imageNo}.webp`;
    const { url, hash } = item;
    if (url && hash) {
      // get thumbUrl from ipfs
      const streamHash = getPlayHash(url, hash);
      const ipfsThumbUrl = `${ipfsGW}/ipfs/${streamHash}/${size}/${imageNo}.webp`;
      const thumbUrl = await fetchTimeout(ipfsThumbUrl)
        .then((res) => (res.status === 200 ? ipfsThumbUrl : cloudThumbUrl))
        .catch((err) => cloudThumbUrl);
      resolve(thumbUrl);
    } else {
      resolve(cloudThumbUrl);
    }
  });
};

export const getPlayUrl = async (
  ipfsGW: string,
  cloudGW: string,
  item: Item,
  isVideo: boolean = true
) => {
  return new Promise<string>(async (resolve) => {
    // // get playUrl from cloud
    const itemPath = item.url.replace(/\./g, '/');
    const cloudUrl = `${cloudGW}/${isVideo ? 'VGMV' : 'VGMA'}/${itemPath}/${
      isVideo ? 'playlist.m3u8' : '128p.m3u8'
    }`;
    const { url, hash } = item;
    // // get playUrl from ipfs
    if (url && hash) {
      // console.log('url hash:', url, hash);
      const streamHash = await getPlayHash(url, hash);
      const ipfsUrl = `${ipfsGW}/ipfs/${streamHash}/${
        isVideo ? 'playlist.m3u8' : '128p.m3u8'
      }`;
      // console.log('ipfsUrl:', ipfsUrl);
      const playUrl = await fetchTimeout(ipfsUrl)
        .then((res) => (res.status === 200 ? ipfsUrl : cloudUrl))
        .catch((err) => cloudUrl);
      resolve(playUrl);
    } else {
      resolve(cloudUrl);
    }
  });
};
