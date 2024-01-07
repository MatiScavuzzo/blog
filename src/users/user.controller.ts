import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Put,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { LoginRequest } from './interfaces/loggedUser';
import {
  PublicProfile,
  PublicUserInfo,
  PublicUserInfoAdmin,
} from './interfaces/publicUserInfo';
import { UpdateUserDto } from './dto/update-user.dto';

// Recordatorio: Agregar recovery password method (Olvidó su contraseña)

enum Roles {
  ADMIN = 'admin',
  USER = 'user',
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Request() req: LoginRequest,
  ): Promise<PublicUserInfoAdmin[] | PublicUserInfo[] | { message: string }> {
    try {
      const { role } = req.user;
      if (role === Roles.ADMIN) {
        const users = await this.usersService.findAllAdmin();
        if (!users) {
          return { message: 'No hay usuarios para mostrar' };
        }
        return users; // Si el usuario es administrador, devuelve todos los usuarios.
      } else {
        const users = await this.usersService.findAll();
        if (!users) {
          return { message: 'No hay usuarios para mostrar' };
        }
        return users; // Si el usuario es público, devuelve sólo el username (por ejemplo para clickearlos y acceder a los perfiles)
      }
    } catch (error) {
      throw new BadRequestException('Error al mostrar usuarios'); // Si ocurre un error al mostrar los usuarios, lanza una excepción BadRequestException.
    }
  }

  @Get(':username')
  async findOne(@Param('username') username: string): Promise<PublicProfile> {
    try {
      const user = await this.usersService.findProfile(username);
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }
      return user;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al buscar el perfil');
    }
  }

  @UseGuards(JwtAuthGuard) // Solo los usuarios dueños del perfil o los administradores pueden modificar perfiles
  @Put(':username')
  async updateProfile(
    @Req() req: LoginRequest,
    @Param('username') username: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<{ message: string }> {
    try {
      const { username: usernameRequest, role } = req.user;
      if (usernameRequest !== username && role !== Roles.ADMIN) {
        throw new ForbiddenException(
          'No tienes permisos para realizar esta acción',
        );
      }
      await this.usersService.updateUser(username, updateUserDto);
      return { message: 'Perfil actualizado correctamente' };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al actualizar el perfil, contacte con el administrador',
      );
    }
  }

  @UseGuards(JwtAuthGuard) // Solo los dueños del perfil o los administradores pueden eliminar perfiles
  @Delete(':username')
  async deleteProfile(
    @Req() req: LoginRequest,
    @Param('username') username: string,
  ): Promise<{ message: string }> {
    try {
      const { username: usernameRequest, role } = req.user;
      if (usernameRequest !== username && role !== Roles.ADMIN) {
        throw new ForbiddenException(
          'No tienes permisos para realizar esta acción',
        );
      }
      await this.usersService.deleteUser(username);
      return { message: 'Perfil eliminado correctamente' };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'No se pudo eliminar el post, contacte con el administrador',
      );
    }
  }

  @Post()
  async newUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ message: string }> {
    try {
      await this.usersService.createUser(createUserDto);
      return { message: 'Usuario creado correctamente' }; // Si el usuario se crea correctamente, devuelve un mensaje de éxito.
    } catch (error) {
      throw new InternalServerErrorException(
        'Ocurrió un error al crear el usuario',
        error,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':username/change-pass')
  async updatePassword(
    @Request() req: LoginRequest,
    @Param('username') username: string,
    @Body() { password, newPassword },
  ): Promise<{ message: string }> {
    try {
      const { username: usernameRequest } = req.user;
      if (usernameRequest !== username) {
        throw new ForbiddenException(
          'No tienes permisos para realizar esta acción',
        );
      }
      const validatedUser = await this.usersService.validateUser(
        username,
        undefined, // Email no es necesario para validar el usuario en este caso porque se toma al usuario de los parámetros de la url
        password,
      );
      if (!validatedUser) {
        throw new BadRequestException('Usuario o contraseña incorrectos');
      }
      await this.usersService.updatePassword(username, password, newPassword);
      return { message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al actualizar la contraseña',
        error,
      ); // Si ocurre un error al actualizar la contraseña, lanza una excepción InternalServerErrorException.
    }
  }
}
