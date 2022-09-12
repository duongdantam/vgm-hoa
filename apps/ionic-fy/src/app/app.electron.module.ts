import { NgModule } from '@angular/core';
import { FyElectronCoreModule } from '@fy/xplat/electron/core';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';

@NgModule({
  imports: [AppModule, FyElectronCoreModule],
  bootstrap: [AppComponent],
})
export class AppElectronModule { }
