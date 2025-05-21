import { AfterViewChecked, ChangeDetectorRef, Component, Input, OnChanges, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
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
import { Dropdown } from 'primeng/dropdown';

@Component({
  selector: 'app-quote-details',
  templateUrl: './quote-details.component.html',
  styleUrls: ['./quote-details.component.scss']
})
export class QuoteDetailsComponent implements OnInit ,OnChanges,AfterViewChecked {
  @ViewChildren(Dropdown) dropdowns!: QueryList<Dropdown>;
@Input() isViewMode = false; // New input to distinguish view mode

  @Input() isDuplicatedQuote = false;
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
    private shouldOpenDropdown = false;

  successMessage = '';
  clients: Client[] = [];
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchProductTerm = '';
  searchClientTerm = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private cd: ChangeDetectorRef,
    public activeModal: NgbActiveModal,
    private clientService: ClientService,
    private productService: ProductService,
    private quoteService: QuoteService,
    private modalService: NgbModal,
    private alertService: AlertService
  ) { }
  ngAfterViewChecked(): void {
    if (this.shouldOpenDropdown && this.dropdowns.length > 0) {
      const lastDropdown = this.dropdowns.last;
      if (lastDropdown) {
        lastDropdown.show();
        this.shouldOpenDropdown = false;
      }
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedProducts) {
      // Handle selectedProducts changes
      console.log('selectedProducts changed:', this.selectedProducts);
      }  }

 // In the ngOnInit method, update the initialization:
ngOnInit(): void {
  this.loadClients();
  
  if (this.isViewMode && this.quote.produitsdocuments && this.quote.produitsdocuments.length > 0) {
    this.selectedProducts = this.quote.produitsdocuments.map(item => ({
      products: item.product?.id || item.products,
      document: item.document,
      product: item.product ? { ...item.product } : null,
      quantity: item.quantity,
      prix: item.prix
    }));
    
    // Load products for view mode
    this.loadProductsForViewMode();
  } else if (!this.isViewMode) {
    this.loadProducts();
  }
}

loadProductsForViewMode(): void {
  this.productService.getProducts().subscribe(products => {
    this.products = products;
    this.filteredProducts = products;
    
    // Map products to selectedProducts
    this.selectedProducts = this.selectedProducts.map(item => {
      if (item.products) {
        const product = this.products.find(p => p.id === item.products);
        if (product) {
          return {
            ...item,
            product: { ...product }
          };
        }
      }
      return item;
    });
  });
}
  loadClients(): void {
    this.clientService.getClients().subscribe(clients => {
      this.clients = clients;
    });
  }

loadProducts(): void {
  this.isLoading = true;
  this.productService.getProducts().subscribe({
    next: (products) => {
      this.products = [...products];
      this.filteredProducts = [...products];
      
      // Update selected products with fresh references
      this.selectedProducts = this.selectedProducts.map(item => {
        if (item.products) {
          const product = this.products.find(p => p.id === item.products);
          if (product) {
            return {
              ...item,
              product: { ...product }, // New reference
              prix: item.prix || product.prix
            };
          }
        }
        return item;
      });
      
      this.isLoading = false;
    },
    error: (err) => {
      this.isLoading = false;
      console.error('Error loading products', err);
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
  this.quote.created_at = input.value;
  console.log(this.quote.created_at);
  console.log(input.value);
  
  this.calculateTotals();
}

// Modify your addNewProductRow method
addNewProductRow(): void {
  this.selectedProducts = [
    ...this.selectedProducts,
    {
      products: 0,
      document: this.quote.id || 0,
      product: null,
      quantity: 1,
      prix: 0
    }
  ];

  setTimeout(() => {
    const dropdowns = document.querySelectorAll('p-dropdown');
    const lastDropdown = dropdowns[dropdowns.length - 1];
    if (lastDropdown) {
      lastDropdown.dispatchEvent(new Event('click'));
    }
  }, 100);
}
onProductSelect(event: any, index: number): void {
  const selectedProduct = event.value;
  if (selectedProduct) {
    // Create a new array to trigger change detection
    this.selectedProducts = [...this.selectedProducts];
    
    this.selectedProducts[index] = {
      ...this.selectedProducts[index],
      products: selectedProduct.id,
      product: { ...selectedProduct }, // Create a new object reference
      prix: selectedProduct.prix
    };

    this.calculateTotals();
    // No need for manual change detection with the array spread above
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
    console.log(this.filteredProducts);
    
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
trackByProductId(index: number, item: QuoteProduct): number {
  return item.products || index;
}

saveQuote(): void {
     if (!this.quote.created_at) {
        this.quote.created_at = new Date().toISOString();
    }
    if (!this.quote.client_id) {
        this.alertService.showAlert('Veuillez sélectionner un client avant de soumettre le devis!');
        return;
    }
  console.log('Before save:', this.quote.created_at); // Should show correct date

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

    // Find client or use the selected one
    let client: Client;
    if (this.quote.client_id) {
      client = this.clients.find(c => c.id == this.quote.client_id);
      console.log(client);
      console.log(this.clients);
      
      
    } else if (this.clients.length > 0) {
      // Fallback to first client if none selected (for demo purposes)
      client = this.clients[0];
      this.quote.client_id = client.id;
    }

    if (!client) {
      this.errorMessage = 'Information client manquante';
      return;
    }

    // Filter valid products and ensure they have quantities
    const validProducts = this.selectedProducts
      .filter(p => p.product && p.product.id && p.quantity > 0)
      .map(p => ({
        ...p,
        quantity: p.quantity || 1, // Default to 1 if quantity is 0
        prix: p.prix || (p.product?.prix || 0)
      }));

    if (validProducts.length === 0) {
      this.errorMessage = 'Aucun produit valide';
      return;
    }

    // Calculate totals if not already done
    this.calculateTotals();

    this.quoteService.generatePdf(
      {
        ...this.quote,
        total: this.quote.total || 0,
        tva: this.quote.tva || 20
      },
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