import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'banner-section',
  templateUrl: 'banner-section.component.html',
  styleUrls: ['banner-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class BannerSectionComponent implements OnInit, OnDestroy {
  @ViewChild('typedText', {static: false}) typedText: ElementRef<HTMLElement> | undefined;
  private aText: string[] = ["Hello World! :)", "I'm Junior Front-end Developer", 'Are you ready to work with me?'];
  private iSpeed = 100; // time delay of print out
  private iIndex = 0; // start printing array at this position
  private iArrLength = this.aText[1].length; // the length of the text array
  private iScrollAt = 20; // start scrolling up at this many lines
  private iTextPos = 0; // initialise text position
  private sContents = ''; // initialise contents variable
  iRow: number = 0; // initialise current row

  constructor() { }

  ngOnInit(): void {
    this.typewriter();
  }

  ngOnDestroy(): void {
  }
  
  typewriter() {
    this.sContents = '<div class="console__prompt">';
    this.iRow = Math.max(0, this.iIndex-this.iScrollAt);
    const destination = this.typedText?.nativeElement;
    if (destination) {
      
      while ( this.iRow < this.iIndex ) {
        this.sContents += this.aText[this.iRow++] + '</div><div class="console__prompt">';
      }

      destination.innerHTML = this.sContents + this.aText[this.iIndex].substring(0, this.iTextPos);
      if ( this.iTextPos++ == this.iArrLength ) {
        this.iTextPos = 0;
        this.iIndex++;
        if ( this.iIndex != this.aText.length ) {
          this.iArrLength = this.aText[this.iIndex].length;
          setTimeout(this.typewriter.bind(this), 100);
        }
      } else {
        setTimeout(this.typewriter.bind(this), this.iSpeed);
      }
    }
  }
}