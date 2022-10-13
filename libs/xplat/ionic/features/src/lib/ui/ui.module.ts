import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { UIModule as UIWebModule } from '@fy/xplat/web/features';
import {
  AudioPlayerWidgetComponent,
  AudioThumbCardComponent,
  DesktopPageHeaderComponent,
  HeaderComponent,
  MobileAudioCategoryComponent,
  MobilePageHeaderComponent,
  MobileVideoCategoryComponent,
  VideoCardSliderComponent,
  VideoPlayerWidgetComponent,
  SearchBarComponent,
  SideMenuComponent,
  VideoThumbCardComponent,
  TopMenuComponent,
  VideoCategoryComponent,
  SocialShareModalComponent,
  AudioCardSliderComponent,
} from './components';
import { AudioPlayListComponent } from './components/audio-play-list/audio-play-list.component';
import { ImgFallbackDirective } from './directives';
import { RangeDirective } from './directives';

@NgModule({
  imports: [UIWebModule, IonicModule],
  declarations: [
    // Components
    HeaderComponent,
    SideMenuComponent,
    TopMenuComponent,
    SearchBarComponent,
    VideoThumbCardComponent,
    VideoCategoryComponent,
    DesktopPageHeaderComponent,
    MobilePageHeaderComponent,
    MobileVideoCategoryComponent,
    VideoPlayerWidgetComponent,
    VideoCardSliderComponent,
    // Audio
    AudioThumbCardComponent,
    AudioPlayListComponent,
    MobileAudioCategoryComponent,
    AudioPlayerWidgetComponent,
    AudioCardSliderComponent,
    // Directives
    SocialShareModalComponent,
    ImgFallbackDirective,
    RangeDirective,
  ],
  exports: [
    // Component
    UIWebModule,
    IonicModule,
    HeaderComponent,
    SideMenuComponent,
    TopMenuComponent,
    SearchBarComponent,
    VideoThumbCardComponent,
    VideoCategoryComponent,
    DesktopPageHeaderComponent,
    MobilePageHeaderComponent,
    MobileVideoCategoryComponent,
    VideoCardSliderComponent,
    VideoPlayerWidgetComponent,
    // Audio
    AudioThumbCardComponent,
    AudioPlayListComponent,
    MobileAudioCategoryComponent,
    AudioPlayerWidgetComponent,
    AudioCardSliderComponent,
    // Directives
    SocialShareModalComponent,
    ImgFallbackDirective,
    RangeDirective,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class UIModule {}
