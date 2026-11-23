import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { NewUser } from '../models/banking.models';
import { ACCOUNTS_URL, USERS_URL } from './api.config';

interface StoredSession {
  username: string;
  token: string;
}

const STORAGE_KEY = 'banking.session';

/**
 * Handles registration, login and logout.
 * The backend uses HTTP Basic authentication, so after a successful login the encoded
 * credentials are kept in sessionStorage (cleared when the browser tab closes).
 * In a production system this would be replaced by JWT/OAuth 2.0 tokens.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<StoredSession | null>(this.readSession());

  readonly username = computed(() => this.session()?.username ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);

  /** Authorization header value for API calls, or null when logged out. */
  get authorizationHeader(): string | null {
    const current = this.session();
    return current ? `Basic ${current.token}` : null;
  }

  register(username: string, password: string): Observable<void> {
    const user: NewUser = { username, password, active: true, role: 'ROLE_USER' };
    return this.http.post(USERS_URL, user).pipe(map(() => undefined));
  }

  /** Verifies the credentials against a protected endpoint; stores them only when accepted. */
  login(username: string, password: string): Observable<void> {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({ Authorization: `Basic ${token}` });
    return this.http.get(ACCOUNTS_URL, { headers }).pipe(
      tap(() => {
        const session: StoredSession = { username, token };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        this.session.set(session);
      }),
      map(() => undefined),
    );
  }

  logout(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
    void this.router.navigate(['/login']);
  }

  private readSession(): StoredSession | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  }
}
