import { IPFSClient } from 'ipfs-message-port-client';
import { precacheAndRoute } from 'workbox-precaching';
import path from 'path';
import LRU from 'lru-cache';
// import pAny from 'p-any';
// import pRetry, { AbortError } from 'p-retry';
// import { delay } from 'delay';
const filterManifest = self.__WB_MANIFEST.filter((entry) => {
  return entry.url.endsWith('.js');
});
precacheAndRoute(filterManifest);
const portRequests = Object.create(null);
const cache = new LRU({
  max: 500,
  // for use with tracking overall storage size
  maxSize: 5000,
  sizeCalculation: (value, key) => {
    return 1;
  },
  // for use when you need to clean up something when objects
  // are evicted from the cache
  // dispose: (value, key) => {
  //   freeFromMemoryOrWhatever(value);
  // },
  // how long to live in ms
  ttl: 1000 * 60 * 3,
  // return stale items before removing from cache?
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
  // async method to use for cache.fetch(), for
  // stale-while-revalidate type of behavior
  // fetchMethod: async (key, staleValue, { options, signal }) => {},
});

self.addEventListener('install', (event) => {
  event.waitUntil(event.target.skipWaiting());
  // self.skipWaiting();
  // console.log('Service Worker installing', event);
  // event.waitUntil(
  //   caches.open('v1').then((cache) => {
  //     return cache.addAll(['./', './index.html']);
  //   })
  // );
});

