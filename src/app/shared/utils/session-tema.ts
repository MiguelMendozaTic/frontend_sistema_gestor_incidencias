import { effect, Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'tema';

@Injectable({
  providedIn: 'root',
})
export class SessionThema {
  private isDark = signal(document.documentElement.classList.contains('dark'));
  public _isDark = this.isDark.asReadonly();

  constructor() {
    effect(() => {
      const dark = this.isDark();
      document.documentElement.classList.toggle('dark', dark);
      try {
        localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
      } catch {
        // almacenamiento no disponible: el tema solo dura la sesión
      }
    });
  }

  cambiarThema() {
    this.isDark.update((t) => !t);
  }
}
