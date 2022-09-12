import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { SuperTabsModule } from '@ionic-super-tabs/angular';

import { DocumentPageRoutingModule } from './document-routing.module';

import { DocumentPage } from './document.page';
import { SharedModule } from '../../features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    IonicModule,
    SuperTabsModule,
    DocumentPageRoutingModule
  ],
  declarations: [DocumentPage]
})
export class DocumentPageModule { }
