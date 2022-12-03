importScripts('./custom.js');

self.addEventListener('install', (event) => {
  event.waitUntil(event.target.skipWaiting());
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

// self.addEventListener('message', (event) => {
//   console.log('message from main:', event.data);
// });

self.addEventListener('fetch', async function (event) {
  // If the request in GET, let the network handle things,
  if (
    event.request.method !== 'GET'
    // || /(\.jpg)$|(\.jpeg)$|(\.webp)$/.test(event.request.url)
  ) {
    return;
  }

  //   here we block the request and handle it our selves
  event.respondWith(
    // console.log('Service Worker fetching. \n', event.request.url, response)
    // Returns a promise of the cache entry that matches the request
    (async function () {
      // console.log('event request', event.request, response);
      // Try to get the response from a cache.
      const cachedResponse = await caches.match(event.request);
      // Return it if we found one.
      if (cachedResponse) return cachedResponse;
      // If we didn't find a match in the cache, use the network.
      //  if data stored in indexeddb for offline mode, let's return that instead

      // handle m3u8 and vgmx and vgmk file
      if (
        /(\.m3u8)$|(\.vgmx)$|(\.vgmk)$|(\.jpg)$|(\.jpeg)$|(\.webp)$/.test(
          event.request.url
        )
      ) {
        const ab = await abFromIDB(event.request.url);
        console.log('getting IMG from IDB::', event.request.url, ab);
        if (ab) return new Response(ab.data, { status: 200, statusText: 'Ok' });
      }

      //  if (/(\.jpg)$|(\.jpeg)$|(\.webp)$/.test(event.request.url)) {
      //   // console.log('img response:', fetchResponse);
      //   const imgBuff = await (await fetch(event.request.url)).arrayBuffer();
      //   // console.log('got img buff', imgBuff);
      //   const item = { uri: event.request.url, data: imgBuff };
      //   await abToIDB(item);
      //   // console.log('img request:', event.request.url);
      // }

      // if the response is not in the cache, let's fetch it

      const response = await fetch(event.request);

      if (!response) {
        return response;
      }

      let fetchResponse = response;
      if (response.type === 'opaque') {
        fetchResponse = await fetch(event.request.url);
      }

      if (/(\.vgmk)$/.test(event.request.url)) {
        cloneResponse = fetchResponse.clone();
        return await alterResponse(cloneResponse, event.request.url);
      }

      if (/(\.jpg)$|(\.jpeg)$|(\.webp)$/.test(event.request.url)) {
        console.log('Fetching IMG::', fetchResponse);
        let imgBuff;
        if (fetchResponse.status === 200) {
          imgBuff = await fetchResponse.clone().arrayBuffer();
        } else {
          const dirName = event.request.url.match(/.+\//).toString();
          const fileName = event.request.url
            .match(/(?!.*\/).+/)
            .toString()
            .replace(/\d+/, 1);
          imgBuff = await (await fetch(`${dirName}${fileName}`)).arrayBuffer();
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
    })()
  );
  event.stopImmediatePropagation();
});

const abFromIDB = async function (key) {
  console.log('abFromIDB called::', key);
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
  console.log('abToIDB called::', key);
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

const alterResponse = async function (response, url) {
  // console.log('vgmk new called', url, response);
  try {
    // const ab = await abFromIDB(url);
    // if (ab) {
    //   const keyBuff = await new Uint8Array(ab.data);
    //   // console.log('VGMK from DB', url);
    //   return new Response(keyBuff, { status: 200, statusText: 'Ok' });
    // } else {
    const resClone = response.clone();
    const keyBuff = await resClone
      .arrayBuffer()
      .then((ab) => new Uint8Array(ab));
    // console.log('newKeyBuff', keyBuff);
    const fileFolder = url.replace(/key\.vgmk$/, '');
    const quality = ['480p', '128p', '720p', '1080p'];
    let m3u8Blob;
    let IV;
    const fetch_retry = async (n) => {
      let error;
      for (let i = 0; i < n; i++) {
        try {
          const filePath = `${fileFolder}${quality[i]}.m3u8`;
          const fetchResult = await fetch(filePath);
          if (fetchResult.status === 200) return fetchResult;
        } catch (err) {
          error = err;
        }
      }
      // console.log(error);
    };
    m3u8Blob = await fetch_retry(quality.length);
    // console.log('got m3u8', m3u8Blob);
    if (m3u8Blob) {
      IV = await m3u8Blob.text().then(function (str) {
        return str
          .match(/(IV=0x).+/)
          .toString()
          .replace('IV=0x', '')
          .slice(0, 4);
      });
    }

    // console.log('for IV', IV, m3u8Blob);
    // decrypt with wasm
    if (IV) {
      await wasm_bindgen('./custom.wasm');
      const newBuff = wasm_bindgen.decrypt(keyBuff, IV, false);
      // const reverseBuff = wasm_bindgen.decrypt(cache[url], IV, false);
      // console.log('newBuff from WASM', newBuff);

      return new Response(newBuff, { status: 200, statusText: 'Ok' });
    } else {
      return resClone;
    }
    // }
  } catch (error) {
    // console.log('error', error);
    return response;
  }
};

importScripts('./ngsw-worker.js');
