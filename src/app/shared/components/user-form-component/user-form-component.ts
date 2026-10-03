import { Component, input, output, signal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  required,
  email,
  minLength,
  maxLength,
  validate,
  SchemaPath,
  debounce,
  validateHttp,
} from '@angular/forms/signals';
import {
  AREA_LABEL,
  AREAS,
  RegisterData,
  Role,
  ROLES,
} from 'src/app/core/models/usuario.model';
import { environment } from 'src/environments/environment';
import { convertirRol } from '@shared/utils/convertidoFunction';
import { StatusIcon } from '../status-icon/status-icon';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';

@Component({
  selector: 'app-user-form-component',
  imports: [FormField, FormRoot, StatusIcon, LoadingSpinner],
  template: `
    <form [formRoot]="usuarioForm" class="space-y-4" novalidate>
      <div>
        <label for="uf-nombre" class="label">Nombre completo</label>
        <input
          id="uf-nombre"
          type="text"
          class="input"
          autocomplete="name"
          placeholder="Ej. Ana Torres"
          [formField]="usuarioForm.nombre"
          [attr.aria-invalid]="mostrarError(usuarioForm.nombre)"
        />
        @if (mostrarError(usuarioForm.nombre)) {
          <span class="field-error">{{ usuarioForm.nombre().errors()[0].message }}</span>
        }
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="uf-usuario" class="label">Usuario</label>
          <div class="relative">
            <input
              id="uf-usuario"
              type="text"
              class="input pr-9"
              autocomplete="username"
              placeholder="ana.torres"
              [formField]="usuarioForm.username"
              [attr.aria-invalid]="mostrarError(usuarioForm.username)"
            />
            <span class="absolute top-1/2 right-3 -translate-y-1/2">
              @if (usuarioForm.username().pending()) {
                <loading-spinner [size]="14" class="text-fg-subtle" />
              } @else if (usuarioForm.username().touched() && usuarioForm.username().value()) {
                <app-status-icon [isValid]="usuarioForm.username().valid()" />
              }
            </span>
          </div>
          @if (mostrarError(usuarioForm.username)) {
            <span class="field-error">{{ usuarioForm.username().errors()[0].message }}</span>
          }
        </div>

        <div>
          <label for="uf-area" class="label">Área</label>
          <select id="uf-area" class="input" [formField]="usuarioForm.area">
            @for (area of areas; track area) {
              <option [value]="area">{{ areaLabel[area] }}</option>
            }
          </select>
        </div>
      </div>

      <div>
        <label for="uf-correo" class="label">Correo electrónico</label>
        <div class="relative">
          <input
            id="uf-correo"
            type="email"
            class="input pr-9"
            autocomplete="email"
            placeholder="ana.torres@empresa.com"
            [formField]="usuarioForm.correo"
            [attr.aria-invalid]="mostrarError(usuarioForm.correo)"
          />
          <span class="absolute top-1/2 right-3 -translate-y-1/2">
            @if (usuarioForm.correo().pending()) {
              <loading-spinner [size]="14" class="text-fg-subtle" />
            } @else if (usuarioForm.correo().touched() && usuarioForm.correo().value()) {
              <app-status-icon [isValid]="usuarioForm.correo().valid()" />
            }
          </span>
        </div>
        @if (mostrarError(usuarioForm.correo)) {
          <span class="field-error">{{ usuarioForm.correo().errors()[0].message }}</span>
        }
      </div>

      @if (isAdmin()) {
        <div>
          <label for="uf-rol" class="label">Rol</label>
          <select
            id="uf-rol"
            class="input"
            [formField]="usuarioForm.rol"
            [attr.aria-invalid]="mostrarError(usuarioForm.rol)"
          >
            <option value="">Selecciona un rol</option>
            @for (rol of roles; track rol) {
              <option [value]="rol">{{ rolLabel(rol) }}</option>
            }
          </select>
          @if (mostrarError(usuarioForm.rol)) {
            <span class="field-error">{{ usuarioForm.rol().errors()[0].message }}</span>
          }
        </div>
      }

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="uf-password" class="label">Contraseña</label>
          <input
            id="uf-password"
            type="password"
            class="input"
            autocomplete="new-password"
            placeholder="Ej. @Admin123"
            aria-describedby="uf-password-hint"
            [formField]="usuarioForm.password"
            [attr.aria-invalid]="mostrarError(usuarioForm.password)"
          />
          @if (mostrarError(usuarioForm.password)) {
            <span class="field-error">{{ usuarioForm.password().errors()[0].message }}</span>
          } @else {
            <span id="uf-password-hint" class="text-xs text-fg-subtle">
              Mínimo 6 caracteres, una mayúscula, una minúscula, un número y un carácter especial.
            </span>
          }
        </div>
        <div>
          <label for="uf-confirm" class="label">Confirmar contraseña</label>
          <input
            id="uf-confirm"
            type="password"
            class="input"
            autocomplete="new-password"
            placeholder="Repite la contraseña"
            [formField]="usuarioForm.confirmPassword"
            [attr.aria-invalid]="mostrarError(usuarioForm.confirmPassword)"
          />
          @if (mostrarError(usuarioForm.confirmPassword)) {
            <span class="field-error">{{ usuarioForm.confirmPassword().errors()[0].message }}</span>
          }
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          class="btn btn-primary"
          [class.w-full]="!isAdmin()"
          [disabled]="usuarioForm().submitting() || usuarioForm().invalid() || usuarioForm().pending()"
        >
          @if (usuarioForm().submitting()) {
            <loading-spinner /> Guardando…
          } @else {
            {{ submitLabel() }}
          }
        </button>
      </div>
    </form>
  `,
})
export class UserFormComponent {
  isAdmin = input<boolean>(false);
  submitLabel = input('Crear usuario');
  submitForm = output<RegisterData>();

