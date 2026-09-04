import { Injectable, signal } from '@angular/core';

export interface UserProfile {
  name: string;
  role: string;
  avatarUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly STORAGE_KEY = 'devboard_user';

  // Khởi tạo lấy từ localStorage hoặc mặc định
  readonly currentUser = signal<UserProfile>(this.getInitialUser());

  private getInitialUser(): UserProfile {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      name: 'Thành Nam',
      role: 'Lead Architect',
      avatarUrl: 'assets/Avatar.jpg'
    };
  }

  // Hàm lưu Role khi user bấm Continue with GitHub
  setUserRole(role: string): void {
    this.currentUser.update(user => {
      const updated = { ...user, role: role.trim() || 'Software Engineer' };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }
}