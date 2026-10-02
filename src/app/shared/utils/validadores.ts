import { AbstractControl, ValidationErrors } from '@angular/forms';

export function noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;

  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  //  Eliminamos los espacios y verificamos si la longitud queda en 0
  const soloEspacios = (valor || '').trim().length === 0;
  const esValido = !soloEspacios;

  // Retornamos el objeto de error si es inválido, o null si es válido
  return esValido ? null : { onlyWhitespace: true };
}
