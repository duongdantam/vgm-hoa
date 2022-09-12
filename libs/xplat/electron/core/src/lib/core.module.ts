import { NgModule, Optional, SkipSelf } from '@angular/core';

import { throwIfAlreadyLoaded } from '@fy/xplat/utils';
import { ELECTRON_PROVIDERS, ElectronService } from './services';

@NgModule({
  providers: [...ELECTRON_PROVIDERS],
})
export class FyElectronCoreModule {
  constructor(
    @Optional()
    @SkipSelf()
    parentModule: FyElectronCoreModule,
    private _electronService: ElectronService
  ) {
    throwIfAlreadyLoaded(parentModule, 'FyElectronCoreModule');
  }
}
