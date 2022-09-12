import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AudioSearchPageRoutingModule } from './audio-search-routing.module';

import { AudioSearchPage } from './audio-search.page';
import { SharedModule } from '../../../features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    AudioSearchPageRoutingModule,
  ],
  declarations: [AudioSearchPage],
})
export class AudioSearchPageModule { }
