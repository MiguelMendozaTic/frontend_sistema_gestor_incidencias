import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path:"",
    title: "Incidencia",
    loadComponent:  () => import('./incidencia.component').then(c => c.IncidenciaComponent),
  },
  {
    path:"seguimiento/:id",
    title: "Seguimiento",
    loadComponent:  () => import('./seguimiento-incidencia/seguimiento-incidencia').then(c => c.SeguimientoIncidencia),
  }
]
