import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VideoTopicPageRoutingModule } from './video-topic-routing.module';

import { VideoTopicPage } from './video-topic.page';
import { SharedModule } from '../../../features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    VideoTopicPageRoutingModule,
  ],
  declarations: [VideoTopicPage],
})
export class VideoTopicPageModule { }
