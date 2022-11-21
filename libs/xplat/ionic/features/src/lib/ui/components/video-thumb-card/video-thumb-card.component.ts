import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseComponent } from '@fy/xplat/core';
import * as path from 'path';
@Component({
  selector: 'fy-video-thumb-card',
  templateUrl: 'video-thumb-card.component.html',
  styleUrls: ['./video-thumb-card.component.scss'],
})
export class VideoThumbCardComponent extends BaseComponent {
  @Input() title: string;
  @Input() subtitle: string;
  @Input() img: string;
  @Input() isPlaylist: boolean = false;
  @Input() isLeaf: boolean = false;
  @Input() listCount: number = 0;
  @Input() duration: string;
  @Input() isSearch: boolean = false;
  @Input() isCardSlider: boolean = false;
  imgLoading = true;
  // @Output() public onPreloadData: EventEmitter<string> = new EventEmitter();
  constructor() {
    super();
  }

  imgCheck(type: string) {
    switch (type) {
      case 'error':
        // console.log('img error');
        this.img = 'assets/imgs/fy-default-image.svg';
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
