import { Component, Input, OnInit } from '@angular/core';

import { BaseComponent } from '@fy/xplat/core';
import { DataFetchService } from '@fy/xplat/core';
@Component({
  selector: 'fy-audio-thumb-card',
  templateUrl: 'audio-thumb-card.component.html',
  styleUrls: ['./audio-thumb-card.component.scss'],
})
export class AudioThumbCardComponent extends BaseComponent implements OnInit {
  @Input() title: string;
  @Input() subtitle: string;
  @Input() href: string;
  @Input() isPlaylist: boolean = false;
  @Input() isLeaf: boolean = false;
  @Input() avatar: string = null;
  @Input() isCardSlider: boolean = false;
  @Input() img: string = '';
  @Input() duration: string;

  imgLoading = true;
  constructor(public dataFetchService: DataFetchService) {
    super();
  }

  async ngOnInit() {
    if (!this.img) {
      const random = Math.ceil(Math.random() * 50);
      // this.img = this.dataFetchService.defaultImgs + '/' + random + '.webp';
      this.img = `${this.dataFetchService.defaultImgs}/${random}.webp`;
    }
    // console.log('img::::::', this.img);
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
