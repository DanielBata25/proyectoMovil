// src/app/core/services/auth/auth.state.ts
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, shareReplay, tap } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { AuthService } from './auth.service';
import { UserMeDto } from '../../models/login.model';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private authService = inject(AuthService);
  private readonly storageKey = 'me';
  private _me$ = new BehaviorSubject<UserMeDto | null>(null);
  readonly me$ = this._me$.asObservable();

  get current(): UserMeDto | null { return this._me$.value; }

  async hydrateFromStorage(): Promise<void> {
    const { value } = await Preferences.get({ key: this.storageKey });
    if (value) this._me$.next(JSON.parse(value) as UserMeDto);
  }

  loadMe(): Observable<UserMeDto | null> {
    return this.authService.GetMe().pipe(
      tap((me) => this.normalizeAndCache(me)),
      shareReplay(1)
    );
  }

  reloadMe(): Observable<UserMeDto | null> {
    return this.authService.GetMe().pipe(
      tap((me) => this.normalizeAndCache(me)),
      catchError(() => {
        void this.clear();
        return of(null);
      }),
      shareReplay(1)
    );
  }

  private async cache(me: UserMeDto) {
    this._me$.next(me);
    await Preferences.set({ key: this.storageKey, value: JSON.stringify(me) });
  }

  private normalizeAndCache(me: UserMeDto) {
    me.roles = (me.roles ?? []).map(r => (r ?? '').toString().trim().toLowerCase()).filter(Boolean);
    me.permissions = (me.permissions ?? []).map(p => p.toLowerCase());
    me.menu?.forEach(s => s.forms?.forEach(f => f.permissions = (f.permissions ?? []).map(p => p.toLowerCase())));
    void this.cache(me);
  }

  async clear(): Promise<void> {
    await Preferences.remove({ key: this.storageKey });
    this._me$.next(null);
  }

  hasRole(role: string): boolean {
    const me = this._me$.value;
    return !!me?.roles?.includes((role ?? '').toLowerCase());
  }

  hasFormPermission(routeKeyOrUrl: string, action: string): boolean {
    const me = this._me$.value; if (!me) return false;
    const key = (routeKeyOrUrl ?? '').toLowerCase();
    const form = me.menu?.flatMap(m => m.forms ?? []).find(f => (f.url ?? '').toLowerCase() === key);
    return !!form && (form.permissions ?? []).includes(action.toLowerCase());
  }

  getMenu() { return this._me$.value?.menu ?? []; }
}
