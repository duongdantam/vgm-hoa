const fs = require('fs');

const versionCode = '100002';
const versionName = '1.0.2';
const icBGColor = '#ee6c61';

const styleXML = 'android/app/src/main/res/values/styles.xml';
fs.readFile(styleXML, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(
    `<item name="android:background">@drawable/splash</item>`,
    `<item name="android:background">@drawable/splash</item>
        <item name="android:windowNoTitle">false</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowFullscreen">false</item>
        <item name="android:windowContentOverlay">@null</item>
        <item name="android:windowIsTranslucent">true</item>`
  );

  fs.writeFile(styleXML, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});

const permission = 'android/app/src/main/AndroidManifest.xml';
fs.readFile(permission, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var permissionResult = data
    // .replace(/.*(android.hardware.location.gps).*/, '')
    // .replace(/.*(android.permission.CAMERA).*/, '')
    // .replace(/.*(android.permission.RECORD_AUDIO).*/, '');
    .replace(/application/, `application android:usesCleartextTraffic="true"`);

  fs.writeFile(permission, permissionResult, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});

const mainActivity =
  'android/app/src/main/java/com/fuyin/media/MainActivity.java';
fs.readFile(mainActivity, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var mainActivityResult = data
    .replace(
      /(import com.getcapacitor.BridgeActivity;)/,
      `import com.ingageco.capacitormusiccontrols.CapacitorMusicControls;
    import android.os.Bundle;
    import android.webkit.ServiceWorkerClient;
    import android.webkit.ServiceWorkerController;
    import android.webkit.WebResourceRequest;
    import android.webkit.WebResourceResponse;
    import com.getcapacitor.BridgeActivity;`
    )
    .replace(
      'BridgeActivity {}',
      `BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
registerPlugin(CapacitorMusicControls.class);
  if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
    ServiceWorkerController swController = null;
    swController = ServiceWorkerController.getInstance();
    swController.setServiceWorkerClient(new ServiceWorkerClient() {
      @Override
      public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
        return bridge.getLocalServer().shouldInterceptRequest(request);
      }
    });
  }
  }
}`
    );

  fs.writeFile(mainActivity, mainActivityResult, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});

const version = 'android/app/build.gradle';
fs.readFile(version, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var versionResult = data
    .replace(/(versionCode).*/, `versionCode ${versionCode}`)
    .replace(/(versionName).*/, `versionName "${versionName}"`);

  fs.writeFile(version, versionResult, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});

const sdk = 'android/variables.gradle';
fs.readFile(sdk, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var sdkResult = data
    .replace(/(compileSdkVersion).*/, 'compileSdkVersion = 33')
    .replace(/(targetSdkVersion).*/, 'targetSdkVersion = 33');

  fs.writeFile(sdk, sdkResult, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});

const icBG = 'android/app/src/main/res/values/ic_launcher_background.xml';
fs.readFile(icBG, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var icBGResult = data.replace(/#\w{6}/, `${icBGColor}`);

  fs.writeFile(icBG, icBGResult, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});

// const bgFetch = 'android/build.gradle';
// fs.readFile(bgFetch, 'utf8', function (err, data) {
//   if (err) {
//     return console.log(err);
//   }
//   var bgFetchResult = data.replace(
//     /(allprojects).*\n.*\n.*\n.*/,
//     `allprojects {
//     repositories {
//         google()
//         jcenter()
//         maven {
//           url(\"\${project(':transistorsoft-capacitor-background-fetch').projectDir}/libs")
//         }`
//   );

//   fs.writeFile(bgFetch, bgFetchResult, 'utf8', function (err) {
//     if (err) return console.log(err);
//   });
// });

// const bgFetchRule = 'android/app/proguard-rules.pro';
// const bgFetchRuleResult = `-keep class **BackgroundFetchHeadlessTask { *; }`;
// fs.appendFile(bgFetchRule, bgFetchRuleResult, function (err) {
//   if (err) throw err;
// });
