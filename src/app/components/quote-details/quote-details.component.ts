import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../../services/client.service';
import { ProductService } from '../../services/product.service';
import { QuoteService } from '../../services/quote.service';
import { Client } from '../../models/client.model';
import { Product } from '../../models/product.model';
import { Quote, QuoteProduct } from '../../models/quote.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientFormComponent } from '../client-form/client-form.component';
import { ProductFormComponent } from '../product-form/product-form.component';
import { AlertService } from 'app/services/alert.service';

@Component({
  selector: 'app-quote-details',
  templateUrl: './quote-details.component.html',
  styleUrls: ['./quote-details.component.scss']
})
export class QuoteDetailsComponent implements OnInit {
  today: Date = new Date();

  @Input() quote: Quote = {
    client_id: 0,
    tva: 20,
    taxe: 0,
    total: 0,
    produitsdocuments: []
  };
  @Input() isEditMode = false;
  @Input() selectedProducts: QuoteProduct[] = [];
  
  successMessage = '';
  clients: Client[] = [];
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchProductTerm = '';
  searchClientTerm = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    public activeModal: NgbActiveModal,
    private clientService: ClientService,
    private productService: ProductService,
    private quoteService: QuoteService,
    private modalService: NgbModal,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.loadClients();
    this.loadProducts();
    
    // Initialize with empty selectedProducts (no initial row)
    if (this.quote.produitsdocuments && this.quote.produitsdocuments.length > 0) {
      this.selectedProducts = this.quote.produitsdocuments.map(item => ({
        products: item.products,
        document: 0,
        product: { ...item.product },
        quantity: item.quantity,
        prix: item.prix
      }));
    }
  }

  loadClients(): void {
    this.clientService.getClients().subscribe(clients => {
      this.clients = clients;
    });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe(products => {
      this.products = products;
      this.filteredProducts = [...products];
      
      if (this.selectedProducts) {
        this.selectedProducts.forEach(item => {
          if (item.products) {
            const product = this.products.find(p => p.id === item.products);
            if (product) {
              item.product = product;
              if (!item.prix || item.prix === 0) {
                item.prix = product.prix;
              }
            }
          }
        });
      }
    });
  }
formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

handleDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.quote.created_at = input.value ? new Date(input.value).toISOString() : '';
    this.calculateTotals();
}
  addNewProductRow(): void {
    this.selectedProducts.push({
      products: 0,
      document: this.quote.id || 0,
      product: {} as Product,
      quantity: 1,
      prix: 0
    });
  }

  onProductSelect(item: QuoteProduct, index: number): void {
    if (item.products && this.selectedProducts[index]) {
      const product = this.products.find(p => p.id === item.products);
      if (product) {
        this.selectedProducts[index].product = product;
        this.selectedProducts[index].prix = product.prix;
        this.calculateTotals();
      }
    }
  }

  removeProduct(index: number): void {
    this.selectedProducts.splice(index, 1);
    if (this.selectedProducts.length === 0) {
      this.addNewProductRow();
    }
    this.calculateTotals();
  }

  searchClients(): void {
    if (this.searchClientTerm) {
      this.clientService.searchClients(this.searchClientTerm).subscribe(clients => {
        this.clients = clients;
      });
    } else {
      this.loadClients();
    }
  }

  searchProducts(): void {
    this.filteredProducts = this.products.filter(product =>
      product.libelle.toLowerCase().includes(this.searchProductTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(this.searchProductTerm.toLowerCase())
    );
  }

  searchAndAddProduct(): void {
    if (!this.searchProductTerm) return;

    const foundProduct = this.products.find(p => 
      p.libelle.toLowerCase().includes(this.searchProductTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(this.searchProductTerm.toLowerCase())
    );

    if (foundProduct) {
      this.addProduct(foundProduct);
      this.searchProductTerm = '';
    } else {
      this.openProductFormWithSearchTerm();
    }
  }

  openProductFormWithSearchTerm(): void {
    const modalRef = this.modalService.open(ProductFormComponent);
    modalRef.componentInstance.initialData = {
      libelle: this.searchProductTerm
    };

    modalRef.result.then((product: Product) => {
      if (product) {
        this.products.push(product);
        this.filteredProducts.push(product);
        this.addProduct(product);
        this.searchProductTerm = '';
      }
    }).catch(() => { });
  }

  addProduct(product: Product): void {
    if (product.quantite <= 0) {
      this.alertService.showAlert('Ce produit est en rupture de stock!', 'warning');
      return;
    }

    const existingIndex = this.selectedProducts.findIndex(p => p.products === product.id);
    
    if (existingIndex >= 0) {
      const newQuantity = this.selectedProducts[existingIndex].quantity + 1;
      if (newQuantity <= product.quantite) {
        this.selectedProducts[existingIndex].quantity = newQuantity;
      } else {
        this.alertService.showAlert('Quantité demandée dépasse le stock disponible!', 'warning');
      }
    } else {
      this.selectedProducts.push({
        products: product.id,
        document: this.quote.id || 0,
        product: product,
        quantity: 1,
        prix: product.prix
      });
    }
    this.calculateTotals();
  }

  updateQuantity(index: number, quantity: number): void {
    if (this.selectedProducts[index]) {
      const product = this.selectedProducts[index].product;
      if (product && quantity > product.quantite) {
        this.alertService.showAlert('Quantité demandée dépasse le stock disponible!', 'warning');
        return;
      }
      this.selectedProducts[index].quantity = quantity;
      this.calculateTotals();
    }
  }

  calculateTotals(): void {
    let totalHT = 0;
    
    this.selectedProducts.forEach(item => {
      if (item.product && item.prix && item.quantity) {
        totalHT += item.prix * item.quantity;
      }
    });

    this.quote.total = totalHT * (1 + this.quote.tva / 100);
  }

  openClientForm(): void {
    const modalRef = this.modalService.open(ClientFormComponent, {
      windowClass: 'right-side-modal',
      backdropClass: 'right-side-modal-backdrop',
      size: 'lg'
    });
    
    modalRef.result.then((client: Client) => {
      if (client) {
        this.clients.push(client);
        this.quote.client_id = client.id || 0;
      }
    }).catch(() => { });
  }

  openProductForm(): void {
    const modalRef = this.modalService.open(ProductFormComponent);
    modalRef.result.then((product: Product) => {
      if (product) {
        this.products.push(product);
        this.filteredProducts.push(product);
        this.addProduct(product);
      }
    }).catch(() => { });
  }
onDateChange(newDate: string): void {
    // Convert the date string to proper format
    this.quote.created_at = new Date(newDate).toISOString();
    this.calculateTotals();
}
saveQuote(): void {
     if (!this.quote.created_at) {
        this.quote.created_at = new Date().toISOString();
    }
    if (!this.quote.client_id) {
        this.alertService.showAlert('Veuillez sélectionner un client avant de soumettre le devis!');
        return;
    }

    // Format the date properly before saving
    const payload = {
        ...this.quote,
        created_at: this.quote.created_at ? new Date(this.quote.created_at).toISOString() : new Date().toISOString(),
        products: this.selectedProducts
            .filter(p => p.products && !isNaN(Number(p.products)))
            .map(p => Number(p.products))
    };

    this.isLoading = true;
    this.errorMessage = '';
    
    this.calculateTotals();
    
    this.quoteService.createQuote(payload).subscribe({
        next: (response) => {
            this.alertService.showAlert('Devis enregistré avec succès!');
            this.activeModal.close('saved');
        },
        error: (err) => {
            this.isLoading = false;
            if (err.status === 422) {
                const errors = err.error.errors;
                this.errorMessage = Object.values(errors).join('\n');
            } else {
                this.errorMessage = 'Une erreur est survenue lors de l\'enregistrement du devis.';
            }
        }
    });
}

  postDocument(): void {
    if (!this.quote.client_id) {
      this.errorMessage = 'Veuillez sélectionner un client avant de soumettre le devis!';
      return;
    }

    if (this.selectedProducts.length === 0) {
      this.errorMessage = 'Veuillez ajouter au moins un produit!';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      client_id: this.quote.client_id,
      tva: this.quote.tva,
      taxe: this.quote.taxe,
      total: this.quote.total,
      products: this.selectedProducts.map(p => ({
        product_id: p.products,
        quantity: p.quantity,
        prix: p.prix
      }))
    };

    this.quoteService.postDocument(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Document envoyé avec succès!';
        this.quote.id = response.id;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors de l\'envoi du document: ' + 
          (err.error?.message || 'Veuillez réessayer plus tard');
      }
    });
  }

  previewPDF(): void {
    try {
      if (!this.quote) {
        this.errorMessage = 'Devis non disponible';
        return;
      }

      const client = this.clients.find(c => c.id === this.quote.client_id);
      if (!client) {
        this.errorMessage = 'Information client manquante';
        return;
      }

      const validProducts = this.selectedProducts.filter(p => p.product && p.product.id);
      if (validProducts.length === 0) {
        this.errorMessage = 'Aucun produit valide';
        return;
      }

      this.quoteService.generatePdf(
        this.quote,
        client,
        validProducts
      );

    } catch (error) {
      console.error('Error in previewPDF:', error);
      this.errorMessage = 'Erreur lors de la génération du PDF';
    }
  }

  getProductStatusColor(product: Product): any {
  return product.quantite > 0 ? {'color': 'green'} : {'color': 'red', 'font-style': 'italic'};
}

  getProductStatusText(product: Product): string {
    return product.quantite > 0 ? `En stock: ${product.quantite}` : 'En rupture';
  }
}