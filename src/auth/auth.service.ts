import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoggedUser } from 'src/interfaces/loggedTypes';
import { UsersService } from 'src/users/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    username: string | undefined,
    email: string | undefined,
    password: string,
  ): Promise<LoggedUser> {
    try {
      if (!username && !email) {
        throw new BadRequestException('Usuario o email requerido');
      }
      const user = await this.usersService.validateUser(
        username,
        email,
        password,
      );
      if (!user) {
        throw new UnauthorizedException('Usuario o contraseña incorrectos');
      }
      return user;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Error al validar el usuario'); // Si ocurre un error al validar el usuario, lanza una excepción BadRequestException.
    }
  }

  async login(user: LoggedUser) {
    if (!user) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    const payload = { username: user.username, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
