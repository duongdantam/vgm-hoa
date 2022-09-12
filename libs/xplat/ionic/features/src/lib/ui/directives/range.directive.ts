import { Directive, ElementRef, EventEmitter, Output, HostListener } from '@angular/core';

import { RangeValue } from '@ionic/core';
import { IonRange } from '@ionic/angular';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'ion-range'
})
export class RangeDirective {
  @Output() public ionStart: EventEmitter<RangeValue> = new EventEmitter();
  @Output() public ionEnd: EventEmitter<RangeValue> = new EventEmitter();

  protected isSliding: boolean = false;

  public constructor(protected elemRef: ElementRef<IonRange>) { }

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  public onStart(ev: Event): void {
    this.isSliding = true;
    this.ionStart.emit(this.elemRef.nativeElement.value);
    ev.preventDefault();
  }

  @HostListener('mouseup', ['$event'])
  @HostListener('window:mouseup', ['$event'])
  @HostListener('touchend', ['$event'])
  public onEnd(ev: Event): void {
    if (this.isSliding) {
      this.isSliding = false;
      this.ionEnd.emit(this.elemRef.nativeElement.value);
      ev.preventDefault();
    }
  }
}