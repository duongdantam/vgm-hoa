import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { SuperTabsModule } from '@ionic-super-tabs/angular';

import { AudioCatalogPageRoutingModule } from './audio-catalog-routing.module';

import { AudioCatalogPage } from './audio-catalog.page';
import { SharedModule } from '../../../features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    SuperTabsModule,
    AudioCatalogPageRoutingModule,
  ],
  declarations: [AudioCatalogPage],
})
export class AudioCatalogPageModule { }
