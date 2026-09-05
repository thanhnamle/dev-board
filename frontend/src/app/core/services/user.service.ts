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
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem(this.STORAGE_KEY) : null;
      if (saved) {
        const user = JSON.parse(saved);
        if (user && typeof user.name === 'string' && typeof user.role === 'string' && typeof user.avatarUrl === 'string') return user;
      }
    } catch { /* Fall back when browser storage is unavailable or invalid. */ }
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
      try {
        if (typeof window !== 'undefined') window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      } catch { /* Keep the in-memory profile when storage is unavailable. */ }
      return updated;
    });
  }
}
