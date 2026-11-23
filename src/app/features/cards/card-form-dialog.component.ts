import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Account, CardKind } from '../../core/models/banking.models';
import { toIsoDate } from '../../core/util/date.util';

export interface CardFormData {
  kind: CardKind;
  /** Accounts that do not have this kind of card yet. */
  accounts: Account[];
}

export interface CardFormResult {
  accountId: number;
  cvv: string;
  expiryDate: string;
}

@Component({
  selector: 'app-card-form-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
  ],
  template: `
    <h2 mat-dialog-title>Issue {{ data.kind === 'CREDIT' ? 'credit' : 'debit' }} card</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Account</mat-label>
          <mat-select formControlName="accountId">
            @for (account of data.accounts; track account.accountId) {
              <mat-option [value]="account.accountId">
                {{ account.accountNumber }} ({{ account.accountType }})
              </mat-option>
            }
          </mat-select>
          @if (form.controls.accountId.invalid) {
            <mat-error>Select an account</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>CVV</mat-label>
          <input matInput formControlName="cvv" maxlength="3" inputmode="numeric" />
          @if (form.controls.cvv.invalid) {
            <mat-error>CVV must be 3 digits</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Expiry date</mat-label>
          <input matInput [matDatepicker]="picker" [min]="tomorrow" formControlName="expiryDate" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
          @if (form.controls.expiryDate.invalid) {
            <mat-error>Choose a future date</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit">Issue card</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class CardFormDialogComponent {
  protected readonly data = inject<CardFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CardFormDialogComponent, CardFormResult>);
  private readonly fb = inject(FormBuilder);

  protected readonly tomorrow = (() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  })();

  protected readonly form = this.fb.group({
    accountId: [null as number | null, Validators.required],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
    expiryDate: [null as Date | null, Validators.required],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.dialogRef.close({
      accountId: value.accountId as number,
      cvv: value.cvv ?? '',
      expiryDate: toIsoDate(value.expiryDate as Date),
    });
  }
}
