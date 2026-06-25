import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';

export interface Student {
  id?: number;
  name: string;
  email: string;
  student_id: string;
  program: string;
  year: number;
  gpa?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8000'; // Backend URL

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Home endpoint
  getHome(): Observable<any> {
    return this.http.get(`${this.apiUrl}/`);
  }

  // Student endpoints
  getStudents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/student`);
  }

  getStudent(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/student/${id}`);
  }

  createStudent(student: Student): Observable<any> {
    return this.http.post(`${this.apiUrl}/student`, student);
  }

  updateStudent(id: number, student: Student): Observable<any> {
    return this.http.put(`${this.apiUrl}/student/${id}`, student);
  }

  deleteStudent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/student/${id}`);
  }

  // Auth endpoints
  signup(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, data);
  }

  adminSignup(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin-signup`, data);
  }

  verifyEmail(email: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-email`, { email, code });
  }

  resendVerificationCode(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-verification-code`, { email });
  }

  login(email: string, password: string, recaptchaToken: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password, recaptcha_token: recaptchaToken });
  }

  verifyOTP(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-otp`, { email, otp }).pipe(
      tap((response: any) => {
        // Store auth data on successful OTP verification
        if (response.access_token) {
          this.authService.setAuthData({
            access_token: response.access_token,
            token_type: response.token_type,
            user_id: response.user_id,
            email: response.email,
            first_name: response.first_name,
            last_name: response.last_name,
            role: response.role
          });
        }
      })
    );
  }

  logout(): void {
    this.authService.logout();
  }
}
