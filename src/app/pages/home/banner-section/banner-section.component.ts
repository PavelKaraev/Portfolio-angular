import { DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { concat, from, interval, Observable, of } from 'rxjs';
import { concatMap, delay, ignoreElements, map, repeat, take, takeUntil } from 'rxjs/operators';
import { BaseAutoUnsubscribeClass } from 'src/app/models/autounsubscribe/auto-unsubscribe.model';

@Component({
  selector: 'banner-section',
  templateUrl: 'banner-section.component.html',
  styleUrls: ['banner-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class BannerSectionComponent extends BaseAutoUnsubscribeClass implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('typedText', {static: false}) typedText: ElementRef<HTMLElement> | undefined;
  private words: string[] = ["Hello World! :)", "I'm Junior Front-end Developer", 'Are you ready to work with me?'];

  constructor(
    @Inject(DOCUMENT) document: any
  ) { 
    super();
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  ngAfterViewInit(): void {
    this.typeWriting().subscribe();
  }

  typeWriting(): Observable<any> {
    return from(this.words)
      .pipe(
        concatMap(
          (word: string) => {
            const consolePrompt = document.createElement('div');
            this.typedText?.nativeElement.appendChild(consolePrompt);
            consolePrompt.classList.add('console__prompt');
            
            return this.typeEffect(word, consolePrompt);
          }
        ), 
        repeat(),
        take(this.words.join('')?.length),
        takeUntil(this.cancellableSubject$)
      )
  }

  typeEffect(word: string, element: HTMLElement): any {
    return concat(
      this.type(word, 100, element), // type
      of('').pipe(delay(300), ignoreElements()) // pause
    );
  }
  
  type(word: string, speed: number, element: HTMLElement): any {
    return interval(speed).pipe(
      map(char => element.innerText = word.substr(0, char + 1)),
      take(word.length)
    )
  }
}