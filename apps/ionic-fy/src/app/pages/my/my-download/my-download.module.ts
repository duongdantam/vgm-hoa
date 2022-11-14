import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { SuperTabsModule } from '@ionic-super-tabs/angular';

import { MyDownloadPageRoutingModule } from './my-download-routing.module';

import { MyDownloadPage } from './my-download.page';
import { SharedModule } from '../../../features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    SuperTabsModule,
    MyDownloadPageRoutingModule,
  ],
  declarations: [MyDownloadPage],
})
export class MyDownloadPageModule {}
