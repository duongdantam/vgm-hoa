import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BaseComponent } from '@fy/xplat/core';

export interface MenuItemData {
  key: string;
  value: string;
  href: string | null;
}

@Component({
  selector: 'fy-side-menu',
  templateUrl: 'side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent extends BaseComponent {
  @Input() list: MenuItemData[] = [];

  private _activatedAt: string;
  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    super();
    console.log(this.list, this.router.url);
    // activatedRoute.params.subscribe(({ topicUrl }) => {
    //   if (topicUrl) {
    //     this._activatedAt = topicUrl;
    //     console.log(`Side menu id parameter: ${this._activatedAt}`);
    //   }
    // });
  }

  // navigate(path: string) {
  //   this.router.navigate([{ outlets: { primary: path, sidemenu: path } }], {
  //     relativeTo: this.activatedRoute,
  //   });
  // }
}
