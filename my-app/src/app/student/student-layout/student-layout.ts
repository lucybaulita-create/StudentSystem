import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-student-layout',
  imports: [RouterLink, RouterOutlet, CommonModule],
  templateUrl: './student-layout.html',
  styleUrl: './student-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentLayout {
  sidebarOpen = signal(true);

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  menuItems = [
    { label: 'Student Details', icon: '👤', route: '/student/student-details' },
    { label: 'Study Load', icon: '📚', route: '/student/studyload' },
    { label: 'Course/Semester & Grades', icon: '⭐', route: '/student/course-semester' },
  ];
}
