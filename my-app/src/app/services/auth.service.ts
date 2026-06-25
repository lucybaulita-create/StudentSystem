import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthToken {
  access_token: string;
  token_type: string;
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface CurrentUser {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<CurrentUser | null>;
  private tokenSubject: BehaviorSubject<string | null>;
  
  public currentUser$: Observable<CurrentUser | null>;
  public token$: Observable<string | null>;

  constructor() {
    this.currentUserSubject = new BehaviorSubject<CurrentUser | null>(this.getUserFromStorage());
    this.tokenSubject = new BehaviorSubject<string | null>(this.getTokenFromStorage());
    
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.token$ = this.tokenSubject.asObservable();
  }

  // Store login data
  setAuthData(authToken: AuthToken): void {
    // Store token
    localStorage.setItem('access_token', authToken.access_token);
    localStorage.setItem('token_type', authToken.token_type);
    
    // Store user info
    const currentUser: CurrentUser = {
      user_id: authToken.user_id,
      email: authToken.email,
      first_name: authToken.first_name,
      last_name: authToken.last_name,
      role: authToken.role
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    this.currentUserSubject.next(currentUser);
    this.tokenSubject.next(authToken.access_token);
  }

  // Get current user
  getCurrentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  // Get token
  getToken(): string | null {
    return this.tokenSubject.value;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser ? currentUser.role === role : false;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser ? roles.includes(currentUser.role) : false;
  }

  // Get user from localStorage
  private getUserFromStorage(): CurrentUser | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Get token from localStorage
  private getTokenFromStorage(): string | null {
    return localStorage.getItem('access_token');
  }

  // Logout
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('currentUser');
    
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
  }
}
