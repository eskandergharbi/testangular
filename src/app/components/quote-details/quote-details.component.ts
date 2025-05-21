import { AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
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
  styleUrls: ['./quote-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuoteDetailsComponent implements OnInit, OnChanges, AfterViewChecked {
  @ViewChildren(Dropdown) dropdowns!: QueryList<Dropdown>;
  @Input() isViewMode = false;
  private dropdownInitialized = false;

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
  private dropdownToOpenIndex: number | null = null;

  successMessage = '';
  clients: Client[] = [];
  products: Product[] = [];
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
    if (this.shouldOpenDropdown && this.dropdowns.length > 0 && !this.dropdownInitialized) {
      setTimeout(() => {
        const lastDropdown = this.dropdowns.last;
        if (lastDropdown) {
          lastDropdown.show();
          this.shouldOpenDropdown = false;
          this.dropdownInitialized = true;
          this.cd.detectChanges();
        }
      }, 100);
    }

    if (this.dropdownToOpenIndex !== null && this.dropdowns.length > this.dropdownToOpenIndex) {
      setTimeout(() => {
        const dropdown = this.dropdowns.toArray()[this.dropdownToOpenIndex!];
        if (dropdown) {
          dropdown.show();
          this.dropdownToOpenIndex = null;
          this.cd.detectChanges();
        }
      }, 100);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedProducts) {
      this.cd.markForCheck();
    }
  }

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

      this.loadProductsForViewMode();
    } else if (!this.isViewMode) {
      this.loadProducts();
    }
  }

  loadProductsForViewMode(): void {
    this.productService.getProducts().subscribe(products => {
      this.products = [...products];

      this.selectedProducts = this.selectedProducts.map(item => {
        if (item.products) {
          const product = this.products.find(p => p.id == item.products);
          
          if (product) {
            const quantity = item.quantity || product.quantite || 1;
            
            return { 
              ...item, 
              product: { ...product },
              quantity: quantity,
              prix: item.prix || product.prix
            };
          }
        }
        return item;
      });
      
      this.calculateTotals();
      this.cd.markForCheck();
    });
  }

  loadClients(): void {
    this.clientService.getClients().subscribe(clients => {
      this.clients = [...clients];
      this.cd.markForCheck();
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = [...products];

        this.selectedProducts = this.selectedProducts.map(item => {
          if (item.products) {
            const product = this.products.find(p => p.id === item.products);
            if (product) {
              const quantity = Math.min(item.quantity || 1, product.quantite || 1);
              
              return {
                ...item,
                product: { ...product },
                prix: item.prix || product.prix,
                quantity: quantity
              };
            }
          }
          return item;
        });

        this.isLoading = false;
        this.cd.markForCheck();
        
        if (this.shouldOpenDropdown) {
          setTimeout(() => {
            this.dropdownToOpenIndex = this.selectedProducts.length - 1;
            this.cd.detectChanges();
          }, 200);
        }
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
    this.quote = { ...this.quote, created_at: input.value };
    this.calculateTotals();
  }

  addNewProductRow(): void {
    const newProduct: QuoteProduct = {
      products: 0,
      document: this.quote.id || 0,
      product: null,
      quantity: 1,
      prix: 0
    };

    this.selectedProducts = [...this.selectedProducts, newProduct];
    this.dropdownInitialized = false;
    
    setTimeout(() => {
      this.dropdownToOpenIndex = this.selectedProducts.length - 1;
      this.cd.detectChanges();
    }, 150);
  }

  onProductSelect(event: any, index: number): void {
    const selectedProduct = event.value;
    if (selectedProduct) {
      const updatedProducts = [...this.selectedProducts];
      
      const availableQuantity = selectedProduct.quantite || 1;
      const currentQuantity = Math.min(updatedProducts[index].quantity || 1, availableQuantity);
      
      updatedProducts[index] = {
        ...updatedProducts[index],
        products: selectedProduct.id,
        product: { ...selectedProduct },
        prix: this.isViewMode ? updatedProducts[index].prix : 
              (updatedProducts[index].prix || selectedProduct.prix),
        quantity: currentQuantity
      };

      this.selectedProducts = updatedProducts;
      this.searchProductTerm = '';
      this.calculateTotals();
      this.cd.detectChanges();
      
      if (selectedProduct.quantite <= 0) {
        this.alertService.showAlert('Ce produit est en rupture de stock!', 'warning');
      }
    }
  }

  removeProduct(index: number): void {
    const newProducts = [...this.selectedProducts];
    newProducts.splice(index, 1);

    if (newProducts.length === 0) {
      this.addNewProductRow();
    } else {
      this.selectedProducts = newProducts;
    }

    this.calculateTotals();
  }

  searchClients(): void {
    if (this.searchClientTerm) {
      this.clientService.searchClients(this.searchClientTerm).subscribe(clients => {
        this.clients = [...clients];
        this.cd.markForCheck();
      });
    } else {
      this.loadClients();
    }
  }

  filterProducts(searchTerm: string): Product[] {
    if (!searchTerm) {
      return [...this.products];
    }
    return this.products.filter(product =>
      product.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
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
      this.cd.detectChanges();
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
        this.products = [...this.products, product];
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
      const updatedProducts = [...this.selectedProducts];
      const newQuantity = updatedProducts[existingIndex].quantity + 1;
      if (newQuantity <= product.quantite) {
        updatedProducts[existingIndex] = { ...updatedProducts[existingIndex], quantity: newQuantity };
        this.selectedProducts = updatedProducts;
      } else {
        this.alertService.showAlert('Quantité demandée dépasse le stock disponible!', 'warning');
      }
    } else {
      const initialQuantity = product.quantite || 1;
      this.selectedProducts = [...this.selectedProducts, {
        products: product.id,
        document: this.quote.id || 0,
        product: product,
        quantity: initialQuantity,
        prix: product.prix
      }];
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
      const updatedProducts = [...this.selectedProducts];
      updatedProducts[index] = { ...updatedProducts[index], quantity: quantity };
      this.selectedProducts = updatedProducts;
      this.calculateTotals();
    }
  }

  calculateTotals(): void {
    let totalHT = 0;

    this.selectedProducts.forEach(item => {
      const price = item.prix || (item.product?.prix || 0);
      const quantity = item.quantity || 0;
      totalHT += price * quantity;
    });

    const tvaAmount = totalHT * (this.quote.tva / 100);
    this.quote = { ...this.quote, total: totalHT + tvaAmount };
    this.cd.markForCheck();
  }

  openClientForm(): void {
    const modalRef = this.modalService.open(ClientFormComponent, {
      windowClass: 'right-side-modal',
      backdropClass: 'right-side-modal-backdrop',
      size: 'lg'
    });

    modalRef.result.then((client: Client) => {
      if (client) {
        this.clients = [...this.clients, client];
        this.quote = { ...this.quote, client_id: client.id || 0 };
      }
    }).catch(() => { });
  }

  openProductForm(): void {
    const modalRef = this.modalService.open(ProductFormComponent);
    modalRef.result.then((product: Product) => {
      if (product) {
        this.products = [...this.products, product];
        this.addProduct(product);
      }
    }).catch(() => { });
  }

  onDateChange(newDate: string): void {
    this.quote = { ...this.quote, created_at: new Date(newDate).toISOString() };
    this.calculateTotals();
  }

  trackByProductId(index: number, item: QuoteProduct): number {
    return item.products || index;
  }

  saveQuote(): void {
    if (!this.quote.created_at) {
      this.quote = { ...this.quote, created_at: new Date().toISOString() };
    }
    if (!this.quote.client_id) {
      this.alertService.showAlert('Veuillez sélectionner un client avant de soumettre le devis!');
      return;
    }

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
        this.quote = { ...this.quote, id: response.id };
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

      let client: Client | undefined;
      if (this.quote.client_id) {
        client = this.clients.find(c => c.id == this.quote.client_id);
      } else if (this.clients.length > 0) {
        client = this.clients[0];
        this.quote = { ...this.quote, client_id: client.id };
      }

      if (!client) {
        this.errorMessage = 'Information client manquante';
        return;
      }

      const validProducts = this.selectedProducts
        .filter(p => p.product && p.product.id && p.quantity > 0)
        .map(p => ({
          ...p,
          quantity: p.quantity || 1,
          prix: p.prix || (p.product?.prix || 0)
        }));

      if (validProducts.length === 0) {
        this.errorMessage = 'Aucun produit valide';
        return;
      }

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
    return product?.quantite > 0 ? { 'color': 'green' } : { 'color': 'red', 'font-style': 'italic' };
  }

  getProductStatusText(product: Product): string {
    if (!product) return 'N/A';
    return product.quantite > 0 ? `En stock: ${product.quantite}` : 'En rupture';
  }
}