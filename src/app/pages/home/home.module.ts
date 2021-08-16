import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BannerSectionModule } from './banner-section/banner-section.module';
import { HomePageComponent } from './home.component';

const routes: Routes = [
  {
    path: '',
    component: HomePageComponent
  }
]

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    BannerSectionModule
  ],
  declarations: [
    HomePageComponent
  ],
  exports: [
    HomePageComponent
  ]
})

export class HomePageModule {}