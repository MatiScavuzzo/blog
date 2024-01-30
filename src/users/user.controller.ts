import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  NotFoundException,
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
import { LoginRequest } from 'src/interfaces/loggedTypes';
import {
  PublicProfile,
  PublicUserInfo,
  PublicUserInfoAdmin,
} from './interfaces/publicUserInfo';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

// Enumeración de roles
enum Role {
  ADMIN = 'admin',
  USER = 'user',
}

// Controlador para la gestión de usuarios
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Endpoint para obtener todos los usuarios (solo para administradores)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/users')
  async findAll(
    @Request() req: LoginRequest,
  ): Promise<PublicUserInfoAdmin[] | PublicUserInfo[] | { message: string }> {
    try {
      // Obtener el rol del usuario desde el request
      const { role } = req.user;

      // Verificar si el usuario es administrador
      if (role === Role.ADMIN) {
        // Llamar al servicio para obtener todos los usuarios
        const users = await this.usersService.findAllAdmin();

        // Manejar caso en que no haya usuarios
        if (!users) {
          return { message: 'No hay usuarios para mostrar' };
        }

        // Retornar todos los usuarios
        return users;
      }
    } catch (error) {
      // Manejar excepción BadRequestException
      throw new BadRequestException('Error al mostrar usuarios');
    }
  }

  // Endpoint para obtener todos los usuarios públicos
  @Get('users')
  async findAllPublic(): Promise<PublicUserInfo[] | { message: string }> {
    try {
      // Llamar al servicio para obtener todos los usuarios
      const users = await this.usersService.findAll();

      // Manejar caso en que no haya usuarios
      if (!users) {
        throw new NotFoundException('No hay usuarios para mostrar');
      }

      // Retornar todos los usuarios públicos
      return users;
    } catch (error) {
      // Manejar diferentes tipos de excepciones
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al intentar encontrar los usuarios',
      );
    }
  }

  // Endpoint para obtener el perfil de un usuario por su nombre de usuario
  @Get('users/:username')
  async findOne(@Param('username') username: string): Promise<PublicProfile> {
    try {
      // Llamar al servicio para obtener el perfil de un usuario
      const user = await this.usersService.findProfile(username);

      // Manejar caso en que no se encuentre el usuario
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      // Retornar el perfil del usuario
      return user;
    } catch (error) {
      // Manejar diferentes tipos de excepciones
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al buscar el perfil');
    }
  }

  // Endpoint para actualizar el perfil de un usuario por su nombre de usuario
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @Put('users/:username')
  async updateProfile(
    @Req() req: LoginRequest,
    @Param('username') username: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<{ message: string }> {
    try {
      // Obtener información del usuario desde el request
      const { username: usernameRequest, role } = req.user;

      // Verificar permisos para actualizar el perfil
      if (usernameRequest !== username && role !== Role.ADMIN) {
        throw new ForbiddenException(
          'No tienes permisos para realizar esta acción',
        );
      }

      // Llamar al servicio para actualizar el perfil del usuario
      await this.usersService.updateUser(username, updateUserDto);

      // Retornar mensaje de éxito
      return { message: 'Perfil actualizado correctamente' };
    } catch (error) {
      // Manejar diferentes tipos de excepciones
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al actualizar el perfil, contacte con el administrador',
      );
    }
  }

  // Endpoint para eliminar el perfil de un usuario por su nombre de usuario
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @Delete('users/:username')
  async deleteProfile(
    @Req() req: LoginRequest,
    @Param('username') username: string,
  ): Promise<{ message: string }> {
    try {
      // Obtener información del usuario desde el request
      const { username: usernameRequest, role } = req.user;

      // Verificar permisos para eliminar el perfil
      if (usernameRequest !== username && role !== Role.ADMIN) {
        throw new ForbiddenException(
          'No tienes permisos para realizar esta acción',
        );
      }

      // Llamar al servicio para eliminar el perfil del usuario
      await this.usersService.deleteUser(username);

      // Retornar mensaje de éxito
      return { message: 'Perfil eliminado correctamente' };
    } catch (error) {
      // Manejar diferentes tipos de excepciones
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'No se pudo eliminar el post, contacte con el administrador',
      );
    }
  }

  // Endpoint para crear un nuevo usuario
  @Post('users/new')
  async newUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ message: string }> {
    try {
      // Llamar al servicio para crear un nuevo usuario
      const newUser = await this.usersService.createUser(createUserDto);

      // Manejar caso en que no se pueda crear el usuario
      if (!newUser) {
        throw new BadRequestException('Error al crear el usuario');
      }

      // Retornar mensaje de éxito
      return { message: 'Usuario creado correctamente' };
    } catch (error) {
      // Manejar diferentes tipos de excepciones
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Ocurrió un error al crear el usuario',
        error,
      );
    }
  }

  // Endpoint para actualizar la contraseña de un usuario por su nombre de usuario
  @UseGuards(JwtAuthGuard)
  @Put('users/:username/change-pass')
  async updatePassword(
    @Request() req: LoginRequest,
    @Param('username') username: string,
    @Body() { password, newPassword },
  ): Promise<{ message: string }> {
    try {
      // Obtener información del usuario desde el request
      const { username: usernameRequest } = req.user;

      // Verificar permisos para actualizar la contraseña
      if (usernameRequest !== username) {
        throw new ForbiddenException(
          'No tienes permisos para realizar esta acción',
        );
      }

      // Llamar al servicio para validar el usuario antes de actualizar la contraseña
      const validatedUser = await this.usersService.validateUser(
        username,
        undefined, // Email no es necesario para validar el usuario en este caso porque se toma al usuario de los parámetros de la URL
        password,
      );

      // Manejar caso en que el usuario no sea válido
      if (!validatedUser) {
        throw new BadRequestException('Usuario o contraseña incorrectos');
      }

      // Llamar al servicio para actualizar la contraseña del usuario
      await this.usersService.updatePassword(username, password, newPassword);

      // Retornar mensaje de éxito
      return { message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      // Manejar diferentes tipos de excepciones
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al actualizar la contraseña',
        error,
      );
    }
  }
}
