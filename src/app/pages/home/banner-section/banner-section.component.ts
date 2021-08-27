import { ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'banner-section',
  templateUrl: 'banner-section.component.html',
  styleUrls: ['banner-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class BannerSectionComponent {
  
}