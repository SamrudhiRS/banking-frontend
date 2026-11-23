/** All backend calls go through "/api" - a dev proxy (ng serve) or nginx (Docker) forwards it to the Spring Boot service. */
export const API = '/api';
export const CUSTOMERS_URL = `${API}/customerService/v1/customers`;
export const ACCOUNTS_URL = `${API}/accountService/v1/accounts`;
export const CREDIT_CARDS_URL = `${API}/creditCardService/v1/creditCards`;
export const DEBIT_CARDS_URL = `${API}/debitCardService/v1/debitCards`;
export const TRANSACTIONS_URL = `${API}/transactionService/v1/transactions`;
export const USERS_URL = `${API}/userService/v1/users`;
