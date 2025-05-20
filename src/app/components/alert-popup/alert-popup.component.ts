import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-alert-popup',
  template: `
    <div class="modal-header">
  <button type="button" class="btn p-1" aria-label="Close" (click)="activeModal.dismiss()">
    <i class="bi bi-x-lg fs-5"></i>
  </button>
</div>
    <div class="modal-body text-center py-4">
      <i class="bi bi-exclamation-triangle-fill text-warning fs-1 mb-3"></i>
      <p class="mb-0">{{ message }}</p>
    </div>
    
    <div class="modal-footer border-0 justify-content-center">
      <button type="button" class="btn btn-primary" (click)="activeModal.close()">OK</button>
    </div>
  `,
  styles: [`
    .modal-header, .modal-footer {
      background-color: #f8f9fa;
    }
    .modal-body {
      background-color: white;
    }
  `]
})
export class AlertPopupComponent {
  @Input() title: string = 'Alerte';
  @Input() message: string = '';

  constructor(public activeModal: NgbActiveModal) {}
}