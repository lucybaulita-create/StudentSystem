import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterOutlet, CommonModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
  sidebarOpen = signal(true);

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  menuItems = [
    { label: 'Dashboard', icon: '📊', route: '/admin/dashboard' },
    { label: 'Manage Users', icon: '👥', route: '/admin/manage-users' },
    { label: 'Manage Students', icon: '🎓', route: '/admin/manage-students' },
    { label: 'Courses', icon: '📚', route: '/admin/courses' },
    { label: 'Admission', icon: '📝', route: '/admission' },
  ];
}
