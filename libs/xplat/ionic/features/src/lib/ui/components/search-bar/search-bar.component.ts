import { Component } from '@angular/core';

import { BaseComponent } from '@fy/xplat/core';

@Component({
  selector: 'fy-search-bar',
  templateUrl: 'search-bar.component.html',
})
export class SearchBarComponent extends BaseComponent {
  constructor() {
    super();
  }
}
