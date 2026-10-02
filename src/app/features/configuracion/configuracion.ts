import { Component, effect, inject, signal } from '@angular/core';
import { ConfiguracionService } from '@services/configuracion.service';
import { Icon } from '@shared/components/icon/icon';
import { LoadingSpinner } from '@shared/components/loading-spinner/loading-spinner';
import { mensajeError } from '@shared/utils/errores';

interface Opcion {
  segundos: number;
  label: string;
  detalle: string;
}

@Component({
  selector: 'app-configuracion',
  imports: [Icon, LoadingSpinner],
  template: `
    <div class="page max-w-4xl">
      <header class="page-header">
        <div>
          <h1 class="page-title">Configuración</h1>
          <p class="page-subtitle">Ajustes generales del sistema. Se aplican a todos los usuarios.</p>
        </div>
      </header>

      <section class="card">
        <header class="border-b border-line px-5 py-4">
          <h2 class="flex items-center gap-2 text-sm font-semibold text-fg">
            <app-icon name="refresh" class="text-fg-subtle" /> Actualización automática
          </h2>
          <p class="mt-1 text-sm text-fg-subtle">
            Cada cuánto se recargan en segundo plano el panel, las incidencias, el seguimiento y los
            usuarios. La recarga es silenciosa y se pausa si la pestaña no está visible o hay una
            ventana abierta.
          </p>
        </header>

        <form class="p-5" (submit)="$event.preventDefault(); guardar()">
          <fieldset>
            <legend class="sr-only">Intervalo de recarga</legend>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              @for (op of opciones; track op.segundos) {
                <label
                  class="flex cursor-pointer flex-col rounded-md border px-3 py-2.5 transition-colors"
                  [class]="
                    seleccion() === op.segundos
                      ? 'border-primary bg-primary-soft'
                      : 'border-line hover:bg-surface-hover'
                  "
                >
                  <span class="flex items-center gap-2">
                    <input
                      type="radio"
                      name="intervalo"
                      class="accent-(--primary)"
                      [checked]="seleccion() === op.segundos"
                      (change)="seleccion.set(op.segundos)"
                    />
                    <span class="text-sm font-medium text-fg">{{ op.label }}</span>
                  </span>
                  <span class="mt-0.5 pl-5 text-xs text-fg-subtle">{{ op.detalle }}</span>
                </label>
              }
            </div>
          </fieldset>

          @if (error()) {
            <p class="alert alert-error mt-4" role="alert">{{ error() }}</p>
          }
          @if (aviso()) {
            <p class="alert alert-success mt-4" role="status">
              <app-icon name="check" class="mt-0.5" /> <span>{{ aviso() }}</span>
            </p>
          }

          <div class="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
            <p class="text-xs text-fg-subtle">
              Valor actual:
              <strong class="font-medium text-fg">{{ etiqueta(config.intervaloRefresco()) }}</strong>
            </p>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="guardando() || seleccion() === config.intervaloRefresco()"
            >
              @if (guardando()) {
                <loading-spinner /> Guardando…
              } @else {
                Guardar cambios
              }
            </button>
          </div>
        </form>
      </section>
    </div>
  `,
})
export class Configuracion {
  protected config = inject(ConfiguracionService);

  protected readonly opciones: Opcion[] = [
    { segundos: 0, label: 'Desactivada', detalle: 'Solo con el botón Actualizar' },
    { segundos: 15, label: '15 segundos', detalle: 'Casi en tiempo real' },
    { segundos: 20, label: '20 segundos', detalle: 'Muy frecuente' },
    { segundos: 30, label: '30 segundos', detalle: 'Recomendado' },
    { segundos: 60, label: '1 minuto', detalle: 'Equilibrado' },
    { segundos: 120, label: '2 minutos', detalle: 'Poca carga' },
    { segundos: 300, label: '5 minutos', detalle: 'Mínima carga' },
  ];

  protected seleccion = signal(30);
  protected guardando = signal(false);
  protected error = signal('');
  protected aviso = signal('');

  constructor() {
    this.config.cargar();
    // Sincroniza la selección con el valor guardado cuando llega del servidor.
    effect(() => this.seleccion.set(this.config.intervaloRefresco()));
  }

  protected etiqueta(segundos: number) {
    return this.opciones.find((o) => o.segundos === segundos)?.label ?? `${segundos} segundos`;
  }

  protected guardar() {
    this.guardando.set(true);
    this.error.set('');
    this.aviso.set('');
    this.config.guardar(this.seleccion()).subscribe({
      next: (c) => {
        this.guardando.set(false);
        this.aviso.set(
          c.intervaloRefresco
            ? `Las vistas se actualizarán cada ${this.etiqueta(c.intervaloRefresco).toLowerCase()}.`
            : 'Actualización automática desactivada.',
        );
      },
      error: (e) => {
        this.guardando.set(false);
        this.error.set(mensajeError(e, 'No se pudo guardar la configuración.'));
      },
    });
  }
}
