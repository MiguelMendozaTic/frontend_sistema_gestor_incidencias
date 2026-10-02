import { Component, DestroyRef, ElementRef, inject, input, model, signal, viewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import { Area, AREA_LABEL, AREAS, Solicitante } from 'src/app/core/models/usuario.model';
import { Avatar } from '../badges/badges';
import { Icon } from '../icon/icon';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';

let siguienteId = 0;

/**
 * Selector de usuario solicitante: filtro por área + búsqueda por nombre.
 * Solo lista usuarios activos registrados; el aviso va a su correo registrado.
 */
@Component({
  selector: 'app-solicitante-picker',
  imports: [Avatar, Icon, LoadingSpinner],
  host: { '(document:click)': 'clickFuera($event)' },
  template: `
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
      <div>
        <label [for]="uid + '-area'" class="label">Área</label>
        <select [id]="uid + '-area'" class="input" (change)="cambiarArea($any($event.target).value)">
          <option value="" [selected]="!area()">Todas las áreas</option>
          @for (a of areas; track a) {
            <option [value]="a" [selected]="area() === a">{{ areaLabel[a] }}</option>
          }
        </select>
      </div>

      <div class="relative">
        <label [for]="uid + '-buscar'" class="label">Usuario <span class="text-danger">*</span></label>
        <div class="relative">
          <app-icon
            name="search"
            class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-fg-subtle"
          />
          <input
            #buscador
            [id]="uid + '-buscar'"
            type="text"
            class="input pl-8"
            role="combobox"
            autocomplete="off"
            placeholder="Escribe el nombre o usuario"
            [value]="texto()"
            [attr.aria-expanded]="abierto()"
            [attr.aria-controls]="uid + '-lista'"
            [attr.aria-activedescendant]="activo() >= 0 ? uid + '-op-' + activo() : null"
            [attr.aria-invalid]="invalido()"
            (focus)="abrir()"
            (input)="escribir($any($event.target).value)"
            (keydown)="teclado($event)"
          />
        </div>

        @if (abierto()) {
          <ul
            [id]="uid + '-lista'"
            role="listbox"
            class="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-line bg-surface py-1 shadow-lg"
          >
            @if (cargando()) {
              <li class="flex items-center gap-2 px-3 py-3 text-sm text-fg-subtle"><loading-spinner /> Buscando…</li>
            } @else if (error()) {
              <li class="px-3 py-3 text-sm text-danger">{{ error() }}</li>
            } @else {
              @for (u of resultados(); track u.id; let i = $index) {
                <li
                  [id]="uid + '-op-' + i"
                  role="option"
                  [attr.aria-selected]="seleccionado()?.id === u.id"
                  class="flex cursor-pointer items-center gap-3 px-3 py-2"
                  [class]="i === activo() ? 'bg-primary-soft' : 'hover:bg-surface-hover'"
                  (mousedown)="$event.preventDefault()"
                  (click)="elegir(u)"
                >
                  <app-avatar [nombre]="u.nombre" [size]="28" />
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-medium text-fg">{{ u.nombre }}</span>
                    <span class="block truncate text-xs text-fg-subtle">
                      &#64;{{ u.username }} · {{ areaLabel[u.area] }}
                    </span>
                  </span>
                  @if (seleccionado()?.id === u.id) {
                    <app-icon name="check" class="text-primary" />
                  }
                </li>
              } @empty {
                <li class="px-3 py-3 text-sm text-fg-subtle">
                  No hay usuarios activos{{ texto() ? ' que coincidan con “' + texto() + '”' : '' }}{{
                    area() ? ' en ' + areaLabel[area()!] : ''
                  }}.
                </li>
              }
            }
          </ul>
        }
      </div>
    </div>

    @if (seleccionado(); as s) {
      <div class="mt-3 flex items-center gap-3 rounded-md border border-line bg-surface-sunken px-3 py-2.5">
        <app-avatar [nombre]="s.nombre" [size]="36" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-fg">{{ s.nombre }}</p>
          <p class="truncate text-xs text-fg-subtle">&#64;{{ s.username }} · {{ areaLabel[s.area] }}</p>
          <p class="mt-0.5 flex items-center gap-1 truncate text-xs text-fg-muted" [title]="s.correo">
            <app-icon name="send" [size]="12" /> Se notificará a <strong class="font-medium">{{ s.correo }}</strong>
          </p>
        </div>
        <button type="button" class="btn btn-subtle h-8 px-2 text-xs" (click)="cambiar()">Cambiar</button>
      </div>
    } @else if (invalido()) {
      <span class="field-error">Selecciona el usuario solicitante.</span>
    }
  `,
})
export class SolicitantePicker {
  seleccionado = model<Solicitante | null>(null);
  invalido = input(false);

  protected uid = `solicitante-${++siguienteId}`;
  protected areas = AREAS;
  protected areaLabel = AREA_LABEL;

  protected area = signal<Area | null>(null);
  protected texto = signal('');
  protected resultados = signal<Solicitante[]>([]);
  protected abierto = signal(false);
  protected cargando = signal(false);
  protected error = signal('');
  protected activo = signal(-1);

  private userService = inject(UserService);
  private host = inject(ElementRef<HTMLElement>);
  private buscador = viewChild<ElementRef<HTMLInputElement>>('buscador');
  private timer?: ReturnType<typeof setTimeout>;
  private busquedaSub?: Subscription;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      this.busquedaSub?.unsubscribe();
    });
  }

  protected abrir() {
    this.abierto.set(true);
    this.buscar();
  }

  protected cambiarArea(valor: string) {
    this.area.set((valor || null) as Area | null);
    this.abierto.set(true);
    this.buscar();
  }

  protected escribir(valor: string) {
    this.texto.set(valor);
    this.abierto.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.buscar(), 300);
  }

  private buscar() {
    this.busquedaSub?.unsubscribe();
    this.cargando.set(true);
    this.error.set('');
    this.busquedaSub = this.userService.buscarSolicitantes(this.texto().trim(), this.area()).subscribe({
      next: (lista) => {
        this.resultados.set(lista);
        this.activo.set(lista.length ? 0 : -1);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de usuarios.');
        this.cargando.set(false);
      },
    });
  }

  protected elegir(u: Solicitante) {
    this.seleccionado.set(u);
    this.texto.set('');
    this.abierto.set(false);
  }

  protected cambiar() {
    this.buscador()?.nativeElement.focus();
  }

  protected teclado(e: KeyboardEvent) {
    const total = this.resultados().length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this.abierto()) return this.abrir();
      this.activo.set(total ? (this.activo() + 1) % total : -1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activo.set(total ? (this.activo() - 1 + total) % total : -1);
    } else if (e.key === 'Enter') {
      // Enter elige la opción resaltada y no envía el formulario.
      if (this.abierto() && this.activo() >= 0) {
        e.preventDefault();
        this.elegir(this.resultados()[this.activo()]);
      }
    } else if (e.key === 'Escape' && this.abierto()) {
      e.stopPropagation(); // no cerrar el modal
      this.abierto.set(false);
    }
  }

  protected clickFuera(e: MouseEvent) {
    if (this.abierto() && !this.host.nativeElement.contains(e.target as Node)) this.abierto.set(false);
  }
}
