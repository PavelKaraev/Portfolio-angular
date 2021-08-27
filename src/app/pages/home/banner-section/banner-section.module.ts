import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BannerSectionComponent } from './banner-section.component';
import { ConsoleModule } from './console/console.module';

@NgModule({
  imports: [
    CommonModule,
    ConsoleModule
  ],
  declarations: [
    BannerSectionComponent
  ],
  exports: [
    BannerSectionComponent
  ]
})

export class BannerSectionModule {}