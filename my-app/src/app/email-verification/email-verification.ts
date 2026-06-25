import { Component, signal, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-email-verification',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './email-verification.html',
  styleUrl: './email-verification.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailVerification implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  email = signal<string>('');
  resendCountdown = signal(0);

  verificationForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  ngOnInit() {
    // Get email from query params or state
    this.route.queryParams.subscribe(params => {
      const email = params['email'];
      if (email) {
        this.email.set(email);
      } else {
        // Redirect back to signup if no email
        this.router.navigate(['/signup']);
      }
    });
  }

  onSubmit() {
    if (this.verificationForm.invalid) {
      this.errorMessage.set('Please enter a valid 6-digit code');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const code = this.verificationForm.get('code')?.value;
    const email = this.email();

    if (!email || !code) {
      this.errorMessage.set('Email or code is missing. Please try again.');
      this.isSubmitting.set(false);
      return;
    }

    // Call backend to verify code
    this.apiService.verifyEmail(email, code).subscribe({
      next: (response: any) => {
        this.isSubmitting.set(false);
        this.successMessage.set('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error: any) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error?.error?.message || 'Invalid verification code. Please try again.');
      },
    });
  }

  resendCode() {
    if (this.resendCountdown() > 0) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const email = this.email();
    if (!email) {
      this.errorMessage.set('Email is missing. Please start signup again.');
      this.isSubmitting.set(false);
      return;
    }

    this.apiService.resendVerificationCode(email).subscribe({
      next: (response: any) => {
        this.isSubmitting.set(false);
        this.successMessage.set('Verification code sent to your email!');
        this.startResendCountdown();
      },
      error: (error: any) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error?.error?.message || 'Failed to resend code. Please try again.');
      },
    });
  }

  private startResendCountdown() {
    this.resendCountdown.set(60);
    const interval = setInterval(() => {
      this.resendCountdown.update(v => {
        if (v <= 1) {
          clearInterval(interval);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  getCodeError(): string {
    const control = this.verificationForm.get('code');
    if (control?.hasError('required')) {
      return 'Verification code is required';
    }
    if (control?.hasError('minlength') || control?.hasError('maxlength')) {
      return 'Code must be 6 digits';
    }
    return '';
  }
}
