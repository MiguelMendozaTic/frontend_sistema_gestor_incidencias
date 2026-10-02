import { Component, computed, input, model } from '@angular/core';
import { ModalGeneric } from '../modal-generic/modal-generic';

export interface DetalleField<T> {
  label: string;
  key: keyof T;

  // para valores simples
  format?: (value: any) => string;

  // para arrays
  isArray?: boolean;
  itemFormat?: (item: any) => string;

  // ocupa las dos columnas (textos largos)
  wide?: boolean;
}

interface CampoDetalle {
  label: string;
  value: unknown;
  items: string[];
  isArray: boolean;
  wide: boolean;
}

@Component({
  selector: 'app-detalle-modal',
  imports: [ModalGeneric],
  template: `
    <app-modal-generic [(isOpen)]="modal" [title]="title()" [description]="description()" size="lg">
      @if (error()) {
        <p class="alert alert-error mb-4" role="alert">{{ error() }}</p>
      }
      @if (!data()) {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-busy="true">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="space-y-2">
              <div class="skeleton h-3 w-20"></div>
              <div class="skeleton h-4 w-40"></div>
            </div>
          }
        </div>
      } @else {
        <dl class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          @for (item of campos(); track item.label) {
            <div [class]="item.wide ? 'sm:col-span-2' : ''">
              <dt class="text-xs font-semibold text-fg-subtle">{{ item.label }}</dt>
              <dd class="mt-1 text-sm break-words whitespace-pre-line text-fg">
                @if (item.isArray) {
                  {{ item.items.join(', ') || '—' }}
                } @else {
                  {{ item.value ?? '—' }}
                }
              </dd>
            </div>
          }
        </dl>
      }
      <ng-content select="[footer]" />
    </app-modal-generic>
  `,
})
export class DetalleModal<T extends Record<string, any>> {
  modal = model(false);

  data = input<T | null>(null);
  fields = input<DetalleField<T>[]>([]);

  title = input('Detalle del registro');
  description = input('');
  error = input('');

  campos = computed<CampoDetalle[]>(() => {
    const entity = this.data();
    if (!entity) return [];

    return this.fields().map((field) => {
      const rawValue = entity[field.key];
      const items: unknown[] = Array.isArray(rawValue) ? rawValue : [];
      return {
        label: field.label,
        value: field.format ? field.format(rawValue) : rawValue,
        isArray: !!field.isArray,
        items: items.map((i) => (field.itemFormat ? field.itemFormat(i) : String(i))),
        wide: !!field.wide,
      };
    });
  });
}
