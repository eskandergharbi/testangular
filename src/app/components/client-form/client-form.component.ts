import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-client-form',
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.scss']
})
export class ClientFormComponent {
  client: Client = {
    nom: '',
    prenom: '',
    email: '',
    adresse: '',
    telephone: '',
    id: 0,
    created_at: '',
    updated_at: ''
  };
  isLoading = false;
  errorMessage = '';

  constructor(
    public activeModal: NgbActiveModal,
    private clientService: ClientService
  ) { }

  saveClient(): void {
    if (!this.client.nom || !this.client.prenom || !this.client.email) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires!';
      return;
    }

    this.isLoading = true;
    this.clientService.createClient(this.client).subscribe({
      next: (newClient) => {
        this.activeModal.close(newClient);
      },
      error: () => {
        this.errorMessage = 'Une erreur est survenue lors de la création du client.';
        this.isLoading = false;
      }
    });
  }
}