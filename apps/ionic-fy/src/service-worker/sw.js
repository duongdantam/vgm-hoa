/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./apps/ionic-fy/src/service-worker/service-worker.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./apps/ionic-fy/src/service-worker/service-worker.js":
/*!************************************************************!*\
  !*** ./apps/ionic-fy/src/service-worker/service-worker.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
    event.request.method !== 'GET' ||
    /(\.jpg)$|(\.jpeg)$|(\.webp)$/.test(event.request.url)
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
        // console.log('fetching img', event.request.url, ab);
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


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vYXBwcy9pb25pYy1meS9zcmMvc2VydmljZS13b3JrZXIvc2VydmljZS13b3JrZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtRQUFBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBOzs7UUFHQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMENBQTBDLGdDQUFnQztRQUMxRTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLHdEQUF3RCxrQkFBa0I7UUFDMUU7UUFDQSxpREFBaUQsY0FBYztRQUMvRDs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0EseUNBQXlDLGlDQUFpQztRQUMxRSxnSEFBZ0gsbUJBQW1CLEVBQUU7UUFDckk7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSwyQkFBMkIsMEJBQTBCLEVBQUU7UUFDdkQsaUNBQWlDLGVBQWU7UUFDaEQ7UUFDQTtRQUNBOztRQUVBO1FBQ0Esc0RBQXNELCtEQUErRDs7UUFFckg7UUFDQTs7O1FBR0E7UUFDQTs7Ozs7Ozs7Ozs7O0FDbEZBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0EsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVEO0FBQ0E7QUFDQSxJQUFJOztBQUVKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsZ0NBQWdDO0FBQzlFOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMENBQTBDLFFBQVEsRUFBRSxTQUFTO0FBQzdEO0FBQ0E7QUFDQTtBQUNBLFdBQVc7QUFDWDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsdUJBQXVCO0FBQzlDO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsZ0NBQWdDO0FBQ3ZFLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCLE9BQU87QUFDNUI7QUFDQSw4QkFBOEIsV0FBVyxFQUFFLFdBQVc7QUFDdEQ7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG9DQUFvQyxnQ0FBZ0M7QUFDcEUsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTs7QUFFQSIsImZpbGUiOiJzdy5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBcIi4vYXBwcy9pb25pYy1meS9zcmMvc2VydmljZS13b3JrZXIvc2VydmljZS13b3JrZXIuanNcIik7XG4iLCJpbXBvcnRTY3JpcHRzKCcuL2N1c3RvbS5qcycpO1xuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2luc3RhbGwnLCAoZXZlbnQpID0+IHtcbiAgZXZlbnQud2FpdFVudGlsKGV2ZW50LnRhcmdldC5za2lwV2FpdGluZygpKTtcbiAgLy8gY29uc29sZS5sb2coJ1NlcnZpY2UgV29ya2VyIGluc3RhbGxpbmcnLCBldmVudCk7XG4gIC8vIGV2ZW50LndhaXRVbnRpbChcbiAgLy8gICBjYWNoZXMub3BlbigndjEnKS50aGVuKChjYWNoZSkgPT4ge1xuICAvLyAgICAgcmV0dXJuIGNhY2hlLmFkZEFsbChbJy4vJywgJy4vaW5kZXguaHRtbCddKTtcbiAgLy8gICB9KVxuICAvLyApO1xufSk7XG5cbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignYWN0aXZhdGUnLCBhc3luYyAoZXZlbnQpID0+IHtcbiAgY29uc29sZS5sb2coJ1NlcnZpY2UgV29ya2VyIGFjdGl2YXRlZDonLCBldmVudCk7XG4gIGV2ZW50LndhaXRVbnRpbChldmVudC50YXJnZXQuY2xpZW50cy5jbGFpbSgpKTtcbn0pO1xuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ25vdGlmaWNhdGlvbmNsaWNrJywgKGV2ZW50KSA9PiB7XG4gIGV2ZW50Lm5vdGlmaWNhdGlvbi5jbG9zZSgpO1xuICBjb25zb2xlLmxvZygnbm90aWZpY2F0aW9uIGRldGFpbHMgZnJvbSBTVzogJywgZXZlbnQubm90aWZpY2F0aW9uKTtcbn0pO1xuXG4vLyBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcbi8vICAgY29uc29sZS5sb2coJ21lc3NhZ2UgZnJvbSBtYWluOicsIGV2ZW50LmRhdGEpO1xuLy8gfSk7XG5cbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignZmV0Y2gnLCBhc3luYyBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgLy8gSWYgdGhlIHJlcXVlc3QgaW4gR0VULCBsZXQgdGhlIG5ldHdvcmsgaGFuZGxlIHRoaW5ncyxcbiAgaWYgKFxuICAgIGV2ZW50LnJlcXVlc3QubWV0aG9kICE9PSAnR0VUJyB8fFxuICAgIC8oXFwuanBnKSR8KFxcLmpwZWcpJHwoXFwud2VicCkkLy50ZXN0KGV2ZW50LnJlcXVlc3QudXJsKVxuICApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyAgIGhlcmUgd2UgYmxvY2sgdGhlIHJlcXVlc3QgYW5kIGhhbmRsZSBpdCBvdXIgc2VsdmVzXG4gIGV2ZW50LnJlc3BvbmRXaXRoKFxuICAgIC8vIGNvbnNvbGUubG9nKCdTZXJ2aWNlIFdvcmtlciBmZXRjaGluZy4gXFxuJywgZXZlbnQucmVxdWVzdC51cmwsIHJlc3BvbnNlKVxuICAgIC8vIFJldHVybnMgYSBwcm9taXNlIG9mIHRoZSBjYWNoZSBlbnRyeSB0aGF0IG1hdGNoZXMgdGhlIHJlcXVlc3RcbiAgICAoYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgICAgLy8gY29uc29sZS5sb2coJ2V2ZW50IHJlcXVlc3QnLCBldmVudC5yZXF1ZXN0LCByZXNwb25zZSk7XG4gICAgICAvLyBUcnkgdG8gZ2V0IHRoZSByZXNwb25zZSBmcm9tIGEgY2FjaGUuXG4gICAgICBjb25zdCBjYWNoZWRSZXNwb25zZSA9IGF3YWl0IGNhY2hlcy5tYXRjaChldmVudC5yZXF1ZXN0KTtcbiAgICAgIC8vIFJldHVybiBpdCBpZiB3ZSBmb3VuZCBvbmUuXG4gICAgICBpZiAoY2FjaGVkUmVzcG9uc2UpIHJldHVybiBjYWNoZWRSZXNwb25zZTtcbiAgICAgIC8vIElmIHdlIGRpZG4ndCBmaW5kIGEgbWF0Y2ggaW4gdGhlIGNhY2hlLCB1c2UgdGhlIG5ldHdvcmsuXG4gICAgICAvLyAgaWYgZGF0YSBzdG9yZWQgaW4gaW5kZXhlZGRiIGZvciBvZmZsaW5lIG1vZGUsIGxldCdzIHJldHVybiB0aGF0IGluc3RlYWRcblxuICAgICAgLy8gaGFuZGxlIG0zdTggYW5kIHZnbXggYW5kIHZnbWsgZmlsZVxuICAgICAgaWYgKFxuICAgICAgICAvKFxcLm0zdTgpJHwoXFwudmdteCkkfChcXC52Z21rKSR8KFxcLmpwZykkfChcXC5qcGVnKSR8KFxcLndlYnApJC8udGVzdChcbiAgICAgICAgICBldmVudC5yZXF1ZXN0LnVybFxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgY29uc3QgYWIgPSBhd2FpdCBhYkZyb21JREIoZXZlbnQucmVxdWVzdC51cmwpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnZmV0Y2hpbmcgaW1nJywgZXZlbnQucmVxdWVzdC51cmwsIGFiKTtcbiAgICAgICAgaWYgKGFiKSByZXR1cm4gbmV3IFJlc3BvbnNlKGFiLmRhdGEsIHsgc3RhdHVzOiAyMDAsIHN0YXR1c1RleHQ6ICdPaycgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vICBpZiAoLyhcXC5qcGcpJHwoXFwuanBlZykkfChcXC53ZWJwKSQvLnRlc3QoZXZlbnQucmVxdWVzdC51cmwpKSB7XG4gICAgICAvLyAgIC8vIGNvbnNvbGUubG9nKCdpbWcgcmVzcG9uc2U6JywgZmV0Y2hSZXNwb25zZSk7XG4gICAgICAvLyAgIGNvbnN0IGltZ0J1ZmYgPSBhd2FpdCAoYXdhaXQgZmV0Y2goZXZlbnQucmVxdWVzdC51cmwpKS5hcnJheUJ1ZmZlcigpO1xuICAgICAgLy8gICAvLyBjb25zb2xlLmxvZygnZ290IGltZyBidWZmJywgaW1nQnVmZik7XG4gICAgICAvLyAgIGNvbnN0IGl0ZW0gPSB7IHVyaTogZXZlbnQucmVxdWVzdC51cmwsIGRhdGE6IGltZ0J1ZmYgfTtcbiAgICAgIC8vICAgYXdhaXQgYWJUb0lEQihpdGVtKTtcbiAgICAgIC8vICAgLy8gY29uc29sZS5sb2coJ2ltZyByZXF1ZXN0OicsIGV2ZW50LnJlcXVlc3QudXJsKTtcbiAgICAgIC8vIH1cblxuICAgICAgLy8gaWYgdGhlIHJlc3BvbnNlIGlzIG5vdCBpbiB0aGUgY2FjaGUsIGxldCdzIGZldGNoIGl0XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZXZlbnQucmVxdWVzdCk7XG5cbiAgICAgIGlmICghcmVzcG9uc2UpIHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfVxuXG4gICAgICBsZXQgZmV0Y2hSZXNwb25zZSA9IHJlc3BvbnNlO1xuICAgICAgaWYgKHJlc3BvbnNlLnR5cGUgPT09ICdvcGFxdWUnKSB7XG4gICAgICAgIGZldGNoUmVzcG9uc2UgPSBhd2FpdCBmZXRjaChldmVudC5yZXF1ZXN0LnVybCk7XG4gICAgICB9XG5cbiAgICAgIGlmICgvKFxcLnZnbWspJC8udGVzdChldmVudC5yZXF1ZXN0LnVybCkpIHtcbiAgICAgICAgY2xvbmVSZXNwb25zZSA9IGZldGNoUmVzcG9uc2UuY2xvbmUoKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGFsdGVyUmVzcG9uc2UoY2xvbmVSZXNwb25zZSwgZXZlbnQucmVxdWVzdC51cmwpO1xuICAgICAgfVxuXG4gICAgICBpZiAoLyhcXC5qcGcpJHwoXFwuanBlZykkfChcXC53ZWJwKSQvLnRlc3QoZXZlbnQucmVxdWVzdC51cmwpKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCd3ZWJwIHJlc3BvbnNlOicsIGZldGNoUmVzcG9uc2UpO1xuICAgICAgICBsZXQgaW1nQnVmZjtcbiAgICAgICAgaWYgKGZldGNoUmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICBpbWdCdWZmID0gYXdhaXQgZmV0Y2hSZXNwb25zZS5jbG9uZSgpLmFycmF5QnVmZmVyKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgZGlyTmFtZSA9IGV2ZW50LnJlcXVlc3QudXJsLm1hdGNoKC8uK1xcLy8pLnRvU3RyaW5nKCk7XG4gICAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBldmVudC5yZXF1ZXN0LnVybFxuICAgICAgICAgICAgLm1hdGNoKC8oPyEuKlxcLykuKy8pXG4gICAgICAgICAgICAudG9TdHJpbmcoKVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcZCsvLCAxKTtcbiAgICAgICAgICBpbWdCdWZmID0gYXdhaXQgKGF3YWl0IGZldGNoKGAke2Rpck5hbWV9JHtmaWxlTmFtZX1gKSkuYXJyYXlCdWZmZXIoKTtcbiAgICAgICAgICBmZXRjaFJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKGltZ0J1ZmYsIHtcbiAgICAgICAgICAgIHN0YXR1czogMjAwLFxuICAgICAgICAgICAgc3RhdHVzVGV4dDogJ09rJyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdnb3QgaW1nIGJ1ZmYnLCBpbWdCdWZmKTtcbiAgICAgICAgYXdhaXQgYWJUb0lEQihldmVudC5yZXF1ZXN0LnVybCwgaW1nQnVmZik7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdpbWcgcmVxdWVzdDonLCBldmVudC5yZXF1ZXN0LnVybCk7XG4gICAgICAgIHJldHVybiBmZXRjaFJlc3BvbnNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZldGNoUmVzcG9uc2U7XG4gICAgfSkoKVxuICApO1xuICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbn0pO1xuXG5jb25zdCBhYkZyb21JREIgPSBhc3luYyBmdW5jdGlvbiAoa2V5KSB7XG4gIGxldCByZXF1ZXN0ID0gYXdhaXQgaW5kZXhlZERCLm9wZW4oJ09mZmxpbmVEQicsIDEwKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XG4gICAgLy8gcmVxdWVzdC5vbmVycm9yID0gYXN5bmMgKGUpID0+IHtcbiAgICAvLyAgIGNvbnNvbGUubG9nKCdJREIgbm90IGF2YWlsYWJsZScpO1xuICAgIC8vIH07XG4gICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgbGV0IGRiID0gYXdhaXQgcmVxdWVzdC5yZXN1bHQ7XG4gICAgICBsZXQgdHggPSBhd2FpdCBkYi50cmFuc2FjdGlvbignZGF0YScsICdyZWFkd3JpdGUnKTtcbiAgICAgIGNvbnN0IHVyaSA9IGtleVxuICAgICAgICAucmVwbGFjZSgvLiooPz1cXC9lbmNyeXB0ZWRcXC8uKikvLCAnJylcbiAgICAgICAgLnJlcGxhY2UoLy4qKD89XFwvaXBmc1xcLy4qKS8sICcnKTtcbiAgICAgIGxldCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdkYXRhJykuZ2V0KHVyaSk7XG4gICAgICBzdG9yZS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnYWIgZnJvbSBJREI6Jywga2V5KTtcblxuICAgICAgICByZXNvbHZlKGUudGFyZ2V0LnJlc3VsdCk7XG4gICAgICB9O1xuICAgIH07XG4gIH0pO1xufTtcbi8vIEZ1bmN0aW9uIHRvIHN0b3JlIGltYWdlIGRhdGEgdG8gSURCXG5jb25zdCBhYlRvSURCID0gYXN5bmMgZnVuY3Rpb24gKGtleSwgZGF0YSkge1xuICBsZXQgcmVxdWVzdCA9IGF3YWl0IGluZGV4ZWREQi5vcGVuKCdPZmZsaW5lREInLCAxMCk7XG4gIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgIC8vIHJlcXVlc3Qub25lcnJvciA9IGFzeW5jIChlKSA9PiB7XG4gICAgLy8gICBjb25zb2xlLmxvZygnSURCIG5vdCBhdmFpbGFibGUnKTtcbiAgICAvLyB9O1xuICAgIHJlcXVlc3Qub25zdWNjZXNzID0gYXN5bmMgKGUpID0+IHtcbiAgICAgIGxldCBkYiA9IGF3YWl0IHJlcXVlc3QucmVzdWx0O1xuICAgICAgbGV0IHR4ID0gYXdhaXQgZGIudHJhbnNhY3Rpb24oJ2RhdGEnLCAncmVhZHdyaXRlJyk7XG4gICAgICBsZXQgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgnZGF0YScpO1xuICAgICAgY29uc3QgdXJpID0ga2V5XG4gICAgICAgIC5yZXBsYWNlKC8uKig/PVxcL2VuY3J5cHRlZFxcLy4qKS8sICcnKVxuICAgICAgICAucmVwbGFjZSgvLiooPz1cXC9pcGZzXFwvLiopLywgJycpO1xuICAgICAgYXdhaXQgc3RvcmUucHV0KHsgdXJpOiB1cmksIGRhdGE6IGRhdGEgfSk7XG4gICAgICByZXNvbHZlKHR4LmNvbXBsZXRlKTtcbiAgICB9O1xuICB9KTtcbn07XG5cbmNvbnN0IGFsdGVyUmVzcG9uc2UgPSBhc3luYyBmdW5jdGlvbiAocmVzcG9uc2UsIHVybCkge1xuICAvLyBjb25zb2xlLmxvZygndmdtayBuZXcgY2FsbGVkJywgdXJsLCByZXNwb25zZSk7XG4gIHRyeSB7XG4gICAgLy8gY29uc3QgYWIgPSBhd2FpdCBhYkZyb21JREIodXJsKTtcbiAgICAvLyBpZiAoYWIpIHtcbiAgICAvLyAgIGNvbnN0IGtleUJ1ZmYgPSBhd2FpdCBuZXcgVWludDhBcnJheShhYi5kYXRhKTtcbiAgICAvLyAgIC8vIGNvbnNvbGUubG9nKCdWR01LIGZyb20gREInLCB1cmwpO1xuICAgIC8vICAgcmV0dXJuIG5ldyBSZXNwb25zZShrZXlCdWZmLCB7IHN0YXR1czogMjAwLCBzdGF0dXNUZXh0OiAnT2snIH0pO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgY29uc3QgcmVzQ2xvbmUgPSByZXNwb25zZS5jbG9uZSgpO1xuICAgIGNvbnN0IGtleUJ1ZmYgPSBhd2FpdCByZXNDbG9uZVxuICAgICAgLmFycmF5QnVmZmVyKClcbiAgICAgIC50aGVuKChhYikgPT4gbmV3IFVpbnQ4QXJyYXkoYWIpKTtcbiAgICAvLyBjb25zb2xlLmxvZygnbmV3S2V5QnVmZicsIGtleUJ1ZmYpO1xuICAgIGNvbnN0IGZpbGVGb2xkZXIgPSB1cmwucmVwbGFjZSgva2V5XFwudmdtayQvLCAnJyk7XG4gICAgY29uc3QgcXVhbGl0eSA9IFsnNDgwcCcsICcxMjhwJywgJzcyMHAnLCAnMTA4MHAnXTtcbiAgICBsZXQgbTN1OEJsb2I7XG4gICAgbGV0IElWO1xuICAgIGNvbnN0IGZldGNoX3JldHJ5ID0gYXN5bmMgKG4pID0+IHtcbiAgICAgIGxldCBlcnJvcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBgJHtmaWxlRm9sZGVyfSR7cXVhbGl0eVtpXX0ubTN1OGA7XG4gICAgICAgICAgY29uc3QgZmV0Y2hSZXN1bHQgPSBhd2FpdCBmZXRjaChmaWxlUGF0aCk7XG4gICAgICAgICAgaWYgKGZldGNoUmVzdWx0LnN0YXR1cyA9PT0gMjAwKSByZXR1cm4gZmV0Y2hSZXN1bHQ7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGVycm9yID0gZXJyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgfTtcbiAgICBtM3U4QmxvYiA9IGF3YWl0IGZldGNoX3JldHJ5KHF1YWxpdHkubGVuZ3RoKTtcbiAgICAvLyBjb25zb2xlLmxvZygnZ290IG0zdTgnLCBtM3U4QmxvYik7XG4gICAgaWYgKG0zdThCbG9iKSB7XG4gICAgICBJViA9IGF3YWl0IG0zdThCbG9iLnRleHQoKS50aGVuKGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgcmV0dXJuIHN0clxuICAgICAgICAgIC5tYXRjaCgvKElWPTB4KS4rLylcbiAgICAgICAgICAudG9TdHJpbmcoKVxuICAgICAgICAgIC5yZXBsYWNlKCdJVj0weCcsICcnKVxuICAgICAgICAgIC5zbGljZSgwLCA0KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKCdmb3IgSVYnLCBJViwgbTN1OEJsb2IpO1xuICAgIC8vIGRlY3J5cHQgd2l0aCB3YXNtXG4gICAgaWYgKElWKSB7XG4gICAgICBhd2FpdCB3YXNtX2JpbmRnZW4oJy4vY3VzdG9tLndhc20nKTtcbiAgICAgIGNvbnN0IG5ld0J1ZmYgPSB3YXNtX2JpbmRnZW4uZGVjcnlwdChrZXlCdWZmLCBJViwgZmFsc2UpO1xuICAgICAgLy8gY29uc3QgcmV2ZXJzZUJ1ZmYgPSB3YXNtX2JpbmRnZW4uZGVjcnlwdChjYWNoZVt1cmxdLCBJViwgZmFsc2UpO1xuICAgICAgLy8gY29uc29sZS5sb2coJ25ld0J1ZmYgZnJvbSBXQVNNJywgbmV3QnVmZik7XG5cbiAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UobmV3QnVmZiwgeyBzdGF0dXM6IDIwMCwgc3RhdHVzVGV4dDogJ09rJyB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHJlc0Nsb25lO1xuICAgIH1cbiAgICAvLyB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgLy8gY29uc29sZS5sb2coJ2Vycm9yJywgZXJyb3IpO1xuICAgIHJldHVybiByZXNwb25zZTtcbiAgfVxufTtcblxuaW1wb3J0U2NyaXB0cygnLi9uZ3N3LXdvcmtlci5qcycpO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==