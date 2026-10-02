# 🔍 Componente Buscador Reutilizable

Un componente Angular 21 standalone, genérico y reactivo para búsqueda en tiempo real con **Signals**, **Tailwind CSS** y soporte para **Dark Mode**.

## 📦 Contenido

- `buscador.component.ts` - Componente principal con lógica de búsqueda
- `buscador.component.html` - Template con Tailwind CSS
- `buscador.component.css` - Estilos personalizados
- `EJEMPLO_INTEGRACION.md` - Guía completa de integración
- `README.md` - Este archivo

## ✨ Características

| Característica | Descripción |
|---|---|
| **Genérico** | `<T extends Record<string, any>>` funciona con cualquier tipo |
| **Signals** | Usa Angular Signals para reactividad máxima |
| **Computed** | Filtra datos automáticamente con `computed()` |
| **Debounce** | Optimiza rendimiento durante la búsqueda |
| **Dark Mode** | Soporte automático para tema oscuro |
| **Accesible** | Atributos ARIA y navegación por teclado |
| **Configurable** | Campos, placeholder, tiempo de debounce |
| **Estilizado** | Diseño profesional con Tailwind CSS |
| **Sin dependencias** | Solo usa `@angular/core` y `@angular/common` |

## 🚀 Uso Rápido

### 1. Importar el componente

```typescript
import { BuscadorComponent } from '../../shared/components/buscador/buscador.component';

@Component({
  selector: 'app-mi-componente',
  standalone: true,
  imports: [BuscadorComponent, CommonModule],
  template: `...`
})
export class MiComponente {
  // Tu código...
}
```

### 2. Usar en el template

```html
<app-buscador 
  [items]="misDatos()"
  [searchFields]="['nombre', 'email']"
  placeholder="Buscar por nombre o email..."
  (filteredResults)="onSearch($event)"
/>
```

### 3. Manejar resultados en el componente

```typescript
export class MiComponente {
  datosOriginales = signal<MiTipo[]>([...]);
  datosFiltrados = signal<MiTipo[]>([...]);

  onSearch(results: MiTipo[]): void {
    this.datosFiltrados.set(results);
  }
}
```

### 4. Usar los resultados en la tabla

```html
@for (item of datosFiltrados(); track item.id) {
  <tr>
    <td>{{ item.nombre }}</td>
    <td>{{ item.email }}</td>
  </tr>
}
```

## 📋 API Completa

### Inputs

```typescript
@input items: T[]  // Array de datos a buscar
@input searchFields: (keyof T)[]  // Campos donde buscar
@input placeholder: string  // Texto del placeholder (default: 'Buscar...')
@input debounceTime: number  // Tiempo en ms (default: 300)
@input minCharsToSearch: number  // Caracteres mínimos (default: 1)
```

### Outputs

```typescript
@output filteredResults: T[]  // Emite array filtrado
@output searchTermChanged: string  // Emite el término de búsqueda
```

### Métodos Públicos

```typescript
clearSearch(): void  // Limpia el búscador
getResultCount(): number  // Retorna cantidad de resultados
hasActiveSearch(): boolean  // Indica si hay búsqueda activa
```

### Signals Internos

```typescript
searchTerm: Signal<string>  // Término actual
isSearching: Signal<boolean>  // Estado de búsqueda (debounce)
computedFilteredResults: Signal<T[]>  // Resultados filtrados
```

## 💡 Ejemplos de Uso

### Ejemplo 1: Búsqueda Básica

```html
<app-buscador 
  [items]="usuarios()"
  [searchFields]="['name', 'email']"
  placeholder="Buscar usuario..."
  (filteredResults)="usuariosFiltrados.set($event)"
/>
```

### Ejemplo 2: Búsqueda Múltiple

```html
<app-buscador 
  [items]="incidencias()"
  [searchFields]="['title', 'description', 'status', 'priority']"
  placeholder="Buscar incidencias..."
  [debounceTime]="500"
  (filteredResults)="incidenciasFiltradas.set($event)"
/>
```

### Ejemplo 3: Con Acciones Personalizadas

```typescript
export class MiComponente {
  datos = signal<MiTipo[]>([...]);
  datosFiltrados = signal<MiTipo[]>([...]);
  estadoBusqueda = signal<string>('');

  onSearch(results: MiTipo[]): void {
    this.datosFiltrados.set(results);
    this.estadoBusqueda.set(`Encontrados: ${results.length}`);
  }
}
```

