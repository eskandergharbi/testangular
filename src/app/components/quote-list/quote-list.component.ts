import { Component, OnInit } from '@angular/core';
import { QuoteService } from '../../services/quote.service';
import { Quote, QuoteResponse } from '../../models/quote.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { QuoteDetailsComponent } from '../quote-details/quote-details.component';

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
    this.loadQuotes();
  }

  openQuoteDetails(quote?: Quote, viewMode: boolean = false): void {
    const modalRef = this.modalService.open(QuoteDetailsComponent, { 
      size: 'lg',
      backdrop: viewMode ? true : 'static'
    });
    
    if (quote) {
      modalRef.componentInstance.quote = { 
        ...quote,
        created_at: quote.created_at ? new Date(quote.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      };
      modalRef.componentInstance.isEditMode = !viewMode;
      modalRef.componentInstance.isViewMode = viewMode;
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
    
    modalRef.componentInstance.quote = {
      ...quote,
      created_at: new Date().toISOString().split('T')[0],
      id: undefined,
      reference: undefined
    };
    
    modalRef.componentInstance.isEditMode = false;
    modalRef.componentInstance.isDuplicatedQuote = true;
    
    if (quote.produitsdocuments) {
      modalRef.componentInstance.selectedProducts = quote.produitsdocuments.map(item => ({
        products: item.product?.id || item.products,
        document: 0,
        product: item.product ? { ...item.product } : null,
        quantity: item.quantity,
        prix: item.prix
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