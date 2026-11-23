import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { Account, Customer, Transaction } from '../../core/models/banking.models';
import { AccountService } from '../../core/services/account.service';
import { CustomerService } from '../../core/services/customer.service';
import { NotificationService } from '../../core/services/notification.service';
import { TransactionService } from '../../core/services/transaction.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MatCardModule, MatIconModule, MatProgressBarModule, MatTableModule],
  template: `
    <div class="page-header"><h1>Dashboard</h1></div>
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <div class="stat-grid">
      <mat-card>
        <mat-card-content class="stat">
          <mat-icon>people</mat-icon>
          <div><div class="stat-value">{{ customers().length }}</div><div class="stat-label">Customers</div></div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content class="stat">
          <mat-icon>account_balance_wallet</mat-icon>
          <div><div class="stat-value">{{ accounts().length }}</div><div class="stat-label">Accounts</div></div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content class="stat">
          <mat-icon>payments</mat-icon>
          <div>
            <div class="stat-value">{{ totalBalance() | currency }}</div>
            <div class="stat-label">Total balance</div>
          </div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content class="stat">
          <mat-icon>swap_horiz</mat-icon>
          <div><div class="stat-value">{{ transactions().length }}</div><div class="stat-label">Transactions</div></div>
        </mat-card-content>
      </mat-card>
    </div>

    <mat-card>
      <mat-card-header><mat-card-title>Recent transactions</mat-card-title></mat-card-header>
      <mat-card-content>
        @if (recentTransactions().length === 0 && !loading()) {
          <p class="empty">No transactions yet.</p>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="recentTransactions()">
              <ng-container matColumnDef="transactionId">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let t">{{ t.transactionId }}</td>
              </ng-container>
              <ng-container matColumnDef="transactionDate">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let t">{{ t.transactionDate | date: 'mediumDate' }}</td>
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
  `,
  styles: [
    `
      .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-bottom: 24px; }
      .stat { display: flex; align-items: center; gap: 16px; padding-top: 16px; }
      .stat mat-icon { font-size: 36px; width: 36px; height: 36px; }
      .stat-value { font-size: 24px; font-weight: 500; }
      .stat-label { opacity: 0.7; }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly accountService = inject(AccountService);
  private readonly transactionService = inject(TransactionService);
  private readonly notifications = inject(NotificationService);

  protected readonly columns = ['transactionId', 'transactionDate', 'transactionType', 'transactionAmount'];
  protected readonly loading = signal(true);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly accounts = signal<Account[]>([]);
  protected readonly transactions = signal<Transaction[]>([]);

  protected readonly totalBalance = computed(() =>
    this.accounts().reduce((sum, account) => sum + Number(account.balance), 0),
  );
  protected readonly recentTransactions = computed(() =>
    [...this.transactions()].sort((a, b) => (b.transactionId ?? 0) - (a.transactionId ?? 0)).slice(0, 5),
  );

  ngOnInit(): void {
    forkJoin({
      customers: this.customerService.getAll(),
      accounts: this.accountService.getAll(),
      transactions: this.transactionService.getAll(),
    }).subscribe({
      next: (data) => {
        this.customers.set(data.customers);
        this.accounts.set(data.accounts);
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
