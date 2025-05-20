import { Component, OnInit } from '@angular/core';
import { QuoteService } from '../../services/quote.service';
import { Quote, QuoteResponse } from '../../models/quote.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { QuoteDetailsComponent } from '../quote-details/quote-details.component';
import { Product } from 'app/models/product.model';

@Component({
  selector: 'app-quote-list',
  templateUrl: './quote-list.component.html',
  styleUrls: ['./quote-list.component.scss']
})
export class QuoteListComponent implements OnInit {
  quotes: Quote[] = [];
  currentPage = 1;
  totalPages = 1;
  searchTerm = '';
  isLoading = false;

  constructor(
    private quoteService: QuoteService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.loadQuotes();
  }

  loadQuotes(): void {
    this.isLoading = true;
    this.quoteService.getQuotes(this.currentPage).subscribe({
      next: (response) => {
        this.quotes = response.data;
        this.totalPages = response.last_page;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadQuotes();
  }

  searchQuotes(): void {
    // Implement search functionality if API supports it
    this.loadQuotes();
  }

  openQuoteDetails(quote?: Quote): void {
    const modalRef = this.modalService.open(QuoteDetailsComponent, { size: 'lg' });
    if (quote) {
        // Ensure the date is properly formatted
        modalRef.componentInstance.quote = { 
            ...quote,
            created_at: quote.created_at ? new Date(quote.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        };
        modalRef.componentInstance.isEditMode = true;
    }
    modalRef.result.then((result) => {
        if (result === 'saved') {
            this.loadQuotes();
        }
    }).catch(() => { });
}

duplicateQuote(quote: Quote): void {
  if (!quote) return;
  
  this.isLoading = true;
  
  const modalRef = this.modalService.open(QuoteDetailsComponent, { size: 'lg' });
  
  // Initialize with the original quote data
  modalRef.componentInstance.quote = {
    client_id: quote.client_id,
    tva: quote.tva,
    taxe: quote.taxe,
    total: quote.total,
    produitsdocuments: []
  };
  
  // Get product IDs from the original quote
  if (quote.produitsdocuments) {
    modalRef.componentInstance.selectedProducts = quote.produitsdocuments.map(item => ({
      products: item.product?.id || item.products,
      document: 0,
      product: item.product ? { ...item.product } : null,
      quantity: 1, // Default quantity
      prix: item.product?.prix || 0
    }));
  }
  
  modalRef.result.then((result) => {
    if (result === 'saved') {
      this.loadQuotes();
    }
  }).catch(() => {})
  .finally(() => {
    this.isLoading = false;
  });
}
}