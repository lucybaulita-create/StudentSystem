import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Course {
  id: number;
  title: string;
  instructor: string;
  enrolledStudents: number;
  rating: number;
  price: number;
  status: 'published' | 'draft' | 'archived';
  createdDate: string;
}

@Component({
  selector: 'app-courses',
  imports: [CommonModule, FormsModule],
  templateUrl: './courses.html',
  styleUrl: './courses.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Courses {
  searchQuery = signal('');
  filterStatus = signal('all');

  courses = signal<Course[]>([
    { id: 1, title: 'Angular Fundamentals', instructor: 'John Doe', enrolledStudents: 450, rating: 4.8, price: 49.99, status: 'published', createdDate: '2024-01-05' },
    { id: 2, title: 'Advanced TypeScript', instructor: 'Jane Smith', enrolledStudents: 320, rating: 4.7, price: 59.99, status: 'published', createdDate: '2024-01-10' },
    { id: 3, title: 'React & Redux Mastery', instructor: 'Mike Johnson', enrolledStudents: 0, rating: 0, price: 79.99, status: 'draft', createdDate: '2024-03-01' },
    { id: 4, title: 'Web Design Basics', instructor: 'Sarah Williams', enrolledStudents: 125, rating: 4.5, price: 39.99, status: 'published', createdDate: '2023-11-15' },
    { id: 5, title: 'Python for Beginners', instructor: 'Tom Brown', enrolledStudents: 50, rating: 4.2, price: 29.99, status: 'archived', createdDate: '2023-06-20' },
  ]);

  filteredCourses = signal<Course[]>([]);

  constructor() {
    this.filterCourses();
  }

  filterCourses() {
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();

    const filtered = this.courses().filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(query) || 
                           course.instructor.toLowerCase().includes(query);
      const matchesStatus = status === 'all' || course.status === status;
      return matchesSearch && matchesStatus;
    });

    this.filteredCourses.set(filtered);
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.filterCourses();
  }

  onStatusChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filterStatus.set(value);
    this.filterCourses();
  }

  deleteCourse(id: number) {
    if (confirm('Are you sure you want to delete this course?')) {
      this.courses.update(courses => courses.filter(c => c.id !== id));
      this.filterCourses();
    }
  }

  editCourse(course: Course) {
    alert(`Edit course: ${course.title}`);
  }

  viewAnalytics(course: Course) {
    alert(`Analytics for ${course.title}: ${course.enrolledStudents} students enrolled`);
  }

  publishCourse(course: Course) {
    alert(`Publishing course: ${course.title}`);
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    return '⭐'.repeat(fullStars) + (rating % 1 >= 0.5 ? '✨' : '');
  }
}
