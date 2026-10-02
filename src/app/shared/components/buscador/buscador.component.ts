import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Componente reutilizable de búsqueda para tablas
 *
 * Características:
 * - Búsqueda en tiempo real con signals
 * - Configurable para buscar en múltiples campos
 * - Debounce para optimizar rendimiento
 * - Diseño Tailwind CSS
 * - Compatible con Angular 21 standalone
 *
 * Ejemplo de uso:
 * <app-buscador
 *   [items]="incidentService.incidents()"
 *   [searchFields]="['title', 'description', 'status']"
 *   placeholder="Buscar incidencias..."
 *   (filteredResults)="onSearchResults($event)"
 * />
 */

@Component({
  selector: 'app-buscador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscador.component.html',
  styleUrls: ['./buscador.component.css']
})
export class BuscadorComponent<T extends Record<string, any>> {
  // Inputs
  items = input<T[]>([]);
  searchFields = input<(keyof T)[]>([]);
  placeholder = input<string>('Buscar...');
  debounceTime = input<number>(800);
  minCharsToSearch = input<number>(1);

  // Outputs
  filteredResults = output<T[]>();
  searchTermChanged = output<string>();

  // Signals
  searchTerm = signal<string>('');
  isSearching = signal<boolean>(false);
  private debounceTimer = signal<ReturnType<typeof setTimeout> | null>(null);

  // Computed signal para resultados filtrados
  computedFilteredResults = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const itemsList = this.items();
    const fields = this.searchFields();

    // Si el término es muy corto o vacío, retornar todos los items
    if (term.length < this.minCharsToSearch()) {
      return itemsList;
    }

    // Filtrar items que coincidan con el término en alguno de los campos especificados
    return itemsList.filter(item => {
      return fields.some(field => {
        const value = item[field];
        if (value === null || value === undefined) {
          return false;
        }

        // Convertir a string y hacer búsqueda case-insensitive
        return String(value).toLowerCase().includes(term);
      });
    });
  });

  constructor() {
    // Effect para emitir los resultados filtrados cuando cambien
    effect(() => {
      const results = this.computedFilteredResults();
      this.filteredResults.emit(results);
    });
  }

  /**
   * Maneja el cambio en el input de búsqueda con debounce
   */
  onSearchChange(term: string): void {
    // Limpiar timer anterior si existe
    const timer = this.debounceTimer();
    if (timer) {
      clearTimeout(timer);
    }

    this.isSearching.set(true);
    this.searchTerm.set(term);

    // Emitir evento de cambio de búsqueda
    this.searchTermChanged.emit(term);

    // Set nuevo timer con debounce
    const newTimer = setTimeout(() => {
      this.isSearching.set(false);
    }, this.debounceTime());

    this.debounceTimer.set(newTimer);
  }

  /**
   * Limpia la búsqueda
   */
  clearSearch(): void {
    this.searchTerm.set('');
    const timer = this.debounceTimer();
    if (timer) {
      clearTimeout(timer);
    }
    this.isSearching.set(false);
  }

  /**
   * Retorna el número de resultados encontrados
   */
  getResultCount(): number {
    return this.computedFilteredResults().length;
  }

  /**
   * Retorna si hay búsqueda activa
   */
  hasActiveSearch(): boolean {
    return this.searchTerm().length >= this.minCharsToSearch();
  }
}
