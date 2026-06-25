import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { RecaptchaService } from '../services/recaptcha.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private recaptchaService = inject(RecaptchaService);
  
  hidePassword = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showOTPInput = signal(false);
  otpEmail = signal<string | null>(null);
  otpUserId = signal<number | null>(null);
  otpSent = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  togglePasswordVisibility() {
    this.hidePassword.update(v => !v);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Please fill in all required fields correctly');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;
    
    // Get reCAPTCHA token first
    this.recaptchaService.getToken().then(recaptchaToken => {
      this.apiService.login(email!, password!, recaptchaToken).subscribe({
        next: (response: any) => {
          this.otpEmail.set(email!);
          this.otpUserId.set(response.user_id);
          this.otpSent.set(response.otp_sent);
          
          // If email failed but OTP was generated (for testing), show it
          if (response.otp && !response.otp_sent) {
            this.successMessage.set(`OTP: ${response.otp} (email not configured)`);
          } else {
            this.successMessage.set('OTP sent to your email');
          }
          
          this.showOTPInput.set(true);
          this.loginForm.reset();
          this.isSubmitting.set(false);
        },
        error: (error: any) => {
          this.isSubmitting.set(false);
          const message = error.error?.detail || 'Login failed. Please try again.';
          this.errorMessage.set(message);
        }
      });
    }).catch((error) => {
      this.isSubmitting.set(false);
      this.errorMessage.set('reCAPTCHA verification failed. Please try again.');
      console.error('reCAPTCHA error:', error);
    });
  }

  onOTPSubmit() {
    if (this.otpForm.invalid || !this.otpEmail()) {
      this.errorMessage.set('Please enter a valid OTP');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { otp } = this.otpForm.value;
    
    this.apiService.verifyOTP(this.otpEmail()!, otp!).subscribe({
      next: (response: any) => {
        // Store auth token and user info
        this.authService.setAuthData({
          access_token: response.access_token,
          token_type: response.token_type,
          user_id: response.user_id,
          email: response.email,
          first_name: response.first_name,
          last_name: response.last_name,
          role: response.role
        });

        this.successMessage.set(`Login successful! Welcome, ${response.first_name}`);
        
        // Navigate based on user role
        setTimeout(() => {
          const role = response.role;
          if (role === 'admin' || role === 'registrar') {
            this.router.navigate(['/admin/dashboard']);
          } else if (role === 'student') {
            this.router.navigate(['/student/student-details']);
          } else {
            this.router.navigate(['/']);
          }
        }, 1500);
      },
      error: (error: any) => {
        this.isSubmitting.set(false);
        const message = error.error?.detail || 'OTP verification failed. Please try again.';
        this.errorMessage.set(message);
      }
    });
  }

  backToLogin() {
    this.showOTPInput.set(false);
    this.otpForm.reset();
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  getEmailError(): string {
    const control = this.loginForm.get('email');
    if (control?.hasError('required')) return 'Email is required';
    if (control?.hasError('email')) return 'Please enter a valid email';
    return '';
  }

  getPasswordError(): string {
    const control = this.loginForm.get('password');
    if (control?.hasError('required')) return 'Password is required';
    if (control?.hasError('minlength')) return 'Password must be at least 6 characters';
    return '';
  }

  getOTPError(): string {
    const control = this.otpForm.get('otp');
    if (control?.hasError('required')) return 'OTP is required';
    if (control?.hasError('minlength')) return 'OTP must be 6 digits';
    if (control?.hasError('maxlength')) return 'OTP must be 6 digits';
    return '';
  }
}
