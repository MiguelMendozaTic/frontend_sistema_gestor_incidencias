import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ConfiguracionService } from '@services/configuracion.service';

/** Indicador discreto del intervalo de recarga automática vigente. */
@Component({
  selector: 'app-auto-refresco-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (texto(); as t) {
      <span
        class="hidden items-center gap-1.5 text-xs text-fg-subtle sm:inline-flex"
        [title]="'Esta vista se actualiza sola cada ' + t"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-chart-closed" aria-hidden="true"></span>
        Auto · {{ t }}
      </span>
    }
  `,
})
export class AutoRefrescoBadge {
  private config = inject(ConfiguracionService);
  protected texto = computed(() => {
    const s = this.config.intervaloRefresco();
    if (!s) return '';
    return s % 60 === 0 ? `${s / 60} min` : `${s} s`;
  });
}
