import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseComponent } from '@fy/xplat/core';
import * as path from 'path';
@Component({
  selector: 'fy-thumb-card',
  templateUrl: 'thumb-card.component.html',
  styleUrls: ['./thumb-card.component.scss'],
})
export class ThumbCardComponent extends BaseComponent {
  @Input() title: string = 'Title video';
  @Input() subtitle: string = '45:05';
  @Input() img: string;
  @Input() isPlaylist: boolean = false;
  @Input() isLeaf: boolean = false;
  @Input() listCount: number = 0;
  imgLoading = true;
  // @Output() public onPreloadData: EventEmitter<string> = new EventEmitter();
  constructor() {
    super();
  }

  imgCheck(type: string) {
    switch (type) {
      case 'error':
        // console.log('img error');
        this.img = 'assets/imgs/default-image.svg';
        this.imgLoading = false;
        break;
      case 'loaded':
        // console.log('img loaded');
        this.imgLoading = false;
        // if (this.isLeaf === null && this.img) {
        //   const dirUrl = path.dirname(path.dirname(this.img));
        //   if (dirUrl !== 'assets') {
        //     this.onPreloadData.next(dirUrl);
        //   }
        // }

        break;
      default:
        this.imgLoading = false;
        break;
    }
  }
}
