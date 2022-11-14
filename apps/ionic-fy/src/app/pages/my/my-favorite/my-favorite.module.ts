import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { SuperTabsModule } from '@ionic-super-tabs/angular';

import { MyFavoritePageRoutingModule } from './my-favorite-routing.module';

import { MyFavoritePage } from './my-favorite.page';
import { SharedModule } from '../../../features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    SuperTabsModule,
    MyFavoritePageRoutingModule,
  ],
  declarations: [MyFavoritePage],
})
export class MyFavoritePageModule {}