self.addEventListener('activate', async (event) => {
  console.log('Service Worker activated:', event);
  event.waitUntil(event.target.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  console.log('notification details from SW: ', event.notification);
});

self.addEventListener('fetch', async function (event) {
  // If the request in GET, let the network handle things,
  if (event.request.method !== 'GET') {
    return;
  }
  // const url = new URL(event.request.url);
  // console.log('onfetch:', event, url);
  //   here we block the request and handle it our selves
  event.respondWith(
    // console.log('Service Worker fetching. \n', event.request.url, response)
    // Returns a promise of the cache entry that matches the request
    (async function () {
      try {
        // console.log('event request', event.request, response);
        // Try to get the response from a cache.
        const cachedResponse = await caches.match(event.request);
        // Return it if we found one.
        if (cachedResponse) return cachedResponse;
        // If we didn't find a match in the cache, use the network.
        //  if data stored in indexeddb for offline mode, let's return that instead

        // If file in indexeddb, take it out, if not fetch new
        if (
          /(\.m3u8)$|(\.vgmx)$|(\.vgmk)$|(\.jpg)$|(\.jpeg)$|(\.webp)$/.test(
            event.request.url
          )
        ) {
          const ab = await abFromIDB(event.request.url);
          // console.log('fetching img', event.request.url, ab);
          if (ab)
            return new Response(ab.data, { status: 200, statusText: 'Ok' });
        }
        // if the response is not in the cache, let's fetch it
        let fetchResponse = await getFetchResponse(event);
        if (!fetchResponse) return fetchResponse;
        // let fetchResponse = response.type === 'opaque' ? await fetch(event.request.url) : response;
        if (/(p\.m3u8)$/.test(event.request.url)) {
          const cloneResponse = await fetchResponse.clone();
          cache.set(event.request.url, cloneResponse);
          console.log(
            'saved m3u8:',
            cache.get(event.request.url),
            event.request.url
          );
        }
        // Got fetch response then decrypt if file is .vgmk
        if (/(\.vgmk)$/.test(event.request.url)) {
          const cloneResponse = await fetchResponse.clone();
          return await alterResponse(cloneResponse, event);
        }

        if (/(\.jpg)$|(\.jpeg)$|(\.webp)$/.test(event.request.url)) {
          // console.log('webp response:', fetchResponse);
          let imgBuff;
          if (fetchResponse.status === 200) {
            imgBuff = await fetchResponse.clone().arrayBuffer();
          } else {
            const dirName = event.request.url.match(/.+\//).toString();
            const fileName = event.request.url
              .match(/(?!.*\/).+/)
              .toString()
              .replace(/\d+/, 1);
            imgBuff = await (
              await fetch(`${dirName}${fileName}`)
            ).arrayBuffer();
            fetchResponse = new Response(imgBuff, {
              status: 200,
              statusText: 'Ok',
            });
          }

          // console.log('got img buff', imgBuff);
          await abToIDB(event.request.url, imgBuff);
          // console.log('img request:', event.request.url);
          return fetchResponse;
        }
        return fetchResponse;
      } catch (error) {
        console.log(error);
      }
    })()
  );
  event.stopImmediatePropagation();
});

const getFetchResponse = async (event) => {
  const url = new URL(event.request.url);
  console.log('getFetchResponse:', event, url, location);
  switch (url.origin) {
    // Our service worker only serves pages for its own page origin
    case location.origin: {
      const [, protocol] = url.pathname.split('/');
      switch (protocol) {
        case 'ipfs':
          return fetchIPFSContent({
            event,
            path: url.pathname,
          });
        // Anything else might be for scripts, source maps etc.. we just fetch
        // those from network
        default: {
          return fetch(event.request);
        }
      }
    }
    // Requests to other origins are fetched from the network.
    default: {
      return fetch(event.request);
    }
  }
};

const fetchIPFSContent = async ({ event, path }) => {
  // Obtains IPFS instance
  console.log('fetchIPFSContent:', event, path);
  const client = await selectClient();
  console.log('createIPFSClient:', client);
  const port = await requestPort('ipfs-message-port', client);
  console.log('createIPFSClient - port:', port);
  const ipfs = IPFSClient.from(port);
  console.log('SW: created IPFS Client:', ipfs);
  try {
    const stat = await ipfs.files.stat(path);
    console.log('IPFSClient - stat:', stat);
    switch (stat.type) {
      case 'file': {
        const content = ipfs.cat(path);
        console.log('ipfsContent:', content.toString());
        const body = toReadableStream(content);
        // Note: Browsers by default perform content sniffing to do a content type
        // decetion https://developer.mozilla.org/en-US/docs/Mozilla/How_Mozilla_determines_MIME_Types
        // but it is limited to web relevant content and seems to exclude svg.
        // Here we fix svg support that otherwise breaks many pages doing proper content
        // type detection is left as an excercise to the reader.
        const contentType = path.endsWith('.svg')
          ? { 'content-type': 'image/svg+xml' }
          : null;

        return new Response(body, {
          status: 200,
          headers: {
            ...contentType,
          },
        });
      }
      default: {
        return new Response('File not valid', {
          statusText: 'File not valid',
          status: 404,
        });
      }
    }
  } catch ({ message }) {
    console.log(message);

    // If such link does not exists respond with 404
    if (
      message.startsWith('no link named') ||
      message.includes('does not exist')
    ) {
      return new Response(message, {
        statusText: message,
        status: 404,
      });
    }

    // If problem with CID respond with 400
    if (message.includes('invalid')) {
      return new Response(message, {
        statusText: message,
        status: 400,
      });
    }

    // Otherwise respond with 500
    return new Response(message, {
      statusText: message,
      status: 500,
    });
  }
};

const abFromIDB = async function (key) {
  let request = await indexedDB.open('OfflineDB', 10);
  return new Promise(async (resolve) => {
    // request.onerror = async (e) => {
    //   console.log('IDB not available');
    // };
    request.onsuccess = async (e) => {
      let db = await request.result;
      let tx = await db.transaction('data', 'readwrite');
      const uri = key
        .replace(/.*(?=\/encrypted\/.*)/, '')
        .replace(/.*(?=\/ipfs\/.*)/, '');
      let store = tx.objectStore('data').get(uri);
      store.onsuccess = function (e) {
        // console.log('ab from IDB:', key);

        resolve(e.target.result);
      };
    };
  });
};
// Function to store image data to IDB
const abToIDB = async function (key, data) {
  let request = await indexedDB.open('OfflineDB', 10);
  return new Promise(async (resolve) => {
    // request.onerror = async (e) => {
    //   console.log('IDB not available');
    // };
    request.onsuccess = async (e) => {
      let db = await request.result;
      let tx = await db.transaction('data', 'readwrite');
      let store = tx.objectStore('data');
      const uri = key
        .replace(/.*(?=\/encrypted\/.*)/, '')
        .replace(/.*(?=\/ipfs\/.*)/, '');
      await store.put({ uri: uri, data: data });
      resolve(tx.complete);
    };
  });
};

/**
 * Sends a message prot request to the window client and waits for the response.
 * Returns promise for the message port it will receive.
 *
 * @param {WindowClient} client
 * @returns {Promise<MessagePort>}
 */
const requestPort = (method, client, data = {}) => {
  console.log('requestPort called:', client, data);
  // We might receive multiple concurrent requests from the same client (e.g.
  // images, scripts, stylesheets for the page) to avoid creating a port for
  // each request we use a little table keyed by client id instead.
  const request = portRequests[client.id];
  if (request == null) {
    const request = defer();
    portRequests[client.id] = request;
    const message =
      method === 'ipfs-message-port'
        ? {
            method: method,
            id: client.id,
          }
        : {
            method: method,
            id: client.id,
            data: data,
          };
    client.postMessage(message);
    return request.promise;
  } else {
    return request.promise;
  }
};

const alterResponse = async function (response, event) {
  console.log('vgmk new called:', event.request.url, response);
  try {
    const resClone = response.clone();
    const keyBuff = await resClone
      .arrayBuffer()
      .then((ab) => new Uint8Array(ab));
    const fileFolder = path.dirname(event.request.url);
    console.log('oldKeyBuff:', keyBuff, event.request.url);

    const getCache = async () => {
      const qualities = ['480p', '360p', '128p', '720p', '1080p'];
      let i = 0;
      return new Promise(async (resolve, reject) => {
        while (i < qualities.length) {
          const blob = await cache.get(`${fileFolder}/${qualities[i]}.m3u8`);
          console.log('hello Blob:', blob);
          if (blob && blob.status === 200) {
            resolve(blob);
            break;
          }
          i++;
          if (i === qualities.length) reject();
        }
      });
    };
    const m3u8Blob = await getCache();
    console.log('m3u8:', m3u8Blob);
    let IV;
    // debugger;
    if (m3u8Blob) {
      IV = await m3u8Blob.text().then(function (str) {
        return str
          .match(/(IV=0x).+/)
          .toString()
          .replace('IV=0x', '')
          .slice(0, 4);
      });
    }
    console.log('IV:', IV, event);
    // decrypt with wasm pubsub main SW
    if (m3u8Blob && IV) {
      const client = await selectClient();
      const newBuff = await requestPort('decryption-port', client, {
        key: keyBuff,
        secret: IV,
      });
      console.log('SW - newBuff from main:', newBuff);
      if (newBuff) {
        return new Response(newBuff, { status: 200, statusText: 'Ok' });
      }
      return response;
    }
    return response;
  } catch (error) {
    // console.log('error', error);
    return response;
  }
};

/**
 * Find a window client with the best score.
 *
 * @param {ServiceWorkerGlobalScope} target
 * @param {(client:WindowClient) => number} [scoreClient]
 * @returns {Promise<WindowClient>}
 */
const selectClient = async (scoreClient = scoreWindowClient) => {
  console.log('select Client called');
  // Get all the controlled window clients, score them and use the best one if
  // it is visible.
  const controlled = await getWindowClients(false);
  console.log('get Client:', controlled);
  const [best] = controlled.sort((a, b) => scoreClient(b) - scoreClient(a));
  console.log('sort best Client:', best);
  if (best && best.visibilityState === 'visible') {
    return best;
    // Otherwise collect all window client (including not yet controlled ones)
    // score them and use the best one.
  } else {
    const clients = await getWindowClients(true);
    const [best] = clients.sort((a, b) => scoreClient(b) - scoreClient(a));
    console.log('sort best Client:', clients, best);
    if (best) {
      return best;
    } else {
      // In theory this should never happen because all the content is loaded
      // from iframes that have windows.
      throw new Error('No viable client can be found');
    }
  }
};

export const defer = () => {
  /** @type {PromiseController<X,T>} */
  const controller = {};
  controller.promise = new Promise((resolve, reject) => {
    controller.resolve = resolve;
    controller.reject = reject;
  });

  return controller;
};

/**
 * @template T
 * @param {(AsyncIterable<T> & { return?: () => {}}) | AsyncGenerator<T, any, any>} source
 * @returns {ReadableStream<T>}
 */
export const toReadableStream = (source) => {
  const iterator = source[Symbol.asyncIterator]();
  return new ReadableStream({
    /**
     * @param {ReadableStreamDefaultController} controller
     */
    async pull(controller) {
      try {
        const chunk = await iterator.next();
        if (chunk.done) {
          controller.close();
        } else {
          controller.enqueue(chunk.value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
    /**
     * @param {any} reason
     */
    cancel(reason) {
      if (source.return) {
        source.return(reason);
      }
    },
  });
};

/**
 * @param {WindowClient} client
 */
const scoreWindowClient = ({ frameType, type, focused, visibilityState }) => {
  // Eliminate nested clients because they won't embed JS that responds to our request.
  const top = frameType === 'nested' ? 0 : 1;
  // If not a window it's not use to us.
  const typeScore = type === 'window' ? 1 : 0;
  // if not visible it can't execute js so not use for us either.
  const visibiltyScore = visibilityState === 'visible' ? 1 : 0;
  // if not focused it's event loop may be throttled so prefer focused.
  const focusScore = focused ? 2 : 1;
  return typeScore * focusScore * visibiltyScore * top;
};

/**
 * Utility function to get window clients.
 *
 * @param {ServiceWorkerGlobalScope} target
 * @param {boolean} [includeUncontrolled=false]
 * @returns {Promise<WindowClient[]>}
 */
const getWindowClients = async (includeUncontrolled = false) => {
  console.log('getWindowClients:::');
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled,
  });
  console.log('got window clients:', clients);
  return /** @type {WindowClient[]} */ (clients);
};

/**
 * Listens to the messages from the clients if it is response to pending message
 * port request resolves it.
 *
 * @param {MessageEvent} event
 */
self.addEventListener('message', ({ data }) => {
  console.log('SW: onmessage:', data);
  if (data) {
    const request = portRequests[data.id];
    try {
      if (request != null) {
        delete portRequests[data.id];
        if (data.port instanceof MessagePort) {
          console.log('resolve port from main:', data.port);
          request.resolve(data.port);
        }
        if (data.data) {
          console.log('resolve data from main:', data.data);
          request.resolve(data.data);
        }
        request.reject(new Error(data.error));
      }
    } catch (error) {
      console.log(error);
      request.reject(new Error(error));
    }
  }
});

/**
 * @typedef {FetchEvent & { target: Scope }} Fetch
 * @typedef {ExtendableEvent & { target: Scope }} LifecycleEvent
 * @typedef {ServiceWorkerGlobalScope & { onMessagePort: (event:MessageEvent) => void }} Scope
 * @typedef {Object} MessagePortRequest
 */

// import './ngsw-worker';
importScripts('./ngsw-worker.js');
