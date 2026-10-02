import { Component, DestroyRef, inject, input, model, signal } from '@angular/core';
import { Icon } from '../icon/icon';

/** Campo de búsqueda con debounce. El backend busca desde 2 caracteres. */
@Component({
  selector: 'app-buscador-input',
  imports: [Icon],
  template: `
    <div class="relative">
      <app-icon
        name="search"
        class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-fg-subtle"
      />
      <input
        type="search"
        class="input pr-9 pl-8"
        [value]="texto()"
        (input)="onSearchChange($any($event.target).value)"
        [placeholder]="placeholder()"
        [attr.aria-label]="placeholder()"
      />
      @if (texto()) {
        <button
          type="button"
          class="btn-icon absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
          (click)="clearSearch()"
          aria-label="Limpiar búsqueda"
        >
          <app-icon name="x" [size]="14" />
        </button>
      }
    </div>
  `,
})
export class BuscadorInput {
  placeholder = input<string>('Buscar...');
  debounceTime = input<number>(400);
  searchTerm = model<string>('');

  protected texto = signal('');
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  onSearchChange(term: string): void {
    this.texto.set(term);
    clearTimeout(this.timer);
    const limpio = term.trim();
    if (limpio.length === 1) return;
    this.timer = setTimeout(() => this.searchTerm.set(limpio), this.debounceTime());
  }

  clearSearch(): void {
    clearTimeout(this.timer);
    this.texto.set('');
    this.searchTerm.set('');
  }
}
