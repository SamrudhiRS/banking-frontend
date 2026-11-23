import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Account } from '../models/banking.models';
import { ACCOUNTS_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Account[]> {
    return this.http.get<Account[]>(ACCOUNTS_URL);
  }

  create(account: Account): Observable<Account> {
    return this.http.post<Account>(ACCOUNTS_URL, account);
  }

  delete(accountId: number): Observable<void> {
    return this.http.delete<void>(`${ACCOUNTS_URL}/${accountId}`);
  }
}
