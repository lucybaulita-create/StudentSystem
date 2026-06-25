import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { RecaptchaService } from '../services/recaptcha.service';

@Component({
  selector: 'app-adminsignup',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './adminsignup.html',
  styleUrl: './adminsignup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSignup {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private recaptchaService = inject(RecaptchaService);

  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  roles = ['admin', 'registrar'];

  adminSignupForm = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      adminSecret: ['', [Validators.required, Validators.minLength(6)]],
      role: ['registrar', Validators.required],
      agreeToTerms: [false, Validators.requiredTrue],
    },
    { validators: this.passwordMatchValidator }
  );

  passwordMatchValidator(group: any): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility() {
    this.hidePassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility() {
    this.hideConfirmPassword.update(v => !v);
  }

  onSubmit() {
    if (this.adminSignupForm.invalid) {
      this.errorMessage.set('Please fill in all required fields correctly');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Get reCAPTCHA token first
    this.recaptchaService.getToken().then(recaptchaToken => {
      const formData = {
        first_name: this.adminSignupForm.get('firstName')?.value,
        last_name: this.adminSignupForm.get('lastName')?.value,
        email: this.adminSignupForm.get('email')?.value,
        password: this.adminSignupForm.get('password')?.value,
        role: this.adminSignupForm.get('role')?.value,
        admin_secret: this.adminSignupForm.get('adminSecret')?.value,
        recaptcha_token: recaptchaToken,
      };

      console.log('Sending admin signup data:', formData);

      // Call backend admin signup endpoint
      this.apiService.adminSignup(formData).subscribe({
        next: (response: any) => {
          console.log('Admin signup response:', response);
          this.isSubmitting.set(false);
          this.successMessage.set('Admin account created successfully! Redirecting to login...');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        },
        error: (error: any) => {
          console.error('Admin signup error:', error);
          console.error('Error details:', error?.error);
          this.isSubmitting.set(false);
          this.errorMessage.set(error?.error?.detail || error?.error?.message || 'Admin signup failed. Please try again.');
        },
      });
    }).catch(error => {
      console.error('reCAPTCHA error:', error);
      this.isSubmitting.set(false);
      this.errorMessage.set('reCAPTCHA verification failed. Please try again.');
    });
  }
}
