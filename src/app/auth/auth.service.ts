import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthFrontService {

  isLoggedIn(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token && !this.isTokenExpired(token);
  }

  login(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  logout(): void {
    localStorage.removeItem('auth_token');
  }

  decodeJwt(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  }
  
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeJwt(token);
    if (!decoded || !decoded.exp) return true;
  
    const now = Math.floor(Date.now() / 1000); // segundos
    return decoded.exp < now;
  }
}

