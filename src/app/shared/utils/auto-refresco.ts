import { effect, inject } from '@angular/core';
import { ConfiguracionService } from '@services/configuracion.service';

/**
 * Ejecuta `recargar` cada N segundos según la configuración del administrador.
 * No recarga con la pestaña oculta ni mientras `pausado()` sea true (p. ej. un
 * modal abierto); al volver a la pestaña recarga si ya venció el intervalo.
 * Debe llamarse en un contexto de inyección (constructor).
 */
export function autoRefresco(recargar: () => void, pausado: () => boolean = () => false) {
  const config = inject(ConfiguracionService);
  let ultima = Date.now();

  const tick = (segundos: number) => {
    if (document.hidden || pausado()) return;
    if (Date.now() - ultima < segundos * 1000 - 250) return;
    ultima = Date.now();
    recargar();
  };

  effect((onCleanup) => {
    const segundos = config.intervaloRefresco();
    if (!segundos) return;

    const id = setInterval(() => tick(segundos), segundos * 1000);
    const alVolver = () => !document.hidden && tick(segundos);
    document.addEventListener('visibilitychange', alVolver);

    onCleanup(() => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', alVolver);
    });
  });
}
