import { Component, inject } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Customer } from '../../core/models/banking.models';
import { fromIsoDate, toIsoDate } from '../../core/util/date.util';

export interface CustomerFormData {
  customer?: Customer;
}

/** Add / edit customer form. Validation rules mirror the backend (CustomerDto). */
@Component({
  selector: 'app-customer-form-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.customer ? 'Edit customer' : 'Add customer' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>First name</mat-label>
          <input matInput formControlName="firstName" />
          @if (form.controls.firstName.invalid) {
            <mat-error>First name is required (max 50 characters)</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Last name</mat-label>
          <input matInput formControlName="lastName" />
          @if (form.controls.lastName.invalid) {
            <mat-error>Last name is required (max 50 characters)</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
          @if (form.controls.email.invalid) {
            <mat-error>Enter a valid email address</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Date of birth</mat-label>
          <input matInput [matDatepicker]="picker" [max]="today" formControlName="dateOfBirth" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
          @if (form.controls.dateOfBirth.invalid) {
            <mat-error>Choose a date in the past</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Phone number</mat-label>
          <input matInput formControlName="phoneNumber" maxlength="10" />
          @if (form.controls.phoneNumber.invalid) {
            <mat-error>Phone number must be 10 digits</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit">Save</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class CustomerFormDialogComponent {
  protected readonly data = inject<CustomerFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CustomerFormDialogComponent, Customer>);
  private readonly fb = inject(FormBuilder);

  protected readonly today = new Date();

  protected readonly form = this.fb.group({
    firstName: [this.data.customer?.firstName ?? '', [Validators.required, Validators.maxLength(50)]],
    lastName: [this.data.customer?.lastName ?? '', [Validators.required, Validators.maxLength(50)]],
    email: [this.data.customer?.email ?? '', [Validators.required, Validators.email]],
    dateOfBirth: [
      this.data.customer ? fromIsoDate(this.data.customer.dateOfBirth) : (null as Date | null),
      Validators.required,
    ],
    phoneNumber: [this.data.customer?.phoneNumber ?? '', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const customer: Customer = {
      ...this.data.customer, // keeps customerId and existing accounts when editing
      firstName: value.firstName ?? '',
      lastName: value.lastName ?? '',
      email: value.email ?? '',
      dateOfBirth: toIsoDate(value.dateOfBirth as Date),
      phoneNumber: value.phoneNumber ?? '',
    };
    this.dialogRef.close(customer);
  }
}
