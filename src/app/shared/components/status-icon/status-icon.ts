import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-status-icon',
  imports: [Icon],
  template: `
    @if (isValid()) {
      <app-icon name="check" class="text-success-soft-fg" [size]="16" [stroke]="2.5" />
    } @else {
      <app-icon name="alert" class="text-danger" [size]="16" />
    }
  `,
})
export class StatusIcon {
  isValid = input.required<boolean>();
}
