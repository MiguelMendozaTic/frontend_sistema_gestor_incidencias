import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { Page } from 'src/app/core/models/usuario.model';
import { Icon } from '../icon/icon';

/** Pie de tabla: rango mostrado, tamaño de página y navegación. */
@Component({
  selector: 'app-pagination',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-fg-muted"
      aria-label="Paginación"
    >
      <div class="flex items-center gap-3">
        <span>
          @if (total() > 0) {
            Mostrando <strong class="font-medium text-fg">{{ desde() }}–{{ hasta() }}</strong> de
            <strong class="font-medium text-fg">{{ total() }}</strong>
          } @else {
            Sin resultados
          }
        </span>
        <label class="flex items-center gap-2">
          <span class="sr-only sm:not-sr-only">Filas</span>
          <select
            class="input h-8 w-auto pr-8"
            (change)="cambiarTamano($any($event.target).value)"
          >
            @for (s of sizes(); track s) {
              <option [value]="s" [selected]="s === size()">{{ s }}</option>
            }
          </select>
        </label>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="btn-icon"
          [disabled]="current() === 0"
          (click)="current.set(current() - 1)"
          aria-label="Página anterior"
        >
          <app-icon name="chevron-left" />
        </button>
        @for (pag of paginas(); track $index) {
          @if (pag === -1) {
            <span class="px-1 text-fg-subtle" aria-hidden="true">…</span>
          } @else {
            <button
              type="button"
              class="h-8 min-w-8 cursor-pointer rounded-md px-2 text-sm font-medium transition-colors"
              [class]="
                pag === current()
                  ? 'bg-primary-soft text-primary-soft-fg'
                  : 'text-fg-muted hover:bg-surface-hover hover:text-fg'
              "
              [attr.aria-current]="pag === current() ? 'page' : null"
              (click)="current.set(pag)"
            >
              {{ pag + 1 }}
            </button>
          }
        }
        <button
          type="button"
          class="btn-icon"
          [disabled]="current() + 1 >= totalPaginas()"
          (click)="current.set(current() + 1)"
          aria-label="Página siguiente"
        >
          <app-icon name="chevron-right" />
        </button>
      </div>
    </nav>
  `,
})
export class Pagination {
  page = input<Page | null>(null);
  current = model(0);
  size = model(10);
  sizes = input([5, 10, 20, 50]);

  protected total = computed(() => this.page()?.totalElements ?? 0);
  protected totalPaginas = computed(() => Math.max(this.page()?.totalPages ?? 1, 1));
  protected desde = computed(() => this.current() * this.size() + 1);
  protected hasta = computed(() => Math.min((this.current() + 1) * this.size(), this.total()));

  /** Números de página con "…" (-1) cuando hay muchas. */
  protected paginas = computed(() => {
    const total = this.totalPaginas();
    const actual = this.current();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);

    const paginas = [0];
    const inicio = Math.max(actual - 1, 1);
    const fin = Math.min(actual + 1, total - 2);
    if (inicio > 1) paginas.push(-1);
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    if (fin < total - 2) paginas.push(-1);
    paginas.push(total - 1);
    return paginas;
  });

  protected cambiarTamano(valor: string) {
    this.size.set(Number(valor));
    this.current.set(0);
  }
}
