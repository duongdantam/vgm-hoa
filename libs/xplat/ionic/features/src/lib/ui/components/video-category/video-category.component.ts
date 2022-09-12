import { Component, Input, OnInit } from '@angular/core';

import { BaseComponent } from '@fy/xplat/core';
import { ItemBase } from '@fy/api-interfaces';

@Component({
  selector: 'fy-video-category',
  templateUrl: 'video-category.component.html',
})
export class VideoCategoryComponent extends BaseComponent implements OnInit {
  @Input() name: string;
  @Input() itemList: ItemBase[] = [];

  constructor() {
    super();
  }

  ngOnInit(): void {
    console.log('video-category/itemList', this.itemList);
  }

  getItemThumbnail(hash: string) {
    return 'https://stream.fy.tv/fyV/01_BaiGiang/CacDienGia/MSNHB_DeHiepMotTrongPhucVu/preview/01.jpg';
  }
}
