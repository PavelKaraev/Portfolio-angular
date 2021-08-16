import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'home-page',
  templateUrl: 'home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class HomePageComponent {}