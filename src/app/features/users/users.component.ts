import { Component, computed, effect, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import {
  AREA_LABEL,
  Page,
  RegisterData,
  Role,
  ROLES,
  UserUpdate,
  Usuario,
} from 'src/app/core/models/usuario.model';
import { ModalGeneric } from '@shared/components/modal-generic/modal-generic';
import { UserFormComponent } from '@shared/components/user-form-component/user-form-component';
import { DetalleField, DetalleModal } from '@shared/components/detalle-modal/detalle-modal';
import { BuscadorInput } from '@shared/components/buscador-input/buscador-input';
import { Pagination } from '@shared/components/pagination/pagination';
import { LoadingSpinner } from '@shared/components/loading-spinner/loading-spinner';
import { Icon } from '@shared/components/icon/icon';
import { Avatar, RoleBadge, UserStateBadge } from '@shared/components/badges/badges';
import { convertirRol } from '@shared/utils/convertidoFunction';
import { mensajeError } from '@shared/utils/errores';
import { autoRefresco } from '@shared/utils/auto-refresco';
import { AutoRefrescoBadge } from '@shared/components/auto-refresco-badge';
import { UpdateUserForm } from './update-user-form/update-user-form';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    ModalGeneric,
    UserFormComponent,
    UpdateUserForm,
    DetalleModal,
    BuscadorInput,
    Pagination,
    LoadingSpinner,
    Icon,
    Avatar,
    RoleBadge,
    UserStateBadge,
    AutoRefrescoBadge,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Usuarios</h1>
          <p class="page-subtitle">Cuentas, roles y estado de acceso al sistema.</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="abrirCrear()">
          <app-icon name="plus" /> Nuevo usuario
        </button>
      </header>

      @if (aviso()) {
        <p class="alert alert-success" role="status">
          <app-icon name="check" class="mt-0.5" />
          <span class="flex-1">{{ aviso() }}</span>
          <button type="button" class="btn-icon -my-1 h-6 w-6" (click)="aviso.set('')" aria-label="Cerrar aviso">
            <app-icon name="x" [size]="14" />
          </button>
        </p>
      }

      <section class="card overflow-hidden">
        <div class="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <div class="w-full sm:w-80">
            <app-buscador-input
              placeholder="Buscar por nombre o correo"
              [searchTerm]="searchTerm()"
              (searchTermChange)="buscar($event)"
            />
          </div>
          <div class="inline-flex rounded-md border border-line p-0.5" role="group" aria-label="Filtrar por estado">
            @for (f of filtros; track f.valor) {
              <button
                type="button"
                class="h-7 cursor-pointer rounded px-3 text-sm font-medium transition-colors"
                [class]="
                  filtroEstado() === f.valor
                    ? 'bg-primary-soft text-primary-soft-fg'
                    : 'text-fg-muted hover:bg-surface-hover hover:text-fg'
                "
                [attr.aria-pressed]="filtroEstado() === f.valor"
                (click)="filtrar(f.valor)"
              >
                {{ f.label }}
              </button>
            }
          </div>
          <app-auto-refresco-badge class="ml-auto" />
          <button type="button" class="btn btn-subtle" (click)="getUsuarios()" [disabled]="loading()">
            <app-icon name="refresh" /> Actualizar
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="data-table min-w-[820px]">
            <thead>
              <tr>
                <th scope="col">Usuario</th>
                <th scope="col">Correo</th>
                <th scope="col" class="w-36">Área</th>
                <th scope="col" class="w-44">Roles</th>
                <th scope="col" class="w-24">Estado</th>
                <th scope="col" class="w-32 text-right"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                @for (i of esqueleto(); track i) {
                  <tr aria-hidden="true">
                    <td>
                      <div class="flex items-center gap-3">
                        <div class="skeleton h-8 w-8 rounded-full"></div>
                        <div class="skeleton h-3.5 w-32"></div>
                      </div>
                    </td>
                    <td><div class="skeleton h-3 w-40"></div></td>
                    <td><div class="skeleton h-3 w-20"></div></td>
                    <td><div class="skeleton h-4 w-20"></div></td>
                    <td><div class="skeleton h-4 w-14"></div></td>
                    <td></td>
                  </tr>
                }
              } @else if (error()) {
                <tr>
                  <td colspan="6" class="py-12 text-center">
                    <app-icon name="alert" [size]="28" class="mx-auto text-danger" />
                    <p class="mt-2 font-medium text-fg">{{ error() }}</p>
                    <button type="button" class="btn btn-secondary mt-4" (click)="getUsuarios()">Reintentar</button>
                  </td>
                </tr>
              } @else {
                @for (user of usuarios(); track user.id) {
                  <tr>
                    <td>
                      <div class="flex items-center gap-3">
                        <app-avatar [nombre]="user.nombre" />
                        <div class="min-w-0">
                          <p class="truncate font-medium text-fg">{{ user.nombre }}</p>
                          <p class="truncate text-xs text-fg-subtle">&#64;{{ user.username }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="truncate text-fg-muted">{{ user.correo }}</td>
                    <td class="text-fg-muted">{{ areaLabel[user.area] }}</td>
                    <td>
                      <div class="flex flex-wrap gap-1">
                        @for (r of user.roles; track r.id) {
                          <app-role-badge [rol]="r.name" />
                        } @empty {
                          <span class="text-xs text-fg-subtle">Sin rol</span>
                        }
                      </div>
                    </td>
                    <td><app-user-state-badge [estado]="user.estado" /></td>
                    <td>
                      <div class="flex items-center justify-end gap-0.5">
                        <button type="button" class="btn-icon" (click)="openModal(user.id)" title="Ver detalle" [attr.aria-label]="'Ver detalle de ' + user.nombre">
                          <app-icon name="eye" />
                        </button>
                        <button type="button" class="btn-icon" (click)="openRole(user)" title="Gestionar roles" [attr.aria-label]="'Gestionar roles de ' + user.nombre">
                          <app-icon name="shield" />
                        </button>
                        <button type="button" class="btn-icon" (click)="toogleIsUpdate(user.id)" title="Editar" [attr.aria-label]="'Editar a ' + user.nombre">
                          <app-icon name="pencil" />
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="py-14 text-center">
                      <app-icon name="users" [size]="32" class="mx-auto text-fg-subtle" />
                      <p class="mt-3 font-medium text-fg">
                        {{
                          searchTerm()
                            ? 'Sin resultados para “' + searchTerm() + '”'
                            : filtroEstado() === 'INACTIVO'
                              ? 'No hay usuarios inactivos'
                              : filtroEstado() === 'ACTIVO'
                                ? 'No hay usuarios activos'
                                : 'No hay usuarios registrados'
                        }}
                      </p>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <app-pagination [page]="page()" [(current)]="pageCurrent" [(size)]="size" />
      </section>
    </div>

    <!-- CREAR -->
    <app-modal-generic
      [(isOpen)]="isCreate"
      title="Nuevo usuario"
      description="La cuenta queda activa y puede iniciar sesión de inmediato."
      size="lg"
    >
      @if (errorForm()) {
        <p class="alert alert-error mb-4" role="alert">{{ errorForm() }}</p>
      }
      @if (isCreate()) {
        <app-user-form-component [isAdmin]="true" submitLabel="Crear usuario" (submitForm)="handleRegister($event)" />
      }
    </app-modal-generic>

    <!-- EDITAR -->
    <app-modal-generic [(isOpen)]="isUpdateUser" title="Editar usuario" size="lg">
      @if (isUpdateUser()) {
        <app-update-user-form
          [idUsuario]="idUser()"
          [loading]="guardando()"
          [error]="errorForm()"
          (dataResponse)="handleUpdate($event)"
          (cancel)="isUpdateUser.set(false)"
        />
      }
    </app-modal-generic>

    <!-- DETALLE -->
    <app-detalle-modal
      [(modal)]="verDetalle"
      [data]="dataForModal()"
      [error]="errorDetalle()"
      title="Detalle de usuario"
      [fields]="fieldsUser"
    />

    <!-- ROLES -->
    <app-modal-generic
      [(isOpen)]="isOpenRole"
      title="Roles del usuario"
      [description]="usuarioRol()?.nombre + ' · @' + usuarioRol()?.username"
    >
      @if (errorRol()) {
        <p class="alert alert-error mb-4" role="alert">{{ errorRol() }}</p>
      }
      <h3 class="label">Roles asignados</h3>
      <ul class="mb-5 divide-y divide-line rounded-md border border-line">
        @for (item of rolesUsuario(); track item.id) {
          <li class="flex items-center justify-between gap-2 px-3 py-2">
            <app-role-badge [rol]="item.name" />
            <button
              type="button"
              class="btn btn-subtle h-7 px-2 text-xs text-danger"
              [disabled]="rolesUsuario().length <= 1 || loadingRole()"
              [title]="rolesUsuario().length <= 1 ? 'El usuario debe conservar al menos un rol' : 'Quitar rol'"
              (click)="eliminarRol(item.name)"
            >
              Quitar
            </button>
          </li>
        }
      </ul>

      <form class="flex items-end gap-2" (submit)="$event.preventDefault(); submitChangeRole()">
        <div class="flex-1">
          <label for="nuevo-rol" class="label">Agregar rol</label>
          <select id="nuevo-rol" class="input" (change)="rolNuevo.set($any($event.target).value)">
            <option value="" [selected]="!rolNuevo()">Selecciona un rol</option>
            @for (r of rolesDisponibles(); track r) {
              <option [value]="r" [selected]="r === rolNuevo()">{{ rolLabel(r) }}</option>
            }
          </select>
        </div>
        <button type="submit" class="btn btn-primary" [disabled]="!rolNuevo() || loadingRole()">
          @if (loadingRole()) {
            <loading-spinner />
          } @else {
            Agregar
          }
        </button>
      </form>
    </app-modal-generic>
  `,
})
export class UsersComponent {
  private userService = inject(UserService);

  protected areaLabel = AREA_LABEL;
  protected rolLabel = (r: Role) => convertirRol(r);

  usuarios = signal<Usuario[]>([]);
  loading = signal(true);
  error = signal('');
  aviso = signal('');
  private avisoTimer?: ReturnType<typeof setTimeout>;

  searchTerm = signal('');
  filtroEstado = signal<'ACTIVO' | 'INACTIVO' | null>(null);
  protected readonly filtros = [
    { valor: null, label: 'Todos' },
    { valor: 'ACTIVO' as const, label: 'Activos' },
    { valor: 'INACTIVO' as const, label: 'Inactivos' },
  ];
  pageCurrent = signal(0);
  page = signal<Page | null>(null);
  size = signal(10);
  esqueleto = computed(() => Array.from({ length: Math.min(this.size(), 8) }, (_, i) => i));

  private searchSub?: Subscription;

  constructor() {
    effect(() => {
      this.pageCurrent();
      this.size();
      this.searchTerm();
      this.filtroEstado();
      this.getUsuarios();
    });

    autoRefresco(
      () => this.getUsuarios(true),
      () => this.verDetalle() || this.isCreate() || this.isUpdateUser() || this.isOpenRole(),
    );
  }

  filtrar(estado: 'ACTIVO' | 'INACTIVO' | null) {
    this.pageCurrent.set(0);
    this.filtroEstado.set(estado);
  }

  buscar(texto: string) {
    this.pageCurrent.set(0);
    this.searchTerm.set(texto);
  }

  /** `silencioso`: recarga en segundo plano, sin esqueleto ni mensajes de error. */
  getUsuarios(silencioso = false): void {
    if (silencioso && this.searchSub && !this.searchSub.closed) return;
    this.searchSub?.unsubscribe();
    if (!silencioso) {
      this.loading.set(true);
      this.error.set('');
    }
    this.searchSub = this.userService
      .getUsersPaginados(this.pageCurrent(), this.size(), this.searchTerm(), this.filtroEstado())
      .subscribe({
        next: (data) => {
          this.usuarios.set(data.content);
          this.page.set(data.page);
          this.loading.set(false);
        },
        error: (err) => {
          if (!silencioso) this.error.set(mensajeError(err, 'No se pudieron cargar los usuarios.'));
          this.loading.set(false);
        },
      });
  }

  private mostrarAviso(texto: string) {
    clearTimeout(this.avisoTimer);
    this.aviso.set(texto);
    this.avisoTimer = setTimeout(() => this.aviso.set(''), 5000);
  }

  /* DETALLE */
  verDetalle = signal(false);
  dataForModal = signal<Usuario | null>(null);
  errorDetalle = signal('');

  fieldsUser: DetalleField<Usuario>[] = [
    { label: 'Nombre', key: 'nombre' },
    { label: 'Usuario', key: 'username', format: (u: string) => '@' + u },
    { label: 'Correo', key: 'correo' },
    { label: 'Área', key: 'area', format: (a: keyof typeof AREA_LABEL) => AREA_LABEL[a] ?? a },
    { label: 'Estado', key: 'estado', format: (e: string) => (e === 'ACTIVO' ? 'Activo' : 'Inactivo') },
    { label: 'Roles', key: 'roles', isArray: true, itemFormat: (r: { name: Role }) => convertirRol(r.name) },
  ];

  openModal(id: bigint): void {
    this.dataForModal.set(null);
    this.errorDetalle.set('');
    this.verDetalle.set(true);
    this.userService.getUser(id).subscribe({
      next: (value) => this.dataForModal.set(value),
      error: (e) => this.errorDetalle.set(mensajeError(e, 'No se pudo cargar el usuario.')),
    });
  }

  /* CREAR */
  isCreate = signal(false);
  guardando = signal(false);
  errorForm = signal('');

  abrirCrear() {
    this.errorForm.set('');
    this.isCreate.set(true);
  }

  handleRegister(event: RegisterData) {
    this.errorForm.set('');
    this.userService.crearUsuario(event).subscribe({
      next: () => {
        this.isCreate.set(false);
        this.mostrarAviso(`Usuario ${event.username} creado correctamente.`);
        this.getUsuarios();
      },
      error: (err) => this.errorForm.set(mensajeError(err, 'No se pudo crear el usuario.')),
    });
  }

  /* EDITAR */
  isUpdateUser = signal(false);
  idUser = signal<bigint>(0n);

  toogleIsUpdate(id: bigint) {
    this.errorForm.set('');
    this.idUser.set(id);
    this.isUpdateUser.set(true);
  }

  handleUpdate(event: UserUpdate) {
    this.guardando.set(true);
    this.errorForm.set('');
    this.userService.updateUsuario(this.idUser(), event).subscribe({
      next: () => {
        this.guardando.set(false);
        this.isUpdateUser.set(false);
        this.mostrarAviso(`Usuario ${event.username} actualizado.`);
        this.getUsuarios();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorForm.set(mensajeError(err, 'No se pudieron guardar los cambios.'));
      },
    });
  }

  /* ROLES */
  isOpenRole = signal(false);
  usuarioRol = signal<Usuario | null>(null);
  rolesUsuario = computed(() => this.usuarioRol()?.roles ?? []);
  rolesDisponibles = computed(() =>
    ROLES.filter((r) => !this.rolesUsuario().some((u) => u.name === r)),
  );
  rolNuevo = signal<Role | ''>('');
  loadingRole = signal(false);
  errorRol = signal('');

  openRole(usu: Usuario) {
    this.usuarioRol.set(usu);
    this.rolNuevo.set('');
    this.errorRol.set('');
    this.isOpenRole.set(true);
  }

  submitChangeRole() {
    const usu = this.usuarioRol();
    const rol = this.rolNuevo();
    if (!usu || !rol) return;
    this.loadingRole.set(true);
    this.errorRol.set('');
    // El backend antepone "ROLE_" al asignar.
    this.userService.cambiarRol({ id: Number(usu.id), rol: rol.replace('ROLE_', '') }).subscribe({
      next: (r) => this.trasCambioRol(r.dato, `Rol ${convertirRol(rol)} asignado a ${usu.username}.`),
      error: (e) => {
        this.loadingRole.set(false);
        this.errorRol.set(mensajeError(e, 'No se pudo asignar el rol.'));
      },
    });
  }

  eliminarRol(rol: Role) {
    const usu = this.usuarioRol();
    if (!usu) return;
    this.loadingRole.set(true);
    this.errorRol.set('');
    this.userService.eliminarRol({ id: Number(usu.id), rol }).subscribe({
      next: (r) => this.trasCambioRol(r.dato, `Rol ${convertirRol(rol)} quitado a ${usu.username}.`),
      error: (e) => {
        this.loadingRole.set(false);
        this.errorRol.set(mensajeError(e, 'No se pudo quitar el rol.'));
      },
    });
  }

  private trasCambioRol(respuesta: { roles?: Usuario['roles'] } | undefined, mensaje: string) {
    this.loadingRole.set(false);
    this.rolNuevo.set('');
    const usu = this.usuarioRol();
    if (usu && respuesta?.roles) this.usuarioRol.set({ ...usu, roles: respuesta.roles });
    this.mostrarAviso(mensaje);
    this.getUsuarios();
  }
}
