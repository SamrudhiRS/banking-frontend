import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Transaction } from '../models/banking.models';
import { TRANSACTIONS_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(TRANSACTIONS_URL);
  }

  create(transaction: Transaction): Observable<Transaction> {
    return this.http.post<Transaction>(TRANSACTIONS_URL, transaction);
  }
}
