import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AudioTopicPageRoutingModule } from './audio-topic-routing.module';

import { AudioTopicPage } from './audio-topic.page';
import { SharedModule } from '../../../features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    AudioTopicPageRoutingModule,
  ],
  declarations: [AudioTopicPage],
})
export class AudioTopicPageModule { }
