import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreditCard, DebitCard } from '../models/banking.models';
import { CREDIT_CARDS_URL, DEBIT_CARDS_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly http = inject(HttpClient);

  getCreditCards(): Observable<CreditCard[]> {
    return this.http.get<CreditCard[]>(CREDIT_CARDS_URL);
  }

  getDebitCards(): Observable<DebitCard[]> {
    return this.http.get<DebitCard[]>(DEBIT_CARDS_URL);
  }

  createCreditCard(card: CreditCard): Observable<CreditCard> {
    return this.http.post<CreditCard>(CREDIT_CARDS_URL, card);
  }

  createDebitCard(card: DebitCard): Observable<DebitCard> {
    return this.http.post<DebitCard>(DEBIT_CARDS_URL, card);
  }

  deleteCreditCard(id: number): Observable<void> {
    return this.http.delete<void>(`${CREDIT_CARDS_URL}/${id}`);
  }

  deleteDebitCard(id: number): Observable<void> {
    return this.http.delete<void>(`${DEBIT_CARDS_URL}/${id}`);
  }
}
