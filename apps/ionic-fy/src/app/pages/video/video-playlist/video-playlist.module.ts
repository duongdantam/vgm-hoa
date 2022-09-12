import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VideoPlaylistPageRoutingModule } from './video-playlist-routing.module';

import { VideoPlaylistPage } from './video-playlist.page';
import { SharedModule } from '../../../features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    VideoPlaylistPageRoutingModule,
  ],
  declarations: [VideoPlaylistPage],
})
export class VideoPlaylistPageModule { }
