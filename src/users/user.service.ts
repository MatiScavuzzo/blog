import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoggedUser } from './interfaces/loggedUser';
import {
  PublicProfile,
  PublicUserInfo,
  PublicUserInfoAdmin,
} from './interfaces/publicUserInfo';

// Recordatorio: 15/01/2024 Modificar updateUser agregando las validaciones del DTO y la modificación de la respuesta

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  private successResponse(message: string): { message: string } {
    return { message };
  }

  async findAll(): Promise<PublicUserInfo[]> {
    try {
      const users = await this.userModel.find().lean();
      if (!users) {
        throw new BadRequestException('No hay usuarios para mostrar');
      }
      const publicUser = users.map((user) =>
        this.filterSensitiveFieldsPublic(user),
      );
      return publicUser;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al mostrar los usuarios');
    }
  }
  async findAllAdmin(): Promise<PublicUserInfoAdmin[]> {
    try {
      const users = await this.userModel.find().lean();
      if (!users) {
        throw new BadRequestException('No hay usuarios para mostrar');
      }
      const publicUserAdmin = users.map((user) =>
        this.filterSensitiveFieldsAdmin(user),
      );
      return publicUserAdmin;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al mostrar los usuarios');
    }
  }

  async findByUsernameOrEmail(
    username?: string | undefined,
    email?: string | undefined,
  ): Promise<User> {
    try {
      if (!username && !email) {
        throw new BadRequestException(
          'Debe proporcionar un nombre de usuario o un email',
        );
      }

      if (username) {
        const user = await this.userModel.findOne({ username });
        if (!user) {
          throw new BadRequestException('Usuario no encontrado');
        }
        return user;
      } else if (email) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
          throw new BadRequestException('Usuario no encontrado');
        }
        return user;
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al buscar el usuario');
    }
  }

  async findProfile(username: string): Promise<PublicProfile> {
    try {
      if (!username) {
        throw new NotFoundException('El usuario no existe');
      }
      const user = await this.userModel.findOne({ username });
      const publicProfile = this.publicProfile(user);
      return publicProfile;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al buscar el perfil');
    }
  }

  async createUser({
    password,
    username,
    ...userData
  }: CreateUserDto): Promise<{ message: string }> {
    try {
      const existingUser = await this.findByUsernameOrEmail(username);
      if (existingUser) {
        throw new ConflictException('El nombre de usuario ya existe');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const createUserDto = new CreateUserDto();
      createUserDto.password = hashedPassword;
      createUserDto.username = username;
      createUserDto.email = userData.email;
      createUserDto.name = userData.name;
      createUserDto.surname = userData.surname;
      createUserDto.role = userData.role;

      const newUser = new this.userModel(createUserDto);
      const createdUser = newUser.save(); // Guarda el nuevo usuario en la base de datos y devuelve la instancia del objeto creado.
      if (!createdUser) {
        throw new ConflictException('Error al crear el usuario');
      }
      createdUser;
      return this.successResponse('Usuario creado correctamente'); // Devuelve un objeto con un mensaje de éxito.
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Error al crear el usuario'); // Si ocurre un error al crear el usuario, lanza una excepción ConflictException.// Si ocurre un error al crear el usuario, devuelve undefined. Esto permite que el controlador maneje la excepción adecuadamente.
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

  async validateUser(
    username: string | undefined,
    email: string | undefined,
    password: string,
  ): Promise<LoggedUser> {
    try {
      if (!username && !email) {
        throw new BadRequestException(
          'Debe proporcionar un nombre de usuario o un email',
        );
      }
      const user = await this.findByUsernameOrEmail(username, email);
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
      const user = await this.findByUsernameOrEmail(username, undefined);
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

  private filterSensitiveFieldsPublic(user: User): PublicUserInfo {
    if (!user) {
      return null;
    }
    const publicUserInfo: PublicUserInfo = {
      username: user.username,
    };
    return publicUserInfo;
  }

  private filterSensitiveFieldsAdmin(user: User): PublicUserInfoAdmin {
    if (!user) {
      return null;
    }
    const publicUserInfoAdmin: PublicUserInfoAdmin = {
      name: user.name,
      surname: user.surname,
      email: user.email,
      username: user.username,
      role: user.role,
    };
    return publicUserInfoAdmin;
  }

  private publicProfile(user: User): PublicProfile {
    if (!user) {
      return null;
    }
    const publicProfile: PublicProfile = {
      name: user.name,
      surname: user.surname,
      username: user.username,
      email: user.email,
    };
    return publicProfile;
  }
}
