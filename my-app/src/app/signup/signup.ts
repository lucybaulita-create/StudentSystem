import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { RecaptchaService } from '../services/recaptcha.service';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signup {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private recaptchaService = inject(RecaptchaService);

  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  roles = ['student', 'registrar', 'admin'];

  signupForm = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      role: ['student', Validators.required],
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
    if (this.signupForm.invalid) {
      this.errorMessage.set('Please fill in all required fields correctly');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Get reCAPTCHA token first
    this.recaptchaService.getToken().then(recaptchaToken => {
      const formData = {
        first_name: this.signupForm.get('firstName')?.value,
        last_name: this.signupForm.get('lastName')?.value,
        email: this.signupForm.get('email')?.value,
        password: this.signupForm.get('password')?.value,
        role: this.signupForm.get('role')?.value,
        recaptcha_token: recaptchaToken,
      };

      console.log('Sending signup data:', formData);

      // Call backend signup endpoint
      this.apiService.signup(formData).subscribe({
        next: (response: any) => {
          console.log('Signup response:', response);
          this.isSubmitting.set(false);
          const devCode = response?.verification_code
            ? ` Verification code: ${response.verification_code}`
            : '';
          this.successMessage.set(`Account created!${devCode || ' Check your email for verification code.'}`);
          setTimeout(() => {
            this.router.navigate(['/verify-email'], {
              queryParams: { email: formData.email }
            });
          }, 1500);
        },
        error: (error: any) => {
          console.error('Signup error:', error);
          console.error('Error details:', error?.error);
          this.isSubmitting.set(false);
          this.errorMessage.set(error?.error?.detail || error?.error?.message || 'Signup failed. Please try again.');
        },
      });
    }).catch((error) => {
      this.isSubmitting.set(false);
      this.errorMessage.set('reCAPTCHA verification failed. Please try again.');
      console.error('reCAPTCHA error:', error);
    });
  }

  getFirstNameError(): string {
    const control = this.signupForm.get('firstName');
    if (control?.hasError('required')) return 'First name is required';
    if (control?.hasError('minlength'))
      return 'First name must be at least 2 characters';
    return '';
  }

  getLastNameError(): string {
    const control = this.signupForm.get('lastName');
    if (control?.hasError('required')) return 'Last name is required';
    if (control?.hasError('minlength'))
      return 'Last name must be at least 2 characters';
    return '';
  }

  getEmailError(): string {
    const control = this.signupForm.get('email');
    if (control?.hasError('required')) return 'Email is required';
    if (control?.hasError('email')) return 'Please enter a valid email';
    return '';
  }

  getPasswordError(): string {
    const control = this.signupForm.get('password');
    if (control?.hasError('required')) return 'Password is required';
    if (control?.hasError('minlength'))
      return 'Password must be at least 8 characters';
    return '';
  }

  getConfirmPasswordError(): string {
    const control = this.signupForm.get('confirmPassword');
    if (control?.hasError('required')) return 'Please confirm your password';
    if (this.signupForm.hasError('passwordMismatch'))
      return 'Passwords do not match';
    return '';
  }

  getTermsError(): string {
    const control = this.signupForm.get('agreeToTerms');
    if (control?.hasError('required'))
      return 'You must agree to the terms and conditions';
    return '';
  }
}
