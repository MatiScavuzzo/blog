import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoggedUser } from './interfaces/loggedUser';
import { PublicUserInfo } from './interfaces/publicUserInfo';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findAll(): Promise<PublicUserInfo[]> {
    try {
      const users = await this.userModel.find().lean();
      if (!users) {
        throw new BadRequestException('No hay usuarios para mostrar');
      }
      const publicUser = users.map((user) => this.filterSensitiveFields(user));
      return publicUser;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al mostrar los usuarios');
    }
  }

  async findByUsernameOrEmail(username?: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({
        username: username,
      }); // Acá está el error al buscar por nombre de usuario o email --RESOLVER--
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }
      return user;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al buscar el usuario');
    }
  }

  async createUser({ password, ...userData }: CreateUserDto): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new this.userModel({
        password: hashedPassword,
        ...userData,
      });
      return newUser.save(); // Guarda el nuevo usuario en la base de datos y devuelve la instancia del objeto creado.
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Error al crear el usuario'); // Si ocurre un error al crear el usuario, lanza una excepción ConflictException.
      return; // Si ocurre un error al crear el usuario, devuelve undefined. Esto permite que el controlador maneje la excepción adecuadamente.
    }
  }

  async updateUser(
    username: string,
    updateUserDto: UpdateUserDto,
  ): Promise<{ message: string }> {
    try {
      const updatedUser = await this.userModel.updateOne(
        {
          username: username,
        },
        updateUserDto,
      );
      if (updatedUser.modifiedCount === 0) {
        throw new BadRequestException('Usuario no encontrado');
      }
      return { message: 'Usuario actualizado correctamente' }; // Devuelve un objeto con un mensaje de éxito.
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar el usuario'); // Si ocurre un error al actualizar el usuario, lanza una excepción BadRequestException.
      return; // Si ocurre un error al actualizar el usuario, devuelve undefined. Esto permite que el controlador maneje la excepción adecuadamente.
    }
  }

  async deleteUser(username: string): Promise<{ message: string }> {
    try {
      const deletedUser = await this.userModel.deleteOne({
        username: username,
      });
      if (deletedUser.deletedCount === 0) {
        throw new NotFoundException('Usuario no encontrado');
      }
      return { message: 'Usuario eliminado correctamente' }; // Devuelve un objeto con un mensaje de éxito.
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException('Error al eliminar el usuario'); // Si ocurre un error al eliminar el usuario, lanza una excepción ConflictException.
    }
  }

  async validateUser(password: string, username?: string): Promise<LoggedUser> {
    try {
      const user = await this.findByUsernameOrEmail(username); // Resolver búsqueda por Email
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        throw new BadRequestException('Contraseña incorrecta');
      }
      return { username: user.username, role: user.role }; // Devuelve un objeto con el nombre de usuario y el rol del usuario.
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al validar el usuario'); // Si ocurre un error al validar el usuario, lanza una excepción BadRequestException.
    }
  }

  async updatePassword(
    username: string,
    password: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const user = await this.findByUsernameOrEmail(username); // Resolver búsqueda por Email
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        throw new UnauthorizedException('Contraseña incorrecta');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.updateUser(user.username, {
        password: hashedPassword,
      } as UpdateUserDto);

      return { message: 'Contraseña actualizada correctamente' }; // Devuelve un objeto con un mensaje de éxito.
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar la contraseña'); // Si ocurre un error al actualizar la contraseña, lanza una excepción BadRequestException.
    }
  }

  private filterSensitiveFields(user: User): PublicUserInfo {
    if (!user) {
      return null;
    }
    const publicUserInfo: PublicUserInfo = {
      name: user.name,
      surname: user.surname,
      email: user.email,
      username: user.username,
      role: user.role,
    };
    return publicUserInfo;
  }
}
