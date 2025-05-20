export interface Client {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  adresse: string;
  telephone: string;
  created_at: string;
  updated_at: string | null;
}