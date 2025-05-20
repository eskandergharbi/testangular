import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertPopupComponent } from 'app/components/alert-popup/alert-popup.component';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  constructor(private modalService: NgbModal) {}

  showAlert(message: string, title: string = 'Alerte'): void {
    const modalRef = this.modalService.open(AlertPopupComponent, { 
      centered: true,
      size: 'sm'
    });
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.title = title;
  }
}