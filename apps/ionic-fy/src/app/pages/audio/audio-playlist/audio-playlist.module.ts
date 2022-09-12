import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AudioPlaylistPageRoutingModule } from './audio-playlist-routing.module';

import { AudioPlaylistPage } from './audio-playlist.page';
import { SharedModule } from '../../../features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    AudioPlaylistPageRoutingModule,
  ],
  declarations: [AudioPlaylistPage],
})
export class AudioPlaylistPageModule {}
