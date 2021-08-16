import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BannerSectionComponent } from './banner-section.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    BannerSectionComponent
  ],
  exports: [
    BannerSectionComponent
  ]
})

export class BannerSectionModule {}