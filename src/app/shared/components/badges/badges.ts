import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  ESTADO_LABEL,
  Prioridad,
  PRIORIDAD_LABEL,
  Status,
} from 'src/app/core/models/incident.model';
import { Role } from 'src/app/core/models/usuario.model';
import { convertirRol } from '@shared/utils/convertidoFunction';
import { Icon, IconName } from '../icon/icon';

const ESTADO_CLASS: Record<Status, string> = {
  ABIERTO: 'bg-primary-soft text-primary-soft-fg',
  PENDIENTE: 'bg-warning-soft text-warning-soft-fg',
  CERRADO: 'bg-success-soft text-success-soft-fg',
};

/** Estado de la incidencia: siempre texto + color, nunca solo color. */
@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="lozenge" [class]="clase()">{{ texto() }}</span>`,
})
export class StatusBadge {
  estado = input.required<Status>();
  protected texto = computed(() => ESTADO_LABEL[this.estado()] ?? this.estado());
  protected clase = computed(() => ESTADO_CLASS[this.estado()] ?? 'bg-neutral-soft text-neutral-soft-fg');
}

const PRIORIDAD_ICON: Record<Prioridad, { icon: IconName; color: string }> = {
  CRITICA: { icon: 'chevrons-up', color: 'text-danger' },
  ALTA: { icon: 'chevron-up', color: 'text-orange-soft-fg' },
  MEDIA: { icon: 'equal', color: 'text-warning-soft-fg' },
  BAJA: { icon: 'chevron-down', color: 'text-primary' },
};

/** Prioridad al estilo de las herramientas ITSM: icono direccional + nombre. */
@Component({
  selector: 'app-priority-badge',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (prioridad(); as p) {
      <span class="inline-flex items-center gap-1 text-sm whitespace-nowrap text-fg">
        <app-icon [name]="meta(p).icon" [size]="16" [stroke]="2.5" [class]="meta(p).color" />
        {{ label(p) }}
      </span>
    } @else {
      <span class="text-sm whitespace-nowrap text-fg-subtle">Sin definir</span>
    }
  `,
})
export class PriorityBadge {
  prioridad = input<Prioridad | null | undefined>(null);
  protected meta = (p: Prioridad) => PRIORIDAD_ICON[p];
  protected label = (p: Prioridad) => PRIORIDAD_LABEL[p];
}

@Component({
  selector: 'app-role-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="lozenge" [class]="clase()">{{ texto() }}</span>`,
})
export class RoleBadge {
  rol = input.required<Role>();
  protected texto = computed(() => convertirRol(this.rol()));
  protected clase = computed(() =>
    this.rol() === 'ROLE_ADMIN'
      ? 'bg-primary-soft text-primary-soft-fg'
      : 'bg-neutral-soft text-neutral-soft-fg',
  );
}

@Component({
  selector: 'app-user-state-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="lozenge"
      [class]="
        estado() === 'ACTIVO'
          ? 'bg-success-soft text-success-soft-fg'
          : 'bg-neutral-soft text-neutral-soft-fg'
      "
      >{{ estado() === 'ACTIVO' ? 'Activo' : 'Inactivo' }}</span
    >
  `,
})
export class UserStateBadge {
  estado = input.required<'ACTIVO' | 'INACTIVO' | string>();
}

/** Avatar con iniciales (sin servicios externos de imágenes). */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0' },
  template: `
    <span
      class="inline-flex items-center justify-center rounded-full font-semibold select-none"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.font-size.px]="size() * 0.4"
      [style.background-color]="color().bg"
      [style.color]="color().fg"
      aria-hidden="true"
      >{{ iniciales() }}</span
    >
  `,
})
export class Avatar {
  nombre = input<string | null | undefined>('');
  size = input(32);

  protected iniciales = computed(() => {
    const partes = (this.nombre() ?? '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    const [a, b] = partes;
    return ((a[0] ?? '') + (b?.[0] ?? a[1] ?? '')).toUpperCase();
  });

  // Colores fijos por nombre para que cada persona conserve el suyo.
  private static readonly PALETA = [
    { bg: '#E9F2FF', fg: '#0055CC' },
    { bg: '#DCFFF1', fg: '#216E4E' },
    { bg: '#F3F0FF', fg: '#5E4DB2' },
    { bg: '#FFF3EB', fg: '#A54800' },
    { bg: '#E7F9FF', fg: '#206A83' },
    { bg: '#FFECF8', fg: '#943D73' },
  ];
  protected color = computed(() => {
    const n = this.nombre() ?? '';
    let h = 0;
    for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return Avatar.PALETA[h % Avatar.PALETA.length];
  });
}
