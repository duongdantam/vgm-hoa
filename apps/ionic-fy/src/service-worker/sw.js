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


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vYXBwcy9pb25pYy1meS9zcmMvc2VydmljZS13b3JrZXIvc2VydmljZS13b3JrZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtRQUFBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBOzs7UUFHQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMENBQTBDLGdDQUFnQztRQUMxRTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLHdEQUF3RCxrQkFBa0I7UUFDMUU7UUFDQSxpREFBaUQsY0FBYztRQUMvRDs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0EseUNBQXlDLGlDQUFpQztRQUMxRSxnSEFBZ0gsbUJBQW1CLEVBQUU7UUFDckk7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSwyQkFBMkIsMEJBQTBCLEVBQUU7UUFDdkQsaUNBQWlDLGVBQWU7UUFDaEQ7UUFDQTtRQUNBOztRQUVBO1FBQ0Esc0RBQXNELCtEQUErRDs7UUFFckg7UUFDQTs7O1FBR0E7UUFDQTs7Ozs7Ozs7Ozs7O0FDbEZBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0EsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVEO0FBQ0E7QUFDQSxJQUFJOztBQUVKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsZ0NBQWdDO0FBQzlFOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMENBQTBDLFFBQVEsRUFBRSxTQUFTO0FBQzdEO0FBQ0E7QUFDQTtBQUNBLFdBQVc7QUFDWDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLHVCQUF1QjtBQUM5QztBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXVDLGdDQUFnQztBQUN2RSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQixPQUFPO0FBQzVCO0FBQ0EsOEJBQThCLFdBQVcsRUFBRSxXQUFXO0FBQ3REO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxvQ0FBb0MsZ0NBQWdDO0FBQ3BFLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUEiLCJmaWxlIjoic3cuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL2FwcHMvaW9uaWMtZnkvc3JjL3NlcnZpY2Utd29ya2VyL3NlcnZpY2Utd29ya2VyLmpzXCIpO1xuIiwiaW1wb3J0U2NyaXB0cygnLi9jdXN0b20uanMnKTtcblxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdpbnN0YWxsJywgKGV2ZW50KSA9PiB7XG4gIGV2ZW50LndhaXRVbnRpbChldmVudC50YXJnZXQuc2tpcFdhaXRpbmcoKSk7XG4gIC8vIGNvbnNvbGUubG9nKCdTZXJ2aWNlIFdvcmtlciBpbnN0YWxsaW5nJywgZXZlbnQpO1xuICAvLyBldmVudC53YWl0VW50aWwoXG4gIC8vICAgY2FjaGVzLm9wZW4oJ3YxJykudGhlbigoY2FjaGUpID0+IHtcbiAgLy8gICAgIHJldHVybiBjYWNoZS5hZGRBbGwoWycuLycsICcuL2luZGV4Lmh0bWwnXSk7XG4gIC8vICAgfSlcbiAgLy8gKTtcbn0pO1xuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2FjdGl2YXRlJywgYXN5bmMgKGV2ZW50KSA9PiB7XG4gIGNvbnNvbGUubG9nKCdTZXJ2aWNlIFdvcmtlciBhY3RpdmF0ZWQ6JywgZXZlbnQpO1xuICBldmVudC53YWl0VW50aWwoZXZlbnQudGFyZ2V0LmNsaWVudHMuY2xhaW0oKSk7XG59KTtcblxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdub3RpZmljYXRpb25jbGljaycsIChldmVudCkgPT4ge1xuICBldmVudC5ub3RpZmljYXRpb24uY2xvc2UoKTtcbiAgY29uc29sZS5sb2coJ25vdGlmaWNhdGlvbiBkZXRhaWxzIGZyb20gU1c6ICcsIGV2ZW50Lm5vdGlmaWNhdGlvbik7XG59KTtcblxuLy8gc2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50KSA9PiB7XG4vLyAgIGNvbnNvbGUubG9nKCdtZXNzYWdlIGZyb20gbWFpbjonLCBldmVudC5kYXRhKTtcbi8vIH0pO1xuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2ZldGNoJywgYXN5bmMgZnVuY3Rpb24gKGV2ZW50KSB7XG4gIC8vIElmIHRoZSByZXF1ZXN0IGluIEdFVCwgbGV0IHRoZSBuZXR3b3JrIGhhbmRsZSB0aGluZ3MsXG4gIGlmIChcbiAgICBldmVudC5yZXF1ZXN0Lm1ldGhvZCAhPT0gJ0dFVCdcbiAgICAvLyB8fCAvKFxcLmpwZykkfChcXC5qcGVnKSR8KFxcLndlYnApJC8udGVzdChldmVudC5yZXF1ZXN0LnVybClcbiAgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gICBoZXJlIHdlIGJsb2NrIHRoZSByZXF1ZXN0IGFuZCBoYW5kbGUgaXQgb3VyIHNlbHZlc1xuICBldmVudC5yZXNwb25kV2l0aChcbiAgICAvLyBjb25zb2xlLmxvZygnU2VydmljZSBXb3JrZXIgZmV0Y2hpbmcuIFxcbicsIGV2ZW50LnJlcXVlc3QudXJsLCByZXNwb25zZSlcbiAgICAvLyBSZXR1cm5zIGEgcHJvbWlzZSBvZiB0aGUgY2FjaGUgZW50cnkgdGhhdCBtYXRjaGVzIHRoZSByZXF1ZXN0XG4gICAgKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdldmVudCByZXF1ZXN0JywgZXZlbnQucmVxdWVzdCwgcmVzcG9uc2UpO1xuICAgICAgLy8gVHJ5IHRvIGdldCB0aGUgcmVzcG9uc2UgZnJvbSBhIGNhY2hlLlxuICAgICAgY29uc3QgY2FjaGVkUmVzcG9uc2UgPSBhd2FpdCBjYWNoZXMubWF0Y2goZXZlbnQucmVxdWVzdCk7XG4gICAgICAvLyBSZXR1cm4gaXQgaWYgd2UgZm91bmQgb25lLlxuICAgICAgaWYgKGNhY2hlZFJlc3BvbnNlKSByZXR1cm4gY2FjaGVkUmVzcG9uc2U7XG4gICAgICAvLyBJZiB3ZSBkaWRuJ3QgZmluZCBhIG1hdGNoIGluIHRoZSBjYWNoZSwgdXNlIHRoZSBuZXR3b3JrLlxuICAgICAgLy8gIGlmIGRhdGEgc3RvcmVkIGluIGluZGV4ZWRkYiBmb3Igb2ZmbGluZSBtb2RlLCBsZXQncyByZXR1cm4gdGhhdCBpbnN0ZWFkXG5cbiAgICAgIC8vIGhhbmRsZSBtM3U4IGFuZCB2Z214IGFuZCB2Z21rIGZpbGVcbiAgICAgIGlmIChcbiAgICAgICAgLyhcXC5tM3U4KSR8KFxcLnZnbXgpJHwoXFwudmdtaykkfChcXC5qcGcpJHwoXFwuanBlZykkfChcXC53ZWJwKSQvLnRlc3QoXG4gICAgICAgICAgZXZlbnQucmVxdWVzdC51cmxcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIGNvbnN0IGFiID0gYXdhaXQgYWJGcm9tSURCKGV2ZW50LnJlcXVlc3QudXJsKTtcbiAgICAgICAgY29uc29sZS5sb2coJ2dldHRpbmcgSU1HIGZyb20gSURCOjonLCBldmVudC5yZXF1ZXN0LnVybCwgYWIpO1xuICAgICAgICBpZiAoYWIpIHJldHVybiBuZXcgUmVzcG9uc2UoYWIuZGF0YSwgeyBzdGF0dXM6IDIwMCwgc3RhdHVzVGV4dDogJ09rJyB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gIGlmICgvKFxcLmpwZykkfChcXC5qcGVnKSR8KFxcLndlYnApJC8udGVzdChldmVudC5yZXF1ZXN0LnVybCkpIHtcbiAgICAgIC8vICAgLy8gY29uc29sZS5sb2coJ2ltZyByZXNwb25zZTonLCBmZXRjaFJlc3BvbnNlKTtcbiAgICAgIC8vICAgY29uc3QgaW1nQnVmZiA9IGF3YWl0IChhd2FpdCBmZXRjaChldmVudC5yZXF1ZXN0LnVybCkpLmFycmF5QnVmZmVyKCk7XG4gICAgICAvLyAgIC8vIGNvbnNvbGUubG9nKCdnb3QgaW1nIGJ1ZmYnLCBpbWdCdWZmKTtcbiAgICAgIC8vICAgY29uc3QgaXRlbSA9IHsgdXJpOiBldmVudC5yZXF1ZXN0LnVybCwgZGF0YTogaW1nQnVmZiB9O1xuICAgICAgLy8gICBhd2FpdCBhYlRvSURCKGl0ZW0pO1xuICAgICAgLy8gICAvLyBjb25zb2xlLmxvZygnaW1nIHJlcXVlc3Q6JywgZXZlbnQucmVxdWVzdC51cmwpO1xuICAgICAgLy8gfVxuXG4gICAgICAvLyBpZiB0aGUgcmVzcG9uc2UgaXMgbm90IGluIHRoZSBjYWNoZSwgbGV0J3MgZmV0Y2ggaXRcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChldmVudC5yZXF1ZXN0KTtcblxuICAgICAgaWYgKCFyZXNwb25zZSkge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICB9XG5cbiAgICAgIGxldCBmZXRjaFJlc3BvbnNlID0gcmVzcG9uc2U7XG4gICAgICBpZiAocmVzcG9uc2UudHlwZSA9PT0gJ29wYXF1ZScpIHtcbiAgICAgICAgZmV0Y2hSZXNwb25zZSA9IGF3YWl0IGZldGNoKGV2ZW50LnJlcXVlc3QudXJsKTtcbiAgICAgIH1cblxuICAgICAgaWYgKC8oXFwudmdtaykkLy50ZXN0KGV2ZW50LnJlcXVlc3QudXJsKSkge1xuICAgICAgICBjbG9uZVJlc3BvbnNlID0gZmV0Y2hSZXNwb25zZS5jbG9uZSgpO1xuICAgICAgICByZXR1cm4gYXdhaXQgYWx0ZXJSZXNwb25zZShjbG9uZVJlc3BvbnNlLCBldmVudC5yZXF1ZXN0LnVybCk7XG4gICAgICB9XG5cbiAgICAgIGlmICgvKFxcLmpwZykkfChcXC5qcGVnKSR8KFxcLndlYnApJC8udGVzdChldmVudC5yZXF1ZXN0LnVybCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZldGNoaW5nIElNRzo6JywgZmV0Y2hSZXNwb25zZSk7XG4gICAgICAgIGxldCBpbWdCdWZmO1xuICAgICAgICBpZiAoZmV0Y2hSZXNwb25zZS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgIGltZ0J1ZmYgPSBhd2FpdCBmZXRjaFJlc3BvbnNlLmNsb25lKCkuYXJyYXlCdWZmZXIoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBkaXJOYW1lID0gZXZlbnQucmVxdWVzdC51cmwubWF0Y2goLy4rXFwvLykudG9TdHJpbmcoKTtcbiAgICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGV2ZW50LnJlcXVlc3QudXJsXG4gICAgICAgICAgICAubWF0Y2goLyg/IS4qXFwvKS4rLylcbiAgICAgICAgICAgIC50b1N0cmluZygpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxkKy8sIDEpO1xuICAgICAgICAgIGltZ0J1ZmYgPSBhd2FpdCAoYXdhaXQgZmV0Y2goYCR7ZGlyTmFtZX0ke2ZpbGVOYW1lfWApKS5hcnJheUJ1ZmZlcigpO1xuICAgICAgICAgIGZldGNoUmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UoaW1nQnVmZiwge1xuICAgICAgICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICAgICAgICBzdGF0dXNUZXh0OiAnT2snLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2dvdCBpbWcgYnVmZicsIGltZ0J1ZmYpO1xuICAgICAgICBhd2FpdCBhYlRvSURCKGV2ZW50LnJlcXVlc3QudXJsLCBpbWdCdWZmKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2ltZyByZXF1ZXN0OicsIGV2ZW50LnJlcXVlc3QudXJsKTtcbiAgICAgICAgcmV0dXJuIGZldGNoUmVzcG9uc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmV0Y2hSZXNwb25zZTtcbiAgICB9KSgpXG4gICk7XG4gIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xufSk7XG5cbmNvbnN0IGFiRnJvbUlEQiA9IGFzeW5jIGZ1bmN0aW9uIChrZXkpIHtcbiAgY29uc29sZS5sb2coJ2FiRnJvbUlEQiBjYWxsZWQ6OicsIGtleSk7XG4gIGxldCByZXF1ZXN0ID0gYXdhaXQgaW5kZXhlZERCLm9wZW4oJ09mZmxpbmVEQicsIDEwKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XG4gICAgLy8gcmVxdWVzdC5vbmVycm9yID0gYXN5bmMgKGUpID0+IHtcbiAgICAvLyAgIGNvbnNvbGUubG9nKCdJREIgbm90IGF2YWlsYWJsZScpO1xuICAgIC8vIH07XG4gICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgbGV0IGRiID0gYXdhaXQgcmVxdWVzdC5yZXN1bHQ7XG4gICAgICBsZXQgdHggPSBhd2FpdCBkYi50cmFuc2FjdGlvbignZGF0YScsICdyZWFkd3JpdGUnKTtcbiAgICAgIGNvbnN0IHVyaSA9IGtleVxuICAgICAgICAucmVwbGFjZSgvLiooPz1cXC9lbmNyeXB0ZWRcXC8uKikvLCAnJylcbiAgICAgICAgLnJlcGxhY2UoLy4qKD89XFwvaXBmc1xcLy4qKS8sICcnKTtcbiAgICAgIGxldCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdkYXRhJykuZ2V0KHVyaSk7XG4gICAgICBzdG9yZS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnYWIgZnJvbSBJREI6Jywga2V5KTtcblxuICAgICAgICByZXNvbHZlKGUudGFyZ2V0LnJlc3VsdCk7XG4gICAgICB9O1xuICAgIH07XG4gIH0pO1xufTtcbi8vIEZ1bmN0aW9uIHRvIHN0b3JlIGltYWdlIGRhdGEgdG8gSURCXG5jb25zdCBhYlRvSURCID0gYXN5bmMgZnVuY3Rpb24gKGtleSwgZGF0YSkge1xuICBjb25zb2xlLmxvZygnYWJUb0lEQiBjYWxsZWQ6OicsIGtleSk7XG4gIGxldCByZXF1ZXN0ID0gYXdhaXQgaW5kZXhlZERCLm9wZW4oJ09mZmxpbmVEQicsIDEwKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XG4gICAgLy8gcmVxdWVzdC5vbmVycm9yID0gYXN5bmMgKGUpID0+IHtcbiAgICAvLyAgIGNvbnNvbGUubG9nKCdJREIgbm90IGF2YWlsYWJsZScpO1xuICAgIC8vIH07XG4gICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSBhc3luYyAoZSkgPT4ge1xuICAgICAgbGV0IGRiID0gYXdhaXQgcmVxdWVzdC5yZXN1bHQ7XG4gICAgICBsZXQgdHggPSBhd2FpdCBkYi50cmFuc2FjdGlvbignZGF0YScsICdyZWFkd3JpdGUnKTtcbiAgICAgIGxldCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdkYXRhJyk7XG4gICAgICBjb25zdCB1cmkgPSBrZXlcbiAgICAgICAgLnJlcGxhY2UoLy4qKD89XFwvZW5jcnlwdGVkXFwvLiopLywgJycpXG4gICAgICAgIC5yZXBsYWNlKC8uKig/PVxcL2lwZnNcXC8uKikvLCAnJyk7XG4gICAgICBhd2FpdCBzdG9yZS5wdXQoeyB1cmk6IHVyaSwgZGF0YTogZGF0YSB9KTtcbiAgICAgIHJlc29sdmUodHguY29tcGxldGUpO1xuICAgIH07XG4gIH0pO1xufTtcblxuY29uc3QgYWx0ZXJSZXNwb25zZSA9IGFzeW5jIGZ1bmN0aW9uIChyZXNwb25zZSwgdXJsKSB7XG4gIC8vIGNvbnNvbGUubG9nKCd2Z21rIG5ldyBjYWxsZWQnLCB1cmwsIHJlc3BvbnNlKTtcbiAgdHJ5IHtcbiAgICAvLyBjb25zdCBhYiA9IGF3YWl0IGFiRnJvbUlEQih1cmwpO1xuICAgIC8vIGlmIChhYikge1xuICAgIC8vICAgY29uc3Qga2V5QnVmZiA9IGF3YWl0IG5ldyBVaW50OEFycmF5KGFiLmRhdGEpO1xuICAgIC8vICAgLy8gY29uc29sZS5sb2coJ1ZHTUsgZnJvbSBEQicsIHVybCk7XG4gICAgLy8gICByZXR1cm4gbmV3IFJlc3BvbnNlKGtleUJ1ZmYsIHsgc3RhdHVzOiAyMDAsIHN0YXR1c1RleHQ6ICdPaycgfSk7XG4gICAgLy8gfSBlbHNlIHtcbiAgICBjb25zdCByZXNDbG9uZSA9IHJlc3BvbnNlLmNsb25lKCk7XG4gICAgY29uc3Qga2V5QnVmZiA9IGF3YWl0IHJlc0Nsb25lXG4gICAgICAuYXJyYXlCdWZmZXIoKVxuICAgICAgLnRoZW4oKGFiKSA9PiBuZXcgVWludDhBcnJheShhYikpO1xuICAgIC8vIGNvbnNvbGUubG9nKCduZXdLZXlCdWZmJywga2V5QnVmZik7XG4gICAgY29uc3QgZmlsZUZvbGRlciA9IHVybC5yZXBsYWNlKC9rZXlcXC52Z21rJC8sICcnKTtcbiAgICBjb25zdCBxdWFsaXR5ID0gWyc0ODBwJywgJzEyOHAnLCAnNzIwcCcsICcxMDgwcCddO1xuICAgIGxldCBtM3U4QmxvYjtcbiAgICBsZXQgSVY7XG4gICAgY29uc3QgZmV0Y2hfcmV0cnkgPSBhc3luYyAobikgPT4ge1xuICAgICAgbGV0IGVycm9yO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IGAke2ZpbGVGb2xkZXJ9JHtxdWFsaXR5W2ldfS5tM3U4YDtcbiAgICAgICAgICBjb25zdCBmZXRjaFJlc3VsdCA9IGF3YWl0IGZldGNoKGZpbGVQYXRoKTtcbiAgICAgICAgICBpZiAoZmV0Y2hSZXN1bHQuc3RhdHVzID09PSAyMDApIHJldHVybiBmZXRjaFJlc3VsdDtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgZXJyb3IgPSBlcnI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICB9O1xuICAgIG0zdThCbG9iID0gYXdhaXQgZmV0Y2hfcmV0cnkocXVhbGl0eS5sZW5ndGgpO1xuICAgIC8vIGNvbnNvbGUubG9nKCdnb3QgbTN1OCcsIG0zdThCbG9iKTtcbiAgICBpZiAobTN1OEJsb2IpIHtcbiAgICAgIElWID0gYXdhaXQgbTN1OEJsb2IudGV4dCgpLnRoZW4oZnVuY3Rpb24gKHN0cikge1xuICAgICAgICByZXR1cm4gc3RyXG4gICAgICAgICAgLm1hdGNoKC8oSVY9MHgpLisvKVxuICAgICAgICAgIC50b1N0cmluZygpXG4gICAgICAgICAgLnJlcGxhY2UoJ0lWPTB4JywgJycpXG4gICAgICAgICAgLnNsaWNlKDAsIDQpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coJ2ZvciBJVicsIElWLCBtM3U4QmxvYik7XG4gICAgLy8gZGVjcnlwdCB3aXRoIHdhc21cbiAgICBpZiAoSVYpIHtcbiAgICAgIGF3YWl0IHdhc21fYmluZGdlbignLi9jdXN0b20ud2FzbScpO1xuICAgICAgY29uc3QgbmV3QnVmZiA9IHdhc21fYmluZGdlbi5kZWNyeXB0KGtleUJ1ZmYsIElWLCBmYWxzZSk7XG4gICAgICAvLyBjb25zdCByZXZlcnNlQnVmZiA9IHdhc21fYmluZGdlbi5kZWNyeXB0KGNhY2hlW3VybF0sIElWLCBmYWxzZSk7XG4gICAgICAvLyBjb25zb2xlLmxvZygnbmV3QnVmZiBmcm9tIFdBU00nLCBuZXdCdWZmKTtcblxuICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShuZXdCdWZmLCB7IHN0YXR1czogMjAwLCBzdGF0dXNUZXh0OiAnT2snIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcmVzQ2xvbmU7XG4gICAgfVxuICAgIC8vIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBjb25zb2xlLmxvZygnZXJyb3InLCBlcnJvcik7XG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9XG59O1xuXG5pbXBvcnRTY3JpcHRzKCcuL25nc3ctd29ya2VyLmpzJyk7XG4iXSwic291cmNlUm9vdCI6IiJ9