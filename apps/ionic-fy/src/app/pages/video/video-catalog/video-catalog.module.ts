import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { SuperTabsModule } from '@ionic-super-tabs/angular';

import { VideoCatalogPageRoutingModule } from './video-catalog-routing.module';

import { VideoCatalogPage } from './video-catalog.page';
import { SharedModule } from '../../../features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    SuperTabsModule,
    VideoCatalogPageRoutingModule,
  ],
  declarations: [VideoCatalogPage],
})
export class VideoCatalogPageModule { }
