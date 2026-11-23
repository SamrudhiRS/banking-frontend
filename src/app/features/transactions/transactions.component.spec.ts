import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ApiError } from '../../core/interceptors/error.interceptor';
import { CreditCard, DebitCard, Transaction } from '../../core/models/banking.models';
import { CardService } from '../../core/services/card.service';
import { NotificationService } from '../../core/services/notification.service';
import { TransactionService } from '../../core/services/transaction.service';
import { TransactionsComponent } from './transactions.component';

describe('TransactionsComponent', () => {
  let fixture: ComponentFixture<TransactionsComponent>;
  let component: TransactionsComponent;

  const debitCards: DebitCard[] = [{ debitCardId: 7, cardNumber: 1111222233, expiryDate: '2030-01-01', accountId: 1 }];
  const creditCards: CreditCard[] = [{ creditCardId: 9, cardNumber: 4444555566, expiryDate: '2030-01-01', accountId: 1 }];
  const history: Transaction[] = [
    { transactionId: 1, transactionAmount: 100, transactionType: 'DEPOSIT', debitCardId: 7 },
    { transactionId: 2, transactionAmount: 40, transactionType: 'WITHDRAW', debitCardId: 7 },
  ];

  const cardService = {
    getCreditCards: jest.fn(),
    getDebitCards: jest.fn(),
  };
  const transactionService = { getAll: jest.fn(), create: jest.fn() };
  const notifications = { success: jest.fn(), error: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    cardService.getCreditCards.mockReturnValue(of(creditCards));
    cardService.getDebitCards.mockReturnValue(of(debitCards));
    transactionService.getAll.mockReturnValue(of(history));

    await TestBed.configureTestingModule({
      imports: [TransactionsComponent, NoopAnimationsModule],
      providers: [
        { provide: CardService, useValue: cardService },
        { provide: TransactionService, useValue: transactionService },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('lists the transaction history newest first', () => {
    expect(component['visibleTransactions']().map((t) => t.transactionId)).toEqual([2, 1]);
  });

  it('filters the history by transaction type', () => {
    component['filter'].set('DEPOSIT');

    expect(component['visibleTransactions']().map((t) => t.transactionId)).toEqual([1]);
  });

  it('does not submit an invalid form', () => {
    component['submit']();

    expect(transactionService.create).not.toHaveBeenCalled();
  });

  it('sends only debitCardId for a debit card transaction', () => {
    transactionService.create.mockReturnValue(of({}));
    component['form'].setValue({ cardKind: 'DEBIT', cardId: 7, transactionType: 'WITHDRAW', amount: 25.5 });

    component['submit']();

    expect(transactionService.create).toHaveBeenCalledWith({
      transactionType: 'WITHDRAW',
      transactionAmount: 25.5,
      debitCardId: 7,
    });
    expect(notifications.success).toHaveBeenCalled();
  });

  it('sends only creditCardId for a credit card transaction', () => {
    transactionService.create.mockReturnValue(of({}));
    component['form'].setValue({ cardKind: 'CREDIT', cardId: 9, transactionType: 'DEPOSIT', amount: 10 });

    component['submit']();

    expect(transactionService.create).toHaveBeenCalledWith({
      transactionType: 'DEPOSIT',
      transactionAmount: 10,
      creditCardId: 9,
    });
  });

  it('shows the backend message when the transaction is rejected', () => {
    transactionService.create.mockReturnValue(
      throwError(() => new ApiError(422, 'Balance is not sufficient to make transaction')),
    );
    component['form'].setValue({ cardKind: 'DEBIT', cardId: 7, transactionType: 'WITHDRAW', amount: 9999 });

    component['submit']();

    expect(notifications.error).toHaveBeenCalledWith('Balance is not sufficient to make transaction');
    expect(component['submitting']()).toBe(false);
  });
});
