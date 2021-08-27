import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ConsoleComponent } from './console.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    ConsoleComponent
  ],
  exports: [
    ConsoleComponent
  ]
})

export class ConsoleModule {}