import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Product } from 'app/models/product.model';

@Component({
  selector: 'app-product-selection-modal',
  templateUrl: './product-selection-modal.component.html',
  styleUrls: ['./product-selection-modal.component.scss']
})
export class ProductSelectionModalComponent {
  @Input() products: Product[] = [];
  @Input() selectedProducts: number[] = [];
  searchTerm = '';

  constructor(public activeModal: NgbActiveModal) {}

  get filteredProducts(): Product[] {
    return this.products.filter(product =>
      (product.libelle.toLowerCase().includes(this.searchTerm.toLowerCase()) &&
      !this.selectedProducts.includes(product.id || 0  )));
  }

  getStockStatus(product: Product): string {
    return (product.quantite || 0) > 0 ? 'En stock' : 'En rupture';
  }

  selectProduct(product: Product): void {
    this.activeModal.close(product);
  }
}