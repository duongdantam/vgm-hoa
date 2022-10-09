import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { SuperTabsModule } from '@ionic-super-tabs/angular';

import { FavoritePlaylistPageRoutingModule } from './favorite-playlist-routing.module';

import { FavoritePlaylistPage } from './favorite-playlist.page';
import { SharedModule } from '../../../features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    SuperTabsModule,
    FavoritePlaylistPageRoutingModule,
  ],
  declarations: [FavoritePlaylistPage],
})
export class FavoritePlaylistPageModule { }
