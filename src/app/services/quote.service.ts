import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Quote, QuoteResponse } from '../models/quote.model';
import { catchError } from 'rxjs/operators';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private apiUrl = 'https://api.netadvisortest.com/api/document';

  constructor(private http: HttpClient) { }

  getQuotes(page: number = 1): Observable<QuoteResponse> {
    return this.http.get<QuoteResponse>(`${this.apiUrl}?page=${page}`);
  }

  getQuote(id: number): Observable<Quote> {
    return this.http.get<Quote>(`${this.apiUrl}/${id}`);
  }

createQuote(quoteData: {
  client_id: number;
  tva: number;
  taxe: number;
  total: number;
  products: number[]; // Array of product IDs
}): Observable<Quote> {
  return this.http.post<Quote>(this.apiUrl, quoteData).pipe(
    catchError(this.handleError)
  );
}

// In quote.service.ts, update the handleError method:
private handleError(error: HttpErrorResponse) {
  let errorMessage = 'An error occurred';
  if (error.error instanceof ErrorEvent) {
    errorMessage = `Error: ${error.error.message}`;
  } else {
    errorMessage = `Code: ${error.status}\nMessage: ${error.message}`;
    if (error.error?.errors) {
      errorMessage += `\nDetails: ${JSON.stringify(error.error.errors)}`;
      console.error('Full error response:', error.error); // Add this line
    }
  }
  console.error(errorMessage);
  return throwError(errorMessage);
}

// Dans quote.service.ts
duplicateQuote(originalQuote: Quote): Observable<Quote> {
  // Préparer les données pour la nouvelle copie
  const newQuoteData = {
    client_id: originalQuote.client_id, // Peut être modifié par l'utilisateur
    tva: originalQuote.tva,
    taxe: originalQuote.taxe,
    total: originalQuote.total,
    products: originalQuote.produitsdocuments?.map(item => ({
      product_id: item.products,
      quantity: item.quantity,
      prix: item.prix
    })) || [],
    // La date sera générée automatiquement par le backend
    // La référence sera générée automatiquement par le backend
  };

  // Utiliser le même endpoint POST que pour la création
  return this.http.post<Quote>(this.apiUrl, newQuoteData);
}

  postDocument(documentData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, documentData)
      .pipe(
        catchError(this.handleError)
      );
  }





generatePdf(quote: Quote, client: any, products: any[]): void {
  try {
    console.log('Starting PDF generation...', {quote, client, products});
    
    if (!quote || !client || !products) {
      console.error('Missing required data for PDF generation');
      return;
    }

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('NETTADVISOR', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Devis / Facture', 105, 30, { align: 'center' });
    
    // Client Info
    doc.setFontSize(10);
    doc.text(`Client: ${client.nom || ''} ${client.prenom || ''}`, 15, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 60);
    doc.text(`Référence: DEV-${quote.id || ''}`, 15, 70);
    
    // Products Table
    const tableData = products.map(p => {
      const prix = Number(p.product?.prix) || 0;
      const quantity = Number(p.quantity) || 0;
      return [
        p.product?.libelle || '',
        quantity.toString(),
        `${prix.toFixed(3)} TND`,
        `${(prix * quantity).toFixed(3)} TND`
      ];
    });
    
    autoTable(doc, {
      head: [['Désignation', 'Quantité', 'Prix Unitaire', 'Total HT']],
      body: tableData,
      startY: 80,
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      columnStyles: {
        1: { cellWidth: 20 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 }
      }
    });
    
    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalHT = quote.total / (1 + (quote.tva || 20) / 100);
    const tvaAmount = quote.total - totalHT;
    
    doc.text(`Total HT: ${totalHT.toFixed(3)} TND`, 140, finalY);
    doc.text(`TVA (${quote.tva || 20}%): ${tvaAmount.toFixed(3)} TND`, 140, finalY + 10);
    doc.text(`Total TTC: ${quote.total.toFixed(3)} TND`, 140, finalY + 20);
    doc.text(`Timbre fiscal: 0.600 TND`, 140, finalY + 30);
    doc.setFont('helvetica', 'bold');
    doc.text(`Net à payer: ${(Number(quote.total) + 0.6).toFixed(3)} TND`, 140, finalY + 40);
    
    // Output
    const fileName = `Devis-NETTADVISOR-${quote.id || 'new'}.pdf`;
    console.log('PDF generated successfully, saving as:', fileName);
    doc.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error; // Propage l'erreur pour la voir dans la console
  }
}
}