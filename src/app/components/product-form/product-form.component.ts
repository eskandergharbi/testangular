import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent {
  @Input() initialData: any = {};
  product: Product = {
    libelle: '',
    description: '',
    prix: 0,
    quantite: 0,
    id: 0,
    created_at: '',
    updated_at: ''
  };
  isLoading = false;
  errorMessage = '';

  constructor(
    public activeModal: NgbActiveModal,
    private productService: ProductService
  ) { }
  // In product-form.component.ts

  saveProduct(): void {
    if (!this.product.libelle || !this.product.description || !this.product.prix) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires!';
      return;
    }

    if (this.product.prix <= 0) {
      this.errorMessage = 'Le prix doit être supérieur à 0!';
      return;
    }

    this.isLoading = true;
    this.productService.createProduct(this.product).subscribe({
      next: (newProduct) => {
        this.activeModal.close(newProduct);
      },
      error: () => {
        this.errorMessage = 'Une erreur est survenue lors de la création du produit.';
        this.isLoading = false;
      }
    });
  }
}