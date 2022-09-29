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
  constructor() {
    super();
  }
}
