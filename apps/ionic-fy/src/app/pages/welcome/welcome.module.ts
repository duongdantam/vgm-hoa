import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { SharedModule } from '../../features/shared/shared.module';
import { WelcomeRoutingModule } from './welcome-routing.module';
import { WelcomeComponent } from './welcome.component';

@NgModule({
  imports: [SharedModule, WelcomeRoutingModule],
  declarations: [WelcomeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WelcomeModule { }
