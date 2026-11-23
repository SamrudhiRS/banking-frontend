import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import {
  CardKind,
  CreditCard,
  DebitCard,
  Transaction,
  TransactionType,
} from '../../core/models/banking.models';
import { CardService } from '../../core/services/card.service';
import { NotificationService } from '../../core/services/notification.service';
import { TransactionService } from '../../core/services/transaction.service';
import { maskCardNumber } from '../../core/util/date.util';

interface CardOption {
  id: number;
  label: string;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
  ],
  template: `
    <div class="page-header"><h1>Transactions</h1></div>
    @if (loading() || submitting()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <div class="two-column">
      <mat-card>
        <mat-card-header><mat-card-title>New transaction</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="stacked-form" novalidate>
            <mat-button-toggle-group formControlName="cardKind" aria-label="Card type" (change)="form.controls.cardId.reset()">
              <mat-button-toggle value="DEBIT">Debit card</mat-button-toggle>
              <mat-button-toggle value="CREDIT">Credit card</mat-button-toggle>
            </mat-button-toggle-group>

            <mat-form-field appearance="outline">
              <mat-label>Card</mat-label>
              <mat-select formControlName="cardId">
                @for (option of cardOptions(); track option.id) {
                  <mat-option [value]="option.id">{{ option.label }}</mat-option>
                }
              </mat-select>
              @if (cardOptions().length === 0) {
                <mat-hint>No cards of this type yet. Issue one on the Cards page.</mat-hint>
              }
              @if (form.controls.cardId.invalid) {
                <mat-error>Select a card</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Transaction type</mat-label>
              <mat-select formControlName="transactionType">
                <mat-option value="DEPOSIT">Deposit</mat-option>
                <mat-option value="WITHDRAW">Withdraw</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Amount</mat-label>
              <input matInput type="number" min="0.01" step="0.01" formControlName="amount" />
              @if (form.controls.amount.invalid) {
                <mat-error>Enter an amount greater than 0</mat-error>
              }
            </mat-form-field>

            <button mat-flat-button color="primary" type="submit" [disabled]="submitting()">Submit</button>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>History</mat-card-title></mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="filter">
            <mat-label>Filter by type</mat-label>
            <mat-select [value]="filter()" (selectionChange)="filter.set($event.value)">
              <mat-option value="ALL">All</mat-option>
              <mat-option value="DEPOSIT">Deposits</mat-option>
              <mat-option value="WITHDRAW">Withdrawals</mat-option>
            </mat-select>
          </mat-form-field>

          @if (visibleTransactions().length === 0 && !loading()) {
            <p class="empty">No transactions to show.</p>
          } @else {
            <div class="table-container">
              <table mat-table [dataSource]="visibleTransactions()">
                <ng-container matColumnDef="transactionId">
                  <th mat-header-cell *matHeaderCellDef>ID</th>
                  <td mat-cell *matCellDef="let t">{{ t.transactionId }}</td>
                </ng-container>
                <ng-container matColumnDef="transactionDate">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let t">{{ t.transactionDate | date: 'mediumDate' }}</td>
                </ng-container>
                <ng-container matColumnDef="card">
                  <th mat-header-cell *matHeaderCellDef>Card</th>
                  <td mat-cell *matCellDef="let t">{{ t.creditCardId ? 'Credit' : 'Debit' }}</td>
                </ng-container>
                <ng-container matColumnDef="transactionType">
                  <th mat-header-cell *matHeaderCellDef>Type</th>
                  <td mat-cell *matCellDef="let t">{{ t.transactionType }}</td>
                </ng-container>
                <ng-container matColumnDef="transactionAmount">
                  <th mat-header-cell *matHeaderCellDef>Amount</th>
                  <td
                    mat-cell
                    *matCellDef="let t"
                    [class.amount-in]="t.transactionType === 'DEPOSIT'"
                    [class.amount-out]="t.transactionType === 'WITHDRAW'"
                  >
                    {{ t.transactionAmount | currency }}
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns"></tr>
              </table>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .two-column { display: grid; grid-template-columns: minmax(300px, 380px) 1fr; gap: 24px; align-items: start; }
      @media (max-width: 900px) { .two-column { grid-template-columns: 1fr; } }
      .stacked-form { display: flex; flex-direction: column; gap: 8px; padding-top: 16px; }
      .stacked-form mat-button-toggle-group { margin-bottom: 16px; align-self: flex-start; }
      .filter { width: 220px; }
    `,
  ],
})
export class TransactionsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cardService = inject(CardService);
  private readonly transactionService = inject(TransactionService);
  private readonly notifications = inject(NotificationService);

  protected readonly columns = ['transactionId', 'transactionDate', 'card', 'transactionType', 'transactionAmount'];

  protected readonly creditCards = signal<CreditCard[]>([]);
  protected readonly debitCards = signal<DebitCard[]>([]);
  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly filter = signal<'ALL' | TransactionType>('ALL');
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);

  protected readonly form = this.fb.group({
    cardKind: ['DEBIT' as CardKind, Validators.required],
    cardId: [null as number | null, Validators.required],
    transactionType: ['DEPOSIT' as TransactionType, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  /** Mirrors the selected card type of the form so the card list can react to it. */
  private readonly selectedKind = signal<CardKind>('DEBIT');

  protected readonly cardOptions = computed<CardOption[]>(() => {
    const cards: (CreditCard | DebitCard)[] =
      this.selectedKind() === 'CREDIT' ? this.creditCards() : this.debitCards();
    return cards.map((card) => ({
      id: this.selectedKind() === 'CREDIT' ? (card as CreditCard).creditCardId ?? 0 : (card as DebitCard).debitCardId ?? 0,
      label: `${maskCardNumber(card.cardNumber)} (account #${card.accountId})`,
    }));
  });

  protected readonly visibleTransactions = computed(() => {
    const filter = this.filter();
    return [...this.transactions()]
      .filter((t) => filter === 'ALL' || t.transactionType === filter)
      .sort((a, b) => (b.transactionId ?? 0) - (a.transactionId ?? 0));
  });

  ngOnInit(): void {
    this.form.controls.cardKind.valueChanges.subscribe((kind) => this.selectedKind.set(kind ?? 'DEBIT'));
    this.load();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const transaction: Transaction = {
      transactionType: value.transactionType as TransactionType,
      transactionAmount: Number(value.amount),
      // Only the id of the chosen card kind is sent; the backend rejects a transaction without a card.
      ...(value.cardKind === 'CREDIT'
        ? { creditCardId: value.cardId as number }
        : { debitCardId: value.cardId as number }),
    };

    this.submitting.set(true);
    this.transactionService.create(transaction).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notifications.success('Transaction completed');
        this.form.patchValue({ amount: null });
        this.form.controls.amount.markAsUntouched();
        this.load();
      },
      error: (error: Error) => {
        this.submitting.set(false);
        this.notifications.error(error.message);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      credit: this.cardService.getCreditCards(),
      debit: this.cardService.getDebitCards(),
      transactions: this.transactionService.getAll(),
    }).subscribe({
      next: (data) => {
        this.creditCards.set(data.credit);
        this.debitCards.set(data.debit);
        this.transactions.set(data.transactions);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.loading.set(false);
        this.notifications.error(error.message);
      },
    });
  }
}
