import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Student {
  id: number;
  name: string;
  email: string;
  enrolledCourses: number;
  completedCourses: number;
  progress: number;
  status: 'active' | 'graduated' | 'dropout';
  enrollDate: string;
}

@Component({
  selector: 'app-manage-students',
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-students.html',
  styleUrl: './manage-students.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageStudents {
  searchQuery = signal('');
  filterStatus = signal('all');

  students = signal<Student[]>([
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', enrolledCourses: 3, completedCourses: 2, progress: 85, status: 'active', enrollDate: '2024-01-10' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', enrolledCourses: 2, completedCourses: 5, progress: 100, status: 'graduated', enrollDate: '2023-08-15' },
    { id: 3, name: 'Carol Davis', email: 'carol@example.com', enrolledCourses: 1, completedCourses: 0, progress: 20, status: 'dropout', enrollDate: '2024-02-01' },
    { id: 4, name: 'David Wilson', email: 'david@example.com', enrolledCourses: 4, completedCourses: 1, progress: 60, status: 'active', enrollDate: '2024-01-20' },
    { id: 5, name: 'Eve Martin', email: 'eve@example.com', enrolledCourses: 2, completedCourses: 3, progress: 95, status: 'active', enrollDate: '2023-11-05' },
  ]);

  filteredStudents = signal<Student[]>([]);

  constructor() {
    this.filterStudents();
  }

  filterStudents() {
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();

    const filtered = this.students().filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(query) || 
                           student.email.toLowerCase().includes(query);
      const matchesStatus = status === 'all' || student.status === status;
      return matchesSearch && matchesStatus;
    });

    this.filteredStudents.set(filtered);
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.filterStudents();
  }

  onStatusChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filterStatus.set(value);
    this.filterStudents();
  }

  deleteStudent(id: number) {
    if (confirm('Are you sure you want to delete this student?')) {
      this.students.update(students => students.filter(s => s.id !== id));
      this.filterStudents();
    }
  }

  editStudent(student: Student) {
    alert(`Edit student: ${student.name}`);
  }

  viewProgress(student: Student) {
    alert(`Progress: ${student.progress}% completed`);
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getProgressBarClass(progress: number): string {
    if (progress >= 80) return 'progress-high';
    if (progress >= 50) return 'progress-medium';
    return 'progress-low';
  }
}
