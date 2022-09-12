import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { SuperTabsModule } from '@ionic-super-tabs/angular';

import { DocumentPlaylistPageRoutingModule } from './document-playlist-routing.module';

import { DocumentPlaylistPage } from './document-playlist.page';
import { SharedModule } from '../../../features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    SuperTabsModule,
    DocumentPlaylistPageRoutingModule,
  ],
  declarations: [DocumentPlaylistPage],
})
export class DocumentPlaylistPageModule { }
