import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Account, AccountType, Customer } from '../../core/models/banking.models';

export interface AccountFormData {
  customers: Customer[];
}

@Component({
  selector: 'app-account-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Open account</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Customer</mat-label>
          <mat-select formControlName="customerId">
            @for (customer of data.customers; track customer.customerId) {
              <mat-option [value]="customer.customerId">
                {{ customer.firstName }} {{ customer.lastName }}
              </mat-option>
            }
          </mat-select>
          @if (form.controls.customerId.invalid) {
            <mat-error>Select a customer</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Account type</mat-label>
          <mat-select formControlName="accountType">
            @for (type of accountTypes; track type) {
              <mat-option [value]="type">{{ type }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Opening balance</mat-label>
          <input matInput type="number" min="0" step="0.01" formControlName="balance" />
          @if (form.controls.balance.invalid) {
            <mat-error>Balance cannot be negative</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit">Open account</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class AccountFormDialogComponent {
  protected readonly data = inject<AccountFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AccountFormDialogComponent, Account>);
  private readonly fb = inject(FormBuilder);

  protected readonly accountTypes: AccountType[] = ['SAVING', 'CURRENT'];

  protected readonly form = this.fb.group({
    customerId: [null as number | null, Validators.required],
    accountType: ['SAVING' as AccountType, Validators.required],
    balance: [0, [Validators.required, Validators.min(0)]],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.dialogRef.close({
      customerId: value.customerId as number,
      accountType: value.accountType as AccountType,
      balance: Number(value.balance),
    } satisfies Account);
  }
}