  protected areas = AREAS;
  protected areaLabel = AREA_LABEL;
  protected roles = ROLES;
  protected rolLabel = (r: Role) => convertirRol(r);

  usuarioModel = signal<RegisterData>({
    area: 'ADMINISTRACION',
    nombre: '',
    correo: '',
    username: '',
    password: '',
    confirmPassword: '',
    rol: '',
  });

  usuarioForm = form(
    this.usuarioModel,
    (schemaPath) => {
      required(schemaPath.area, { message: 'El área es obligatoria' });

      // El rol solo se pide cuando crea un administrador.
      validate(schemaPath.rol, ({ value }) =>
        this.isAdmin() && !value() ? { kind: 'required', message: 'Selecciona un rol' } : null,
      );

      required(schemaPath.correo, { message: 'El correo es obligatorio' });
      email(schemaPath.correo, { message: 'Ingresa un correo válido' });

      required(schemaPath.nombre, { message: 'El nombre es obligatorio' });
      minLength(schemaPath.nombre, 4, { message: 'Mínimo 4 caracteres' });
      maxLength(schemaPath.nombre, 35, { message: 'Máximo 35 caracteres' });
      this.notSpacesOnly(schemaPath.nombre, { message: 'El nombre no puede estar vacío' });

      required(schemaPath.username, { message: 'El usuario es obligatorio' });
      minLength(schemaPath.username, 4, { message: 'Mínimo 4 caracteres' });
      maxLength(schemaPath.username, 20, { message: 'Máximo 20 caracteres' });
      this.notSpaces(schemaPath.username, { message: 'Sin espacios' });

      // Misma política que el backend (UsuarioDTO.password)
      required(schemaPath.password, { message: 'La contraseña es obligatoria' });
      this.notSpaces(schemaPath.password, { message: 'Sin espacios' });
      minLength(schemaPath.password, 6, { message: 'Mínimo 6 caracteres' });
      maxLength(schemaPath.password, 72, { message: 'Máximo 72 caracteres' });
      this.contiene(schemaPath.password, /[A-Z]/, { message: 'Debe incluir al menos una mayúscula' });
      this.contiene(schemaPath.password, /[a-z]/, { message: 'Debe incluir al menos una minúscula' });
      this.contiene(schemaPath.password, /\d/, { message: 'Debe incluir al menos un número' });
      this.contiene(schemaPath.password, /[^A-Za-z0-9\s]/, {
        message: 'Debe incluir al menos un carácter especial (ej. @ # $ ! .)',
      });

      required(schemaPath.confirmPassword, { message: 'Confirma la contraseña' });
      validate(schemaPath.confirmPassword, ({ value, valueOf }) =>
        value() !== valueOf(schemaPath.password)
          ? { kind: 'passwordMismatch', message: 'Las contraseñas no coinciden' }
          : null,
      );

      // Disponibilidad en el servidor
      debounce(schemaPath.username, 500);
      validateHttp(schemaPath.username, {
        request: ({ value }) => `${environment.apiUrl}/api/auth/${encodeURIComponent(value())}`,
        onSuccess: (response: { exists: boolean }) =>
          response.exists ? { kind: 'usernameTaken', message: 'Este usuario ya existe' } : null,
        onError: () => ({ kind: 'serverError', message: 'No se pudo verificar el usuario' }),
      });

      debounce(schemaPath.correo, 500);
      validateHttp(schemaPath.correo, {
        request: ({ value }) =>
          `${environment.apiUrl}/api/auth/${encodeURIComponent(value())}/validacion`,
        onSuccess: (response: { exists: boolean }) =>
          response.exists ? { kind: 'emailTaken', message: 'Este correo ya está registrado' } : null,
        onError: () => ({ kind: 'serverError', message: 'No se pudo verificar el correo' }),
      });
    },
    {
      submission: {
        action: async (field) => {
          this.submitForm.emit({
            area: field.area().value(),
            nombre: field.nombre().value().trim(),
            correo: field.correo().value().trim(),
            username: field.username().value(),
            password: field.password().value(),
            confirmPassword: field.confirmPassword().value(),
            rol: this.isAdmin() ? field.rol().value() : '',
          });
        },
      },
    },
  );

  protected mostrarError(campo: () => { touched(): boolean; invalid(): boolean }) {
    const estado = campo();
    return estado.touched() && estado.invalid();
  }

  private notSpaces(path: SchemaPath<string>, options: { message: string }) {
    validate(path, ({ value }) =>
      value().includes(' ') ? { kind: 'no-spaces', message: options.message } : undefined,
    );
  }

  private contiene(path: SchemaPath<string>, patron: RegExp, options: { message: string }) {
    validate(path, ({ value }) =>
      value() && !patron.test(value()) ? { kind: 'pattern', message: options.message } : undefined,
    );
  }

  private notSpacesOnly(path: SchemaPath<string>, options: { message: string }) {
    validate(path, ({ value }) =>
      value().trim() === '' ? { kind: 'no-spaces', message: options.message } : undefined,
    );
  }
}
