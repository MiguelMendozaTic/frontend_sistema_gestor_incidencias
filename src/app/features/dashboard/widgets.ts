import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IncidentStatsDTO } from 'src/app/core/models/dashboard.model';
import { ESTADO_LABEL, Status } from 'src/app/core/models/incident.model';

interface Segmento {
  estado: Status;
  label: string;
  valor: number;
  pct: number;
  color: string;
}

const COLOR: Record<Status, string> = {
  ABIERTO: 'bg-chart-open',
  PENDIENTE: 'bg-chart-progress',
  CERRADO: 'bg-chart-closed',
};

function segmentos(stats: IncidentStatsDTO | null): Segmento[] {
  const valores: [Status, number][] = [
    ['ABIERTO', stats?.abiertas ?? 0],
    ['PENDIENTE', stats?.enProgreso ?? 0],
    ['CERRADO', stats?.cerradas ?? 0],
  ];
  const total = valores.reduce((a, [, v]) => a + v, 0);
  return valores.map(([estado, valor]) => ({
    estado,
    label: ESTADO_LABEL[estado],
    valor,
    pct: total ? Math.round((valor / total) * 100) : 0,
    color: COLOR[estado],
  }));
}

/** Fila de KPIs: el número va en tinta de texto; el color solo marca el estado. */
@Component({
  selector: 'app-kpi-tiles',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div class="card p-4">
        <p class="text-xs font-semibold text-fg-subtle">{{ totalLabel() }}</p>
        @if (stats(); as s) {
          <p class="mt-2 text-3xl font-semibold tracking-tight text-fg tabular-nums">{{ s.total }}</p>
        } @else {
          <div class="skeleton mt-3 h-7 w-12"></div>
        }
      </div>
      @for (seg of segs(); track seg.estado) {
        <div class="card p-4">
          <p class="flex items-center gap-1.5 text-xs font-semibold text-fg-subtle">
            <span class="h-2.5 w-2.5 rounded-sm" [class]="seg.color" aria-hidden="true"></span>
            {{ seg.label }}
          </p>
          @if (stats()) {
            <p class="mt-2 flex items-baseline gap-2">
              <span class="text-3xl font-semibold tracking-tight text-fg tabular-nums">{{ seg.valor }}</span>
              <span class="text-xs text-fg-subtle tabular-nums">{{ seg.pct }}%</span>
            </p>
          } @else {
            <div class="skeleton mt-3 h-7 w-12"></div>
          }
        </div>
      }
    </div>
  `,
})
export class KpiTiles {
  stats = input<IncidentStatsDTO | null>(null);
  totalLabel = input('Total de incidencias');
  protected segs = computed(() => segmentos(this.stats()));
}

/** Barra apilada 100% con separación de 2px, leyenda con valores y tooltip. */
@Component({
  selector: 'app-estado-distribucion',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!stats()) {
      <div class="skeleton h-3 w-full"></div>
    } @else if (total() === 0) {
      <p class="py-6 text-center text-sm text-fg-subtle">Aún no hay incidencias para mostrar.</p>
    } @else {
      <div
        class="flex h-3 w-full gap-0.5"
        role="img"
        [attr.aria-label]="descripcion()"
      >
        @for (seg of visibles(); track seg.estado) {
          <div
            class="h-full first:rounded-l last:rounded-r"
            [class]="seg.color"
            [style.width.%]="seg.pct"
            [title]="seg.label + ': ' + seg.valor + ' (' + seg.pct + '%)'"
          ></div>
        }
      </div>
      <table class="mt-4 w-full text-sm">
        <caption class="sr-only">Incidencias por estado</caption>
        <tbody>
          @for (seg of segs(); track seg.estado) {
            <tr class="border-b border-line last:border-b-0">
              <th scope="row" class="py-2 text-left font-normal text-fg-muted">
                <span class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-sm" [class]="seg.color" aria-hidden="true"></span>
                  {{ seg.label }}
                </span>
              </th>
              <td class="py-2 text-right font-medium text-fg tabular-nums">{{ seg.valor }}</td>
              <td class="w-14 py-2 text-right text-fg-subtle tabular-nums">{{ seg.pct }}%</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class EstadoDistribucion {
  stats = input<IncidentStatsDTO | null>(null);
  protected segs = computed(() => segmentos(this.stats()));
  protected visibles = computed(() => this.segs().filter((s) => s.valor > 0));
  protected total = computed(() => this.segs().reduce((a, s) => a + s.valor, 0));
  protected descripcion = computed(() =>
    this.segs().map((s) => `${s.label} ${s.valor} (${s.pct}%)`).join(', '),
  );
}
