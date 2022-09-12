import { NgModule, Optional, SkipSelf } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
// import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { WebServer } from '@awesome-cordova-plugins/web-server/ngx';
import { File as nativeFile } from '@awesome-cordova-plugins/file/ngx';
// import { BackgroundFetch } from '@ionic-native/background-fetch/ngx';
// import { Downloader } from '@ionic-native/downloader/ngx';
// import { GoogleAnalytics } from '@ionic-native/google-analytics/ngx';
import { throwIfAlreadyLoaded } from '@fy/xplat/utils';
import { FyCoreModule } from '@fy/xplat/web/core';

import { customAnimation } from './animation';

@NgModule({
  imports: [
    FyCoreModule,
    // ROOT IONIC MODULE
    // IonicModule.forRoot({ navAnimation: fancyAnimation }),
    IonicModule.forRoot({
      navAnimation: customAnimation,
      rippleEffect: false,
      mode: 'ios',
    }),
  ],
  providers: [
    StatusBar,
    // SplashScreen,
    ScreenOrientation,
    WebServer,
    nativeFile,
    // BackgroundFetch,
    // Downloader,
    // GoogleAnalytics,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
})
export class FyIonicCoreModule {
  constructor(
    @Optional()
    @SkipSelf()
    parentModule: FyIonicCoreModule
  ) {
    throwIfAlreadyLoaded(parentModule, 'FyIonicCoreModule');
  }
}
