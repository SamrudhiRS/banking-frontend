import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { Customer } from '../../core/models/banking.models';
import { CustomerService } from '../../core/services/customer.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { CustomerFormDialogComponent } from './customer-form-dialog.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
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
      <h1>Customers</h1>
      <button mat-flat-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Add customer
      </button>
    </div>
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    <mat-card>
      <mat-card-content>
        @if (customers().length === 0 && !loading()) {
          <p class="empty">No customers yet. Add your first customer.</p>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="customers()">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let c">{{ c.firstName }} {{ c.lastName }}</td>
              </ng-container>
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let c">{{ c.email }}</td>
              </ng-container>
              <ng-container matColumnDef="phoneNumber">
                <th mat-header-cell *matHeaderCellDef>Phone</th>
                <td mat-cell *matCellDef="let c">{{ c.phoneNumber }}</td>
              </ng-container>
              <ng-container matColumnDef="dateOfBirth">
                <th mat-header-cell *matHeaderCellDef>Date of birth</th>
                <td mat-cell *matCellDef="let c">{{ c.dateOfBirth | date: 'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="accounts">
                <th mat-header-cell *matHeaderCellDef>Accounts</th>
                <td mat-cell *matCellDef="let c">{{ c.accountDtos?.length ?? 0 }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let c">
                  <button mat-icon-button aria-label="Edit customer" (click)="openForm(c)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button aria-label="Delete customer" (click)="remove(c)">
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
export class CustomersComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);

  protected readonly columns = ['name', 'email', 'phoneNumber', 'dateOfBirth', 'accounts', 'actions'];
  protected readonly customers = signal<Customer[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  protected openForm(customer?: Customer): void {
    this.dialog
      .open(CustomerFormDialogComponent, { width: '480px', data: { customer } })
      .afterClosed()
      .subscribe((result?: Customer) => {
        if (!result) {
          return;
        }
        const request = result.customerId
          ? this.customerService.update(result)
          : this.customerService.create(result);
        request.subscribe({
          next: () => {
            this.notifications.success(result.customerId ? 'Customer updated' : 'Customer added');
            this.load();
          },
          error: (error: Error) => this.notifications.error(error.message),
        });
      });
  }

  protected remove(customer: Customer): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete customer',
          message: `Delete ${customer.firstName} ${customer.lastName}? This cannot be undone.`,
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed || customer.customerId === undefined) {
          return;
        }
        this.customerService.delete(customer.customerId).subscribe({
          next: () => {
            this.notifications.success('Customer deleted');
            this.load();
          },
          error: (error: Error) => this.notifications.error(error.message),
        });
      });
  }

  private load(): void {
    this.loading.set(true);
    this.customerService.getAll().subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.loading.set(false);
        this.notifications.error(error.message);
      },
    });
  }
}
