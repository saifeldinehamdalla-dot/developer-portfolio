import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHostComponent } from './shared/toast-host.component';
import { ConfirmDialogHostComponent } from './shared/confirm-dialog-host.component';

@Component({
  selector: 'portfolio-root',
  standalone: true,
  imports: [RouterOutlet, ToastHostComponent, ConfirmDialogHostComponent],
  template: '<router-outlet /><portfolio-toast-host /><portfolio-confirm-dialog-host />',
})
export class AppComponent {}
