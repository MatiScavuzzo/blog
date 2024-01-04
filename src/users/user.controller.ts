import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { ShowedUser } from './interfaces/showedUser';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<ShowedUser[] | { message: string }> {
    try {
      const users = await this.usersService.findAll();
      if (!users) {
        return { message: 'No hay usuarios para mostrar' };
      }
      return users;
    } catch (error) {
      throw new BadRequestException('Error al mostrar usuarios'); // Si ocurre un error al mostrar los usuarios, lanza una excepción BadRequestException.
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

  @Post(':username/change-pass')
  async updatePassword(
    @Param('username') username: string,
    @Body() { password, newPassword },
  ): Promise<{ message: string }> {
    try {
      const validatedUser = await this.usersService.validateUser(
        password,
        username,
        undefined, // Email no es necesario para validar el usuario en este caso porque se toma al usuario de la queryParam.
      );
      if (!validatedUser) {
        throw new BadRequestException('Usuario o contraseña incorrectos');
      }
      await this.usersService.updatePassword(username, password, newPassword);
      return { message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al actualizar la contraseña',
        error,
      ); // Si ocurre un error al actualizar la contraseña, lanza una excepción InternalServerErrorException.
    }
  }
}
