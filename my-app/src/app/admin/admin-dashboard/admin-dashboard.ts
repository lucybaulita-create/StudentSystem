import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DashboardStat {
  title: string;
  value: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  stats: DashboardStat[] = [
    { title: 'Total Users', value: 1250, icon: '👥', color: '#667eea' },
    { title: 'Total Students', value: 3480, icon: '🎓', color: '#764ba2' },
    { title: 'Active Courses', value: 45, icon: '📚', color: '#f093fb' },
    { title: 'Total Revenue', value: 125000, icon: '💰', color: '#4facfe' },
  ];

  recentActivity = signal([
    { action: 'New user registered', timestamp: '2 hours ago', type: 'user' },
    { action: 'Course "Advanced Angular" created', timestamp: '4 hours ago', type: 'course' },
    { action: 'Student enrollment in "TypeScript 101"', timestamp: '6 hours ago', type: 'student' },
    { action: 'Payment received from User #523', timestamp: '1 day ago', type: 'payment' },
    { action: 'System backup completed', timestamp: '2 days ago', type: 'system' },
  ]);
}
