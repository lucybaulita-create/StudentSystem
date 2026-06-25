import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUser = this.authService.getCurrentUser();

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      // Redirect to login
      this.router.navigate(['/login']);
      return false;
    }

    // Check if route requires specific roles
    if (route.data['roles'] && route.data['roles'].length > 0) {
      if (!this.authService.hasAnyRole(route.data['roles'])) {
        // User doesn't have required role
        this.redirectBasedOnRole(currentUser?.role);
        return false;
      }
    }

    return true;
  }

  private redirectBasedOnRole(role?: string): void {
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'registrar':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'student':
        this.router.navigate(['/student/student-details']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}
