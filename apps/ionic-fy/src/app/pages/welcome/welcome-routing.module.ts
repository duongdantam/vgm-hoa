import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WelcomeComponent } from './welcome.component';

export const WelcomeRoutes: Routes = [
  {
    path: '',
    component: WelcomeComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(WelcomeRoutes)],
  exports: [RouterModule],
})
export class WelcomeRoutingModule { }
