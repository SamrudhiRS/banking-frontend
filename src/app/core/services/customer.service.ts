import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Customer } from '../models/banking.models';
import { CUSTOMERS_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>(CUSTOMERS_URL);
  }

  create(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(CUSTOMERS_URL, customer);
  }

  update(customer: Customer): Observable<Customer> {
    return this.http.put<Customer>(CUSTOMERS_URL, customer);
  }

  delete(customerId: number): Observable<void> {
    return this.http.delete<void>(`${CUSTOMERS_URL}/${customerId}`);
  }
}
