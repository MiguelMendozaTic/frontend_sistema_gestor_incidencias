import {
  afterRenderEffect,
  Component,
  ElementRef,
  input,
  model,
  viewChild,
} from '@angular/core';
import { Icon } from '../icon/icon';

let siguienteId = 0;

/**
 * Diálogo modal accesible: título, cierre con Esc / clic fuera / botón,
 * y foco inicial dentro del panel. El pie se proyecta con [modal-footer].
 */
@Component({
  selector: 'app-modal-generic',
  imports: [Icon],
  host: { '(document:keydown.escape)': 'isOpen() && cerrar()' },
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-overlay p-4 sm:items-center"
        (click)="cerrar()"
      >
        <div
          #panel
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="tituloId"
          tabindex="-1"
          class="relative my-8 flex w-full animate-dialog-in flex-col rounded-lg border border-line bg-surface shadow-xl outline-none"
          [class]="size() === 'lg' ? 'max-w-2xl' : size() === 'sm' ? 'max-w-sm' : 'max-w-lg'"
          (click)="$event.stopPropagation()"
        >
          <header class="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
            <div class="min-w-0">
              <h2 [id]="tituloId" class="text-base font-semibold text-fg">{{ title() }}</h2>
              @if (description()) {
                <p class="mt-0.5 text-sm text-fg-subtle">{{ description() }}</p>
              }
            </div>
            <button type="button" class="btn-icon -mt-1 -mr-2" (click)="cerrar()" aria-label="Cerrar">
              <app-icon name="x" [size]="18" />
            </button>
          </header>

          <div class="px-6 pb-6">
            <ng-content />
          </div>

          <ng-content select="[modal-footer]" />
        </div>
      </div>
    }
  `,
})
export class ModalGeneric {
  isOpen = model<boolean>(false);
  title = input('');
  description = input('');
  size = input<'sm' | 'md' | 'lg'>('md');

  protected tituloId = `modal-titulo-${++siguienteId}`;
  private panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    afterRenderEffect(() => {
      if (this.isOpen()) this.panel()?.nativeElement.focus();
    });
  }

  cerrar() {
    this.isOpen.set(false);
  }
}
