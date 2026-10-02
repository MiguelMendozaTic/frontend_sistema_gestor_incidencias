import { HttpErrorResponse } from '@angular/common/http';

/**
 * Convierte un error HTTP del backend en un mensaje para el usuario.
 * El backend responde con texto plano, { message } o { errors: { campo: msg } }.
 */
export function mensajeError(e: unknown, porDefecto = 'Ocurrió un error inesperado.'): string {
  if (!(e instanceof HttpErrorResponse)) return porDefecto;
  if (e.status === 0) return 'No se pudo conectar con el servidor.';
  if (e.status === 403) {
    const msg = typeof e.error === 'object' ? e.error?.message : e.error;
    return msg || 'No tienes permisos para realizar esta acción.';
  }

  const body = e.error;
  if (typeof body === 'string' && body.trim()) return body;
  if (body?.errors && typeof body.errors === 'object') {
    const primero = Object.values(body.errors)[0];
    if (typeof primero === 'string') return primero;
  }
  if (typeof body?.message === 'string' && body.message) return body.message;
  return porDefecto;
}
