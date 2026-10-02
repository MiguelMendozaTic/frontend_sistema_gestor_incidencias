# Integración del Componente Buscador

## Descripción General

El componente `BuscadorComponent` es un componente reutilizable de búsqueda que funciona con **Angular 21**, **Signals** y **Tailwind CSS**. Está diseñado para filtrar datos en tablas de forma eficiente.

## Características Principales

- ✅ **Signals**: Usa Angular Signals para reactividad
- ✅ **Computed Signals**: Filtra datos reactivamente
- ✅ **Debounce**: Optimiza el rendimiento de búsqueda
- ✅ **Tailwind CSS**: Diseño moderno y responsivo
- ✅ **Genérico**: Funciona con cualquier tipo de dato
- ✅ **Dark Mode**: Compatible con modo oscuro
- ✅ **Accesibilidad**: Incluye atributos ARIA

## Propiedades Configurables

### Inputs

| Propiedad | Tipo | Valor por Defecto | Descripción |
|-----------|------|------------------|-------------|
| `items` | `T[]` | `[]` | Array de items a buscar |
| `searchFields` | `(keyof T)[]` | `[]` | Campos donde buscar |
| `placeholder` | `string` | `'Buscar...'` | Texto del placeholder |
| `debounceTime` | `number` | `300` | Tiempo de debounce en ms |
| `minCharsToSearch` | `number` | `1` | Caracteres mínimos para buscar |

### Outputs

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `filteredResults` | `T[]` | Emite cuando los resultados cambian |
| `searchTermChanged` | `string` | Emite cuando cambia el término de búsqueda |

### Métodos Públicos

```typescript
clearSearch(): void  // Limpia la búsqueda
getResultCount(): number  // Retorna cantidad de resultados
hasActiveSearch(): boolean  // Indica si hay búsqueda activa
```

---

## Ejemplo 1: Integración con Incidencias

### Paso 1: Actualizar el componente incidencia.component.ts

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidenciaService } from '../../core/services/incident.service';
import { UserService } from '../../core/services/user.service';
import { BuscadorComponent } from '../../shared/components/buscador/buscador.component';
import { Incidencia } from '../../core/models/incident.model';
import { DetalleModal, DetalleField } from "./detalle-incidencia/detalle-incidencia";
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [CommonModule, DetalleModal, RouterLink, BuscadorComponent],
  templateUrl: './incidencia.component.html'
})
export class IncidenciaComponent {
  incidentService = inject(IncidenciaService);
  userService = inject(UserService);

  // Signal para almacenar los resultados filtrados
  filteredIncidents = signal<Incidencia[]>([]);

  verDetalle = signal(false);
  idIncidencia = signal<number | null>(null);

