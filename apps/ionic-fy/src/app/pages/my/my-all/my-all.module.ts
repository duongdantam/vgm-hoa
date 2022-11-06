import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { SuperTabsModule } from '@ionic-super-tabs/angular';

import { MyAllPageRoutingModule } from './my-all-routing.module';

import { MyAllPage } from './my-all.page';
import { SharedModule } from '../../../features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    SuperTabsModule,
    MyAllPageRoutingModule,
  ],
  declarations: [MyAllPage],
})
export class MyAllPageModule { }
