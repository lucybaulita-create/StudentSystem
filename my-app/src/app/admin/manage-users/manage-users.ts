import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  joinDate: string;
}

@Component({
  selector: 'app-manage-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageUsers {
  searchQuery = signal('');
  filterRole = signal('all');
  filterStatus = signal('all');

  users = signal<User[]>([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Instructor', status: 'active', joinDate: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Student', status: 'active', joinDate: '2024-02-20' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Admin', status: 'active', joinDate: '2023-12-10' },
    { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', role: 'Instructor', status: 'inactive', joinDate: '2024-03-05' },
    { id: 5, name: 'Tom Brown', email: 'tom@example.com', role: 'Student', status: 'suspended', joinDate: '2024-01-30' },
  ]);

  filteredUsers = signal<User[]>([]);

  constructor() {
    this.filterUsers();
  }

  filterUsers() {
    const query = this.searchQuery().toLowerCase();
    const role = this.filterRole();
    const status = this.filterStatus();

    const filtered = this.users().filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(query) || 
                           user.email.toLowerCase().includes(query);
      const matchesRole = role === 'all' || user.role === role;
      const matchesStatus = status === 'all' || user.status === status;
      return matchesSearch && matchesRole && matchesStatus;
    });

    this.filteredUsers.set(filtered);
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.filterUsers();
  }

  onRoleChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filterRole.set(value);
    this.filterUsers();
  }

  onStatusChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filterStatus.set(value);
    this.filterUsers();
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.users.update(users => users.filter(u => u.id !== id));
      this.filterUsers();
    }
  }

  editUser(user: User) {
    alert(`Edit user: ${user.name}`);
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}