  constructor() {
    // Inicializar con todos los incidentes
    this.filteredIncidents.set(this.incidentService.incidents());
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'open': 'Abierta',
      'in_progress': 'En Progreso',
      'closed': 'Cerrada'
    };
    return labels[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'high': 'Alta',
      'medium': 'Media',
      'low': 'Baja'
    };
    return labels[priority] || priority;
  }

  getUserName(userId: string): string {
    const user = this.userService.getUserById(userId);
    return user?.name || 'Sin asignar';
  }

  // Manejador del evento filteredResults del buscador
  onSearchResults(results: Incidencia[]): void {
    this.filteredIncidents.set(results);
  }

  // Signal para almacenar datos del modal
  dataForModal = signal<Incidencia | null>(null);

  // Configuración de campos del modal
  incidenciaFields: DetalleField<Incidencia>[] = [
    { label: 'Título', key: 'titulo' as keyof Incidencia },
    { label: 'Descripción', key: 'descripcion' as keyof Incidencia },
    { label: 'Estado', key: 'estado' as keyof Incidencia },
    { label: 'Usuario', key: 'usuario' as keyof Incidencia, format: (u: any) => u?.nombre ?? '' },
    { label: 'Técnico', key: 'tecnico' as keyof Incidencia, format: (u: any) => u?.nombre ?? 'Sin asignar' },
  ];

  openModal(id: number): void {
    this.verDetalle.update(v => !v);
    this.idIncidencia.set(id);
    if (this.verDetalle()) {
      this.incidentService.getIncidencia(id).subscribe({
        next: (value) => this.dataForModal.set(value),
      });
    }
  }
}
```

### Paso 2: Actualizar incidencia.component.html

```html
<div class="space-y-6 p-6 dark:bg-gray-800 h-screen">
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Incidencias</h1>
    <p class="text-gray-500 dark:text-gray-400">Listado completo de incidencias</p>
  </div>

  <!-- Agregar el buscador aquí -->
  <div class="max-w-sm">
    <app-buscador 
      [items]="incidentService.incidents()"
      [searchFields]="['title', 'description', 'status']"
      placeholder="Buscar por título, descripción o estado..."
      [debounceTime]="300"
      (filteredResults)="onSearchResults($event)"
    />
  </div>

  <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-0 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700">
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">ID</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Título</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Estado</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Prioridad</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Asignado a</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Fecha</th>
            <th class="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Detalle</th>
            <th class="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Seguir</th>
          </tr>
        </thead>
        <tbody>
          @for (incident of filteredIncidents(); track incident.id) {
          <tr class="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/90 transition-colors">
            <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">#{{ incident.id }}</td>
            <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">{{ incident.title }}</td>
            <td class="py-3 px-4">
              <span class="px-3 py-1 text-xs font-medium rounded-full" 
                [class.bg-red-100]="incident.status === 'open'"
                [class.text-red-700]="incident.status === 'open'"
                [class.bg-amber-100]="incident.status === 'in_progress'"
                [class.text-amber-700]="incident.status === 'in_progress'"
                [class.bg-green-100]="incident.status === 'closed'"
                [class.text-green-700]="incident.status === 'closed'">
                {{ getStatusLabel(incident.status) }}
              </span>
            </td>
            <td class="py-3 px-4 dark:text-gray-400">
              <span class="px-3 py-1 text-xs font-medium rounded-full" 
                [class.bg-red-100]="incident.priority === 'high'"
                [class.text-red-700]="incident.priority === 'high'"
                [class.bg-amber-100]="incident.priority === 'medium'"
                [class.text-amber-700]="incident.priority === 'medium'"
                [class.bg-blue-100]="incident.priority === 'low'" 
                [class.text-blue-700]="incident.priority === 'low'">
                {{ getPriorityLabel(incident.priority) }}
              </span>
            </td>
            <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{{ getUserName(incident.assignedTo) }}</td>
            <td class="py-3 px-4 text-sm dark:text-gray-400 text-gray-600">{{ incident.createdAt }}</td>
            <td class="px-2">
              <button
                class="dark:text-white p-2 hover:bg-black/20 hover:cursor-pointer rounded-xl dark:hover:text-gray-500"
                (click)="openModal(incident.id)">Ver</button>
            </td>
            <td class="p-2 ">
              <a routerLink="/incidencia/seguimiento" class="flex items-center justify-start h-full ">
                <span class="p-2 rounded-full  hover:bg-black/20 hover:cursor-pointer dark:hover:text-gray-500">
                  <svg class="dark:text-white" aria-hidden="true" fill="none" stroke="currentColor"
                    xmlns="http://www.w3.org/2000/svg" width="14" height="18">
                    <path fill="currentColor"
                      d="M3.645 13.792h6.708v-1.25H3.645v1.25Zm0-3.542h6.708V9H3.645v1.25Zm-2.063 7.083a1.2 1.2 0 0 1-.875-.375 1.2 1.2 0 0 1-.375-.875V1.917a1.2 1.2 0 0 1 .375-.875 1.2 1.2 0 0 1 .875-.375h7.52l4.563 4.562v10.854a1.2 1.2 0 0 1-.375.875 1.2 1.2 0 0 1-.875.375H1.582ZM8.478 5.792V1.917H1.582v14.166h10.833V5.792H8.478Z" >
                    </path>
                  </svg>
                </span>
              </a>
            </td>
          </tr>
          }
          @if (filteredIncidents().length === 0) {
          <tr>
            <td colspan="8" class="py-8 text-center text-gray-500 dark:text-gray-400">
              No se encontraron incidencias que coincidan con la búsqueda
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>
  </div>
</div>

<app-detalle-modal
  [(modal)]="verDetalle"
  [data]="dataForModal()"
  [fields]="incidenciaFields"
  title="Detalle de la Incidencia"
  description="Información completa del registro seleccionado"
>
  <div footer class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
    <a routerLink="/incidencia/seguimiento" class="px-5 py-2 rounded-lg text-sm font-medium
             bg-blue-600 text-white
             hover:bg-blue-700 hover:scale-105
             transition-all duration-300">
      Ver seguimiento →
    </a>
  </div>
</app-detalle-modal>
```

---

## Ejemplo 2: Integración con Usuarios

### Paso 1: Actualizar users.component.ts

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { BuscadorComponent } from '../../shared/components/buscador/buscador.component';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, BuscadorComponent],
  templateUrl: './users.component.html',
})
export class UsersComponent {
  userService = inject(UserService);
  
  // Signal para almacenar los usuarios filtrados
  filteredUsers = signal<User[]>([]);

  constructor() {
    // Inicializar con todos los usuarios
    this.filteredUsers.set(this.userService.users());
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      support: 'Soporte',
      user: 'Usuario',
      ADMIN: 'Administrador',
      TECNICO_NIVEL_1: 'Técnico Nivel 1',
      EMPLEADO: 'Empleado'
    };
    return labels[role] || role;
  }

  // Manejador del evento filteredResults del buscador
  onSearchResults(results: User[]): void {
    this.filteredUsers.set(results);
  }
}
```

### Paso 2: Actualizar users.component.html

```html
<div class="space-y-6 p-6 dark:bg-gray-800 h-screen">
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
    <p class="text-gray-500 dark:text-gray-400">Gestión de usuarios del sistema</p>
  </div>

  <!-- Agregar el buscador aquí -->
  <div class="max-w-sm">
    <app-buscador 
      [items]="userService.users()"
      [searchFields]="['name', 'email', 'role']"
      placeholder="Buscar por nombre, email o rol..."
      [debounceTime]="300"
      (filteredResults)="onSearchResults($event)"
    />
  </div>

  <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-0 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700">
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">ID</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Rol</th>
          </tr>
        </thead>
        <tbody>
          @for (user of filteredUsers(); track user.id) {
          <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/90 transition-colors">
            <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">{{ user.id }}</td>
            <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span class="text-indigo-600 font-medium">{{ user.name.charAt(0) }}</span>
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-gray-400">{{ user.name }}</span>
              </div>
            </td>
            <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">{{ user.email }}</td>
            <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">
              <span class="px-3 py-1 text-xs font-medium rounded-full" 
                [class.bg-indigo-100]="user.role === 'ADMIN'"
                [class.text-indigo-700]="user.role === 'ADMIN'" 
                [class.bg-blue-100]="user.role === 'TECNICO_NIVEL_1'"
                [class.text-blue-700]="user.role === 'TECNICO_NIVEL_1'" 
                [class.bg-gray-100]="user.role === 'EMPLEADO'"
                [class.text-gray-700]="user.role === 'EMPLEADO'">
                {{ getRoleLabel(user.role) }}
              </span>
            </td>
          </tr>
          }
          @if (filteredUsers().length === 0) {
          <tr>
            <td colspan="4" class="py-8 text-center text-gray-500 dark:text-gray-400">
              No se encontraron usuarios que coincidan con la búsqueda
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>
  </div>
</div>
```

---

## Personalización Avanzada

### Búsqueda Case-Sensitive

Para hacer búsqueda sensible a mayúsculas, modifica la línea en `buscador.component.ts`:

```typescript
// Cambiar de:
return String(value).toLowerCase().includes(term);

// A:
return String(value).includes(term);
```

### Búsqueda Exacta

Para búsqueda exacta en lugar de parcial:

```typescript
return String(value).toLowerCase() === term;
```

### Búsqueda por Expresión Regular

```typescript
const regex = new RegExp(term, 'i');
return regex.test(String(value));
```

### Aumentar Debounce para Búsquedas Pesadas

```html
<app-buscador 
  [debounceTime]="500"
  ...
/>
```

---

## Ventajas

✅ **Reutilizable**: Funciona con cualquier tipo de dato genérico  
✅ **Reactivo**: Usa Signals de Angular 21 para máxima reactividad  
✅ **Eficiente**: Incluye debounce para optimizar rendimiento  
✅ **Accesible**: Soporta teclado y screen readers  
✅ **Estilizado**: Diseño profesional con Tailwind CSS  
✅ **Oscuro**: Soporta dark mode automáticamente  
✅ **Flexible**: Campos de búsqueda configurables  
✅ **Transparente**: Muestra contador de resultados
