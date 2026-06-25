import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  enrollmentDate: string;
}

@Component({
  selector: 'app-admission',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admission.html',
  styleUrl: './admission.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admission {
  private fb = inject(FormBuilder);

  students = signal<Student[]>([
    { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '555-0101', dateOfBirth: '2005-03-15', enrollmentDate: '2024-01-10' },
    { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '555-0102', dateOfBirth: '2004-07-22', enrollmentDate: '2024-01-15' },
    { id: 3, firstName: 'Mike', lastName: 'Johnson', email: 'mike@example.com', phone: '555-0103', dateOfBirth: '2005-11-08', enrollmentDate: '2024-02-01' },
  ]);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  admissionForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9\-\+\s\(\)]{10,}$/)]],
    dateOfBirth: ['', Validators.required],
  });

  onSubmit() {
    if (this.admissionForm.invalid) {
      this.errorMessage.set('Please fill in all required fields correctly');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    setTimeout(() => {
      const formValue = this.admissionForm.value;
      const newStudent: Student = {
        id: Math.max(...this.students().map(s => s.id), 0) + 1,
        firstName: formValue.firstName || '',
        lastName: formValue.lastName || '',
        email: formValue.email || '',
        phone: formValue.phone || '',
        dateOfBirth: formValue.dateOfBirth || '',
        enrollmentDate: new Date().toISOString().split('T')[0],
      };

      this.students.update(students => [...students, newStudent]);
      this.successMessage.set(`Student ${formValue.firstName} ${formValue.lastName} added successfully!`);
      this.admissionForm.reset();
      this.isSubmitting.set(false);

      setTimeout(() => this.successMessage.set(null), 3000);
    }, 1000);
  }

  deleteStudent(id: number) {
    if (confirm('Are you sure you want to delete this student?')) {
      this.students.update(students => students.filter(s => s.id !== id));
    }
  }

  getFirstNameError(): string {
    const control = this.admissionForm.get('firstName');
    if (control?.hasError('required')) return 'First name is required';
    if (control?.hasError('minlength')) return 'First name must be at least 2 characters';
    return '';
  }

  getLastNameError(): string {
    const control = this.admissionForm.get('lastName');
    if (control?.hasError('required')) return 'Last name is required';
    if (control?.hasError('minlength')) return 'Last name must be at least 2 characters';
    return '';
  }

  getEmailError(): string {
    const control = this.admissionForm.get('email');
    if (control?.hasError('required')) return 'Email is required';
    if (control?.hasError('email')) return 'Please enter a valid email';
    return '';
  }

  getPhoneError(): string {
    const control = this.admissionForm.get('phone');
    if (control?.hasError('required')) return 'Phone is required';
    if (control?.hasError('pattern')) return 'Please enter a valid phone number';
    return '';
  }

  getDateError(): string {
    const control = this.admissionForm.get('dateOfBirth');
    if (control?.hasError('required')) return 'Date of birth is required';
    return '';
  }
}
