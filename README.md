# 📂 Frontend Sistema Gestor Incidencias

Este proyecto está desarrollado en **Angular** y sigue una arquitectura modular que facilita la escalabilidad, el mantenimiento y la reutilización de componentes. La estructura de carpetas está organizada en torno a cuatro bloques principales: **Core**, **Shared**, **Features** y **Layout**.

---

## 🏗️ Estructura del proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── services
│   │   ├── guards
│   │   └── models
│   ├── shared/ 
│   │   ├── components
│   │   ├── pipes
│   │   └── utils
│   ├── features/ 
│   │   ├── auth
│   │   ├── users
│   │   └── dashboard
│   └── layout/ 
│       ├── header
│       └── sidebar
│   

```

---

## 📌 Descripción de cada carpeta

### 1. **Core**
Contiene la lógica fundamental y transversal del sistema:
- **Services**: Servicios que interactúan con APIs y encapsulan lógica de negocio (ej. `auth-api.service.ts`).
- **Guards**: Guardas de rutas para controlar acceso según autenticación o roles.
- **Models**: Interfaces y clases que definen las entidades del dominio (ej. `User`, `Incident`).

### 2. **Shared**
Incluye elementos reutilizables en todo el proyecto:
- **Components**: Componentes genéricos como botones, modales o tablas.
- **Pipes**: Transformaciones de datos (ej. formateo de fechas).
- **Utils**: Funciones auxiliares y helpers comunes.

### 3. **Features**
Agrupa los módulos funcionales del sistema:
- **Auth**: Módulo de autenticación (login, registro, recuperación de contraseña).
- **Users**: Gestión de usuarios (CRUD, roles, permisos).
- **Dashboard**: Panel principal con métricas y visualización de incidencias.

Cada módulo se carga de forma **lazy loading**, optimizando el rendimiento al cargar solo lo necesario.

### 4. **Layout**
Define la estructura visual del sistema:
- **Header**: Barra superior con navegación y acciones rápidas.
- **Sidebar**: Menú lateral para acceder a las distintas secciones.

---

## ⚙️ Ejemplos de implementación

- **Servicio en Core**
```typescript
// core/services/auth-api.service.ts
export class AuthApiService {
  login(creds): Observable<User> {
    return this.http.post<User>("/api/auth/login", creds);
  }
}
