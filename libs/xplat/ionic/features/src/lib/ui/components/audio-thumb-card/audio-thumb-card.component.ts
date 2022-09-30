import { Component, Input } from '@angular/core';

import { BaseComponent } from '@fy/xplat/core';

@Component({
  selector: 'fy-audio-thumb-card',
  templateUrl: 'audio-thumb-card.component.html',
  styleUrls: ['./audio-thumb-card.component.scss'],
})
export class AudioThumbCardComponent extends BaseComponent {
  @Input() title: string;
  @Input() subtitle: string;
  @Input() href: string;
  @Input() isPlaylist: boolean = false;
  @Input() avatar: string = null;
  @Input() img: string = 'assets/imgs/default-image.svg';
  imgLoading = true;
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
