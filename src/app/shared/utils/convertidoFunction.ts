import { Role } from 'src/app/core/models/usuario.model';

const ROL_LABEL: Partial<Record<Role, string>> = {
  ROLE_ADMIN: 'Administrador',
  ROLE_EMPLEADO: 'Empleado',
  ROLE_TECNICO_NIVEL_1: 'Técnico N1',
  ROLE_TECNICO_NIVEL_2: 'Técnico N2',
  ROLE_TECNICO_NIVEL_3: 'Técnico N3',
};

export const convertirRol = (rol: Role | string) => ROL_LABEL[rol as Role] ?? 'Sin rol';
