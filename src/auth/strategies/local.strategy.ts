import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { LoggedUser } from 'src/users/interfaces/loggedUser';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'login' });
  }

  async validate(
    password: string,
    username: string | undefined,
    email: string | undefined,
  ): Promise<LoggedUser> {
    try {
      const user = await this.authService.validateUser(
        password,
        username,
        email,
      );
      if (!user) {
        throw new UnauthorizedException('Usuario o contraseña incorrectos');
      }
      return user; // Devuelve el usuario validado. Si no se encuentra el usuario, lanza una excepción UnauthorizedException.
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Error al validar el usuario'); // Si ocurre un error al validar el usuario, lanza una excepción BadRequestException.
    }
  }
}
