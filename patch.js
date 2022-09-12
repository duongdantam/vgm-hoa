const fs = require('fs');
const f =
  'node_modules/@angular-devkit/build-angular/src/webpack/configs/browser.js';
fs.readFile(f, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(
    /node: false/g,
    'node: {crypto: true, stream: true, fs: "empty"}'
  );

  fs.writeFile(f, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});

const sptabs = 'node_modules/@ionic-super-tabs/core/dist/esm/utils-640d2cf5.js';
fs.readFile(sptabs, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/console.log\(`%csuper-tabs.*/g, '');

  fs.writeFile(sptabs, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});

const ionMenu = 'node_modules/@ionic/core/dist/esm/ion-menu_3.entry.js';
fs.readFile(ionMenu, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var result = data
    .replace(
      /\'menu-pane-visible\'\:\sisPaneVisible/,
      "'menu-pane-visible': true"
    )
    .replace(/console\.error/g, '// console.error');

  fs.writeFile(ionMenu, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});

const ionToast = 'node_modules/@ionic/core/dist/esm/ion-toast.entry.js';
fs.readFile(ionToast, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var toastResult = data
    .replace(/(bottom\:0)/, 'bottom:-10px')
    .replace(/(font-weight\:500)/g, 'font-weight:bold');

  fs.writeFile(ionToast, toastResult, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});

const videoJS = 'node_modules/video.js/dist/video.es.js';
fs.readFile(videoJS, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var videoJSResult = data.replace('passive: true', 'passive: false');

  fs.writeFile(videoJS, videoJSResult, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});

// fs.copyFileSync(
//   'apps/ionic-fy/src/assets/fy-icons/fy-forward-10s.svg',
//   'node_modules/videojs-font/custom-icons/fy-forward-10s.svg'
// );

// fs.copyFileSync(
//   'apps/ionic-fy/src/assets/fy-icons/fy-rewind-10s.svg',
//   'node_modules/videojs-font/custom-icons/fy-rewind-10s.svg'
// );

// const videojsIcons = 'node_modules/videojs-font/icons.json';
// fs.readFile(videojsIcons, 'utf8', function (err, data) {
//   if (err) {
//     return console.log(err);
//   }
//   var button = [
//     {
//       name: 'forward-10s',
//       svg: 'fy-forward-10s.svg',
//       'root-dir': './custom-icons/',
//     },
//     {
//       name: 'rewind-10s',
//       svg: 'fy-rewind-10s.svg',
//       'root-dir': './custom-icons/',
//     },
//   ];
//   var iconResult = JSON.parse(data);
//   button.forEach((btn) => {
//     const index = iconResult.icons.findIndex((item) => item.name === btn.name);
//     if (index < 0) {
//       iconResult.icons.push(btn);
//     }
//   });
//   fs.writeFile(
//     videojsIcons,
//     JSON.stringify(iconResult, null, 2),
//     'utf8',
//     function (err) {
//       if (err) return console.log(err);
//     }
//   );
// });
