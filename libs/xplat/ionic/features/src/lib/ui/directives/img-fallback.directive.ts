import { Directive, Input, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: 'img[appImgFallback]',
})
export class ImgFallbackDirective {
  @Input() appImgFallback: string;
  size: string = '240x135';
  defaultFallbackUrl: string = 'assets/imgs/fy-default-image.svg'; // 'https://picsum.photos/240/135?grayscale'

  constructor(private eRef: ElementRef) {
    eRef.nativeElement.src = this.defaultFallbackUrl;
  }

  @HostListener('error')
  loadFallbackOnError() {
    const element: HTMLImageElement = <HTMLImageElement>this.eRef.nativeElement;
    element.src = this.appImgFallback || this.defaultFallbackUrl;
  }
}
