import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav
        #drawer
        class="shell-sidenav"
        [mode]="isHandset() ? 'over' : 'side'"
        [opened]="!isHandset()"
      >
        <mat-toolbar class="brand"><mat-icon>account_balance</mat-icon>&nbsp;Banking</mat-toolbar>
        <mat-nav-list>
          @for (item of navItems; track item.path) {
            <a
              mat-list-item
              [routerLink]="item.path"
              routerLinkActive="active-link"
              (click)="isHandset() && drawer.close()"
            >
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary">
          @if (isHandset()) {
            <button mat-icon-button aria-label="Open menu" (click)="drawer.toggle()">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span class="spacer"></span>
          <span class="user"><mat-icon>person</mat-icon> {{ auth.username() }}</span>
          <button mat-button (click)="auth.logout()"><mat-icon>logout</mat-icon> Logout</button>
        </mat-toolbar>
        <main class="content"><router-outlet /></main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .shell { height: 100vh; }
      .shell-sidenav { width: 240px; }
      .brand { font-weight: 500; }
      .spacer { flex: 1 1 auto; }
      .user { display: inline-flex; align-items: center; gap: 4px; margin-right: 12px; }
      .content { padding: 24px; }
      .active-link { background: rgba(0, 0, 0, 0.08); }
    `,
  ],
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly breakpoints = inject(BreakpointObserver);

  protected readonly isHandset = toSignal(
    this.breakpoints.observe(Breakpoints.Handset).pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Customers', icon: 'people', path: '/customers' },
    { label: 'Accounts', icon: 'account_balance_wallet', path: '/accounts' },
    { label: 'Cards', icon: 'credit_card', path: '/cards' },
    { label: 'Transactions', icon: 'swap_horiz', path: '/transactions' },
  ];
}
