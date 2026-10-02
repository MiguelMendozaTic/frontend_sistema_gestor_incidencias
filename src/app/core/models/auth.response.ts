import { Role } from './usuario.model';

export interface LoginResponse {
  token: string;
}

export interface Decoded {
  sub: string;
  authorities: Role[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: String;
  status: number;
  dato: T;
}

export interface UsuarioResponseDto {
  username: string;
  correo: String;
  roles: string[];
}
