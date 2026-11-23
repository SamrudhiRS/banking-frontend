export type AccountType = 'SAVING' | 'CURRENT';
export type TransactionType = 'DEPOSIT' | 'WITHDRAW';
export type CardKind = 'CREDIT' | 'DEBIT';

export interface Customer {
  customerId?: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string; // yyyy-MM-dd
  phoneNumber: string;
  accountDtos?: Account[];
}

export interface Account {
  accountId?: number;
  accountNumber?: number;
  balance: number;
  dateOfOpening?: string;
  accountType: AccountType;
  customerId: number;
  creditCardDto?: CreditCard | null;
  debitCardDto?: DebitCard | null;
}

export interface CreditCard {
  creditCardId?: number;
  cardNumber?: number;
  cvv?: string;
  expiryDate: string;
  accountId: number;
  transactionDtos?: Transaction[];
}

export interface DebitCard {
  debitCardId?: number;
  cardNumber?: number;
  cvv?: string;
  expiryDate: string;
  accountId: number;
  transactionDtos?: Transaction[];
}

export interface Transaction {
  transactionId?: number;
  transactionDate?: string;
  transactionAmount: number;
  transactionType: TransactionType;
  creditCardId?: number;
  debitCardId?: number;
}

export interface NewUser {
  username: string;
  password: string;
  active: boolean;
  role: string;
}
