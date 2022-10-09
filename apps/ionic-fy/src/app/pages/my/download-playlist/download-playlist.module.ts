import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { SuperTabsModule } from '@ionic-super-tabs/angular';

import { DownloadPlaylistPageRoutingModule } from './download-playlist-routing.module';

import { DownloadPlaylistPage } from './download-playlist.page';
import { SharedModule } from '../../../features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    SuperTabsModule,
    DownloadPlaylistPageRoutingModule,
  ],
  declarations: [DownloadPlaylistPage],
})
export class DownloadPlaylistPageModule { }
