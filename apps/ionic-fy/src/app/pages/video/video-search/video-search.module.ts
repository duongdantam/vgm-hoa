import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VideoSearchPageRoutingModule } from './video-search-routing.module';

import { VideoSearchPage } from './video-search.page';
import { SharedModule } from '../../../features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    VideoSearchPageRoutingModule,
  ],
  declarations: [VideoSearchPage],
})
export class VideoSearchPageModule { }
