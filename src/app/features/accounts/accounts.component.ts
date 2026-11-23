import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { Account, Customer } from '../../core/models/banking.models';
import { AccountService } from '../../core/services/account.service';
import { CustomerService } from '../../core/services/customer.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { AccountFormDialogComponent } from './account-form-dialog.component';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
  ],
  template: `
    <div class="page-header">
      <h1>Accounts</h1>
      <button mat-flat-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Open account
      </button>
    </div>
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    <mat-card>
      <mat-card-content>
        @if (accounts().length === 0 && !loading()) {
          <p class="empty">No accounts yet. Add a customer first, then open an account.</p>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="accounts()">
              <ng-container matColumnDef="accountNumber">
                <th mat-header-cell *matHeaderCellDef>Account number</th>
                <td mat-cell *matCellDef="let a">{{ a.accountNumber }}</td>
              </ng-container>
              <ng-container matColumnDef="customer">
                <th mat-header-cell *matHeaderCellDef>Customer</th>
                <td mat-cell *matCellDef="let a">{{ customerName(a.customerId) }}</td>
              </ng-container>
              <ng-container matColumnDef="accountType">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let a">{{ a.accountType }}</td>
              </ng-container>
              <ng-container matColumnDef="balance">
                <th mat-header-cell *matHeaderCellDef>Balance</th>
                <td mat-cell *matCellDef="let a">{{ a.balance | currency }}</td>
              </ng-container>
              <ng-container matColumnDef="dateOfOpening">
                <th mat-header-cell *matHeaderCellDef>Opened</th>
                <td mat-cell *matCellDef="let a">{{ a.dateOfOpening | date: 'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let a">
                  <button mat-icon-button aria-label="Delete account" (click)="remove(a)">
                    <mat-icon>delete</mat-icon>
                  </button>
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
})
export class AccountsComponent implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly customerService = inject(CustomerService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);

  protected readonly columns = ['accountNumber', 'customer', 'accountType', 'balance', 'dateOfOpening', 'actions'];
  protected readonly accounts = signal<Account[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly loading = signal(true);

  private readonly customerNames = computed(
    () => new Map(this.customers().map((c) => [c.customerId, `${c.firstName} ${c.lastName}`])),
  );

  ngOnInit(): void {
    this.load();
  }

  protected customerName(customerId: number): string {
    return this.customerNames().get(customerId) ?? `#${customerId}`;
  }

  protected openForm(): void {
    if (this.customers().length === 0) {
      this.notifications.error('Add a customer before opening an account.');
      return;
    }
    this.dialog
      .open(AccountFormDialogComponent, { width: '440px', data: { customers: this.customers() } })
      .afterClosed()
      .subscribe((account?: Account) => {
        if (!account) {
          return;
        }
        this.accountService.create(account).subscribe({
          next: () => {
            this.notifications.success('Account opened');
            this.load();
          },
          error: (error: Error) => this.notifications.error(error.message),
        });
      });
  }

  protected remove(account: Account): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete account',
          message: `Delete account ${account.accountNumber}? Its cards and transactions may be affected.`,
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed || account.accountId === undefined) {
          return;
        }
        this.accountService.delete(account.accountId).subscribe({
          next: () => {
            this.notifications.success('Account deleted');
            this.load();
          },
          error: (error: Error) => this.notifications.error(error.message),
        });
      });
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({ accounts: this.accountService.getAll(), customers: this.customerService.getAll() }).subscribe({
      next: (data) => {
        this.accounts.set(data.accounts);
        this.customers.set(data.customers);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.loading.set(false);
        this.notifications.error(error.message);
      },
    });
  }
}
