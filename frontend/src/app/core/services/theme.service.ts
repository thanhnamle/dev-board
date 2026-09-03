import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly isDarkMode = signal<boolean>(true);

  constructor() {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('devboard_theme');
      if (savedTheme !== null) {
        this.isDarkMode.set(savedTheme === 'dark');
      }
    }

    effect(() => {
      const isDark = this.isDarkMode();
      if (typeof window !== 'undefined' && document.body) {
        if (isDark) {
          document.body.classList.add('dark-theme');
          document.body.classList.remove('light-theme');
          localStorage.setItem('devboard_theme', 'dark');
        } else {
          document.body.classList.add('light-theme');
          document.body.classList.remove('dark-theme');
          localStorage.setItem('devboard_theme', 'light');
        }
      }
    });
  }

  toggleTheme() {
    this.isDarkMode.update(dark => !dark);
  }

  setDarkMode(isDark: boolean) {
    this.isDarkMode.set(isDark);
  }
}
