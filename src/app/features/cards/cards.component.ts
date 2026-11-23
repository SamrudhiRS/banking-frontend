import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { Observable, forkJoin } from 'rxjs';
import { Account, CardKind, CreditCard, DebitCard } from '../../core/models/banking.models';
import { AccountService } from '../../core/services/account.service';
import { CardService } from '../../core/services/card.service';
import { NotificationService } from '../../core/services/notification.service';
import { maskCardNumber } from '../../core/util/date.util';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { CardFormDialogComponent, CardFormResult } from './card-form-dialog.component';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatTabsModule,
  ],
  template: `
    <div class="page-header"><h1>Cards</h1></div>
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <mat-tab-group animationDuration="0ms">
      <mat-tab label="Credit cards">
        <div class="tab-actions">
          <button mat-flat-button color="primary" (click)="openForm('CREDIT')">
            <mat-icon>add</mat-icon> Issue credit card
          </button>
        </div>
        @if (creditCards().length === 0 && !loading()) {
          <p class="empty">No credit cards issued yet.</p>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="creditCards()">
              <ng-container matColumnDef="cardNumber">
                <th mat-header-cell *matHeaderCellDef>Card number</th>
                <td mat-cell *matCellDef="let c">{{ mask(c.cardNumber) }}</td>
              </ng-container>
              <ng-container matColumnDef="account">
                <th mat-header-cell *matHeaderCellDef>Account</th>
                <td mat-cell *matCellDef="let c">{{ accountNumber(c.accountId) }}</td>
              </ng-container>
              <ng-container matColumnDef="expiryDate">
                <th mat-header-cell *matHeaderCellDef>Expires</th>
                <td mat-cell *matCellDef="let c">{{ c.expiryDate | date: 'MM/yyyy' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let c">
                  <button mat-icon-button aria-label="Delete credit card" (click)="remove('CREDIT', c)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          </div>
        }
      </mat-tab>

      <mat-tab label="Debit cards">
        <div class="tab-actions">
          <button mat-flat-button color="primary" (click)="openForm('DEBIT')">
            <mat-icon>add</mat-icon> Issue debit card
          </button>
        </div>
        @if (debitCards().length === 0 && !loading()) {
          <p class="empty">No debit cards issued yet.</p>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="debitCards()">
              <ng-container matColumnDef="cardNumber">
                <th mat-header-cell *matHeaderCellDef>Card number</th>
                <td mat-cell *matCellDef="let c">{{ mask(c.cardNumber) }}</td>
              </ng-container>
              <ng-container matColumnDef="account">
                <th mat-header-cell *matHeaderCellDef>Account</th>
                <td mat-cell *matCellDef="let c">{{ accountNumber(c.accountId) }}</td>
              </ng-container>
              <ng-container matColumnDef="expiryDate">
                <th mat-header-cell *matHeaderCellDef>Expires</th>
                <td mat-cell *matCellDef="let c">{{ c.expiryDate | date: 'MM/yyyy' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let c">
                  <button mat-icon-button aria-label="Delete debit card" (click)="remove('DEBIT', c)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          </div>
        }
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`.tab-actions { padding: 16px 0; }`],
})
export class CardsComponent implements OnInit {
  private readonly cardService = inject(CardService);
  private readonly accountService = inject(AccountService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);

  protected readonly columns = ['cardNumber', 'account', 'expiryDate', 'actions'];
  protected readonly creditCards = signal<CreditCard[]>([]);
  protected readonly debitCards = signal<DebitCard[]>([]);
  protected readonly accounts = signal<Account[]>([]);
  protected readonly loading = signal(true);

  private readonly accountNumbers = computed(
    () => new Map(this.accounts().map((a) => [a.accountId, a.accountNumber])),
  );

  ngOnInit(): void {
    this.load();
  }

  protected mask(cardNumber?: number): string {
    return maskCardNumber(cardNumber);
  }

  protected accountNumber(accountId: number): string {
    return String(this.accountNumbers().get(accountId) ?? `#${accountId}`);
  }

  protected openForm(kind: CardKind): void {
    // An account can hold only one card of each kind, so offer only accounts without one.
    const used = new Set(
      (kind === 'CREDIT' ? this.creditCards() : this.debitCards()).map((card) => card.accountId),
    );
    const available = this.accounts().filter((account) => !used.has(account.accountId as number));
    if (available.length === 0) {
      this.notifications.error('Every account already has this kind of card. Open a new account first.');
      return;
    }
    this.dialog
      .open(CardFormDialogComponent, { width: '440px', data: { kind, accounts: available } })
      .afterClosed()
      .subscribe((result?: CardFormResult) => {
        if (!result) {
          return;
        }
        const request: Observable<unknown> =
          kind === 'CREDIT'
            ? this.cardService.createCreditCard(result)
            : this.cardService.createDebitCard(result);
        request.subscribe({
          next: () => {
            this.notifications.success('Card issued');
            this.load();
          },
          error: (error: Error) => this.notifications.error(error.message),
        });
      });
  }

  protected remove(kind: CardKind, card: CreditCard | DebitCard): void {
    const id = kind === 'CREDIT' ? (card as CreditCard).creditCardId : (card as DebitCard).debitCardId;
    if (id === undefined) {
      return;
    }
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Delete card', message: `Delete card ${maskCardNumber(card.cardNumber)}?` },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) {
          return;
        }
        const request =
          kind === 'CREDIT' ? this.cardService.deleteCreditCard(id) : this.cardService.deleteDebitCard(id);
        request.subscribe({
          next: () => {
            this.notifications.success('Card deleted');
            this.load();
          },
          error: (error: Error) => this.notifications.error(error.message),
        });
      });
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      credit: this.cardService.getCreditCards(),
      debit: this.cardService.getDebitCards(),
      accounts: this.accountService.getAll(),
    }).subscribe({
      next: (data) => {
        this.creditCards.set(data.credit);
        this.debitCards.set(data.debit);
        this.accounts.set(data.accounts);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.loading.set(false);
        this.notifications.error(error.message);
      },
    });
  }
}