```html
<app-buscador 
  [items]="datos()"
  [searchFields]="['nombre']"
  (filteredResults)="onSearch($event)"
/>
<p>{{ estadoBusqueda() }}</p>
```

### Ejemplo 4: Búsqueda Condicional

```typescript
export class MiComponente {
  mostrarBuscador = signal<boolean>(false);
  datos = signal<MiTipo[]>([...]);
  datosFiltrados = signal<MiTipo[]>([...]);

  toggleBuscador(): void {
    this.mostrarBuscador.update(v => !v);
    if (!this.mostrarBuscador()) {
      this.datosFiltrados.set(this.datos());
    }
  }
}
```

```html
<button (click)="toggleBuscador()">Toggle Búsqueda</button>

@if (mostrarBuscador()) {
  <app-buscador 
    [items]="datos()"
    [searchFields]="['nombre']"
    (filteredResults)="datosFiltrados.set($event)"
  />
}
```

## 🎨 Personalización CSS

El componente usa Tailwind CSS por defecto. Para personalizar:

### Cambiar colores

Edita `buscador.component.html` y reemplaza las clases de color:

```html
<!-- De -->
[class.ring-blue-500]="hasActiveSearch()"

<!-- A -->
[class.ring-purple-500]="hasActiveSearch()"
```

### Cambiar tamaño del input

```html
<!-- De -->
<input class="text-sm" />

<!-- A -->
<input class="text-base" />
```

### Cambiar redondez

```html
<!-- De -->
<div class="rounded-lg">

<!-- A -->
<div class="rounded-full">
```

## ⚙️ Configuración Avanzada

### Aumentar Debounce para Búsquedas Pesadas

```html
<app-buscador 
  [debounceTime]="800"
  ...
/>
```

### Búsqueda Exacta (No Parcial)

Modifica `buscador.component.ts`, línea 68:

```typescript
// De:
return String(value).toLowerCase().includes(term);

// A:
return String(value).toLowerCase() === term;
```

### Búsqueda Case-Sensitive

Modifica `buscador.component.ts`, línea 68:

```typescript
// De:
return String(value).toLowerCase().includes(term);

// A:
return String(value).includes(term);
```

### Búsqueda por Regex

Modifica `buscador.component.ts`, línea 68:

```typescript
// De:
return String(value).toLowerCase().includes(term);

// A:
const regex = new RegExp(term, 'i');
return regex.test(String(value));
```

## 🧪 Testing

Ejemplo de test unitario:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuscadorComponent } from './buscador.component';

describe('BuscadorComponent', () => {
  let component: BuscadorComponent<any>;
  let fixture: ComponentFixture<BuscadorComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuscadorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BuscadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should filter items correctly', () => {
    const items = [
      { name: 'Juan', email: 'juan@example.com' },
      { name: 'María', email: 'maria@example.com' }
    ];
    
    component.items = signal(items);
    component.searchFields = signal(['name']);
    component.searchTerm.set('juan');

    expect(component.getResultCount()).toBe(1);
  });

  it('should clear search', () => {
    component.searchTerm.set('test');
    component.clearSearch();
    
    expect(component.searchTerm()).toBe('');
    expect(component.hasActiveSearch()).toBe(false);
  });
});
```

## 🔗 Integración Real

Para ver ejemplos de integración real con tus componentes de Incidencias y Usuarios, revisa:

📄 **EJEMPLO_INTEGRACION.md**

## 📝 Notas Importantes

- El componente es **genérico** con `<T extends Record<string, any>>`
- Los `searchFields` deben existir en el objeto `T`
- El debounce mejora el rendimiento evitando filtros innecesarios
- Los eventos `filteredResults` se emiten automáticamente con `effect()`
- Compatible con Angular 21+ y Tailwind CSS 3+
- Soporta modo oscuro automáticamente

## 🤝 Contribuciones

Este componente está diseñado para ser reutilizable. Siéntete libre de:

- Personalizar los estilos
- Agregar nuevas funcionalidades
- Adaptar según tus necesidades
- Compartir mejoras

## 📄 Licencia

Libre para usar en tu proyecto.

---

**¿Preguntas?** Revisa `EJEMPLO_INTEGRACION.md` para casos de uso específicos.
