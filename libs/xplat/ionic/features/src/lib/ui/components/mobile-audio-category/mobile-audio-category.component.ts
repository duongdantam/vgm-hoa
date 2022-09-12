import { Component, Input } from '@angular/core';
import { BaseComponent } from '@fy/xplat/core';

@Component({
  selector: 'fy-mobile-audio-category',
  templateUrl: 'mobile-audio-category.component.html',
  styleUrls: ['./mobile-audio-category.component.scss'],
})
export class MobileAudioCategoryComponent extends BaseComponent {
  @Input() name: string;
  @Input() childCount: string;
  @Input() href: string;
  @Input() isLeaf: boolean;
  @Input() avatar: string;

  constructor() {
    super();
  }



}
