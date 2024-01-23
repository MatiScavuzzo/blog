import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
import { UpdatePasswordDto } from './dto/update-password.dto';
import { validate } from 'class-validator';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  private successResponse(message: string): { message: string } {
    return { message };
  }

  private handleBadRequest(message: string): void {
    throw new BadRequestException(message);
  }

  private handleConflict(message: string): void {
    throw new ConflictException(message);
  }

  private handleInternalServer(message: string): void {
    throw new InternalServerErrorException(message);
  }

  private handleNotFound(message: string): void {
    throw new NotFoundException(message);
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
  async findAll(): Promise<PublicUserInfo[]> {
    try {
      const users = await this.userModel.find().lean();
      if (!users) {
        this.handleBadRequest('No hay usuarios para mostrar');
      }
      const publicUser = users.map((user) =>
        this.filterSensitiveFieldsPublic(user),
      );
      return publicUser;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.handleInternalServer('Error al mostrar los usuarios');
    }
  }
  async findAllAdmin(): Promise<PublicUserInfoAdmin[]> {
    try {
      const users = await this.userModel.find().lean();
      if (!users) {
        this.handleBadRequest('No hay usuarios para mostrar');
      }
      const publicUserAdmin = users.map((user) =>
        this.filterSensitiveFieldsAdmin(user),
      );
      return publicUserAdmin;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.handleInternalServer('Error al mostrar los usuarios');
    }
  }

  async findByUsernameOrEmail(
    username?: string | undefined,
    email?: string | undefined,
  ): Promise<User> {
    try {
      if (!username && !email) {
        this.handleBadRequest(
          'Debe proporcionar un nombre de usuario o un email',
        );
      }

      if (username) {
        const user = await this.userModel.findOne({ username });
        if (!user) {
          this.handleNotFound('Usuario no encontrado');
        }
        return user;
      } else if (email) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
          this.handleNotFound('Usuario no encontrado');
        }
        return user;
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.handleInternalServer('Error al buscar el usuario');
    }
  }

  async findProfile(username: string): Promise<PublicProfile> {
    try {
      if (!username) {
        this.handleNotFound('El usuario no existe');
      }
      const user = await this.userModel.findOne({ username });
      const publicProfile = this.publicProfile(user);
      return publicProfile;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al buscar el perfil');
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
        this.handleConflict('El nombre de usuario ya existe');
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
      const createdUser = await newUser.save(); // Guarda el nuevo usuario en la base de datos y devuelve la instancia del objeto creado.
      if (!createdUser) {
        this.handleConflict('Error al crear el usuario');
      }
      return this.successResponse('Usuario creado correctamente'); // Devuelve un objeto con un mensaje de éxito.
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.handleInternalServer('Error al crear el usuario'); // Si ocurre un error al crear el usuario, lanza una excepción InternalServerErrorException.
    }
  }

  async updateUser(
    username: string,
    updateUserDto: UpdateUserDto,
  ): Promise<{ message: string }> {
    try {
      const updateDto = new UpdateUserDto();
      Object.assign(updateDto, updateUserDto);
      const validationErrors = await validate(updateDto);
      if (validationErrors.length > 0) {
        this.handleBadRequest('Datos inválidos');
      }
      const updatedUser = await this.userModel.updateOne(
        {
          username: username,
        },
        updateUserDto,
      );
      if (updatedUser.modifiedCount === 0) {
        this.handleNotFound('Usuario no encontrado para actualizar');
      }
      return this.successResponse('Usuario actualizado correctamente'); // Devuelve un objeto con un mensaje de éxito.
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.handleInternalServer('Error al actualizar el usuario'); // Si ocurre un error al actualizar el usuario, lanza una excepción InternalServerErrorException.
    }
  }

  async deleteUser(username: string): Promise<{ message: string }> {
    try {
      const deletedUser = await this.userModel.deleteOne({
        username: username,
      });
      if (deletedUser.deletedCount === 0) {
        this.handleNotFound('Usuario no encontrado');
      }
      return this.successResponse('Usuario eliminado correctamente'); // Devuelve un objeto con un mensaje de éxito.
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al eliminar el usuario'); // Si ocurre un error al eliminar el usuario, lanza una excepción InternalServerErrorException.
    }
  }

  async validateUser(
    username: string | undefined,
    email: string | undefined,
    password: string,
  ): Promise<LoggedUser> {
    try {
      if (!username && !email) {
        this.handleBadRequest(
          'Debe proporcionar un nombre de usuario o un email',
        );
      }
      const user = await this.findByUsernameOrEmail(username, email);
      if (!user) {
        this.handleBadRequest('Usuario no encontrado');
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        this.handleBadRequest('Contraseña incorrecta');
      }
      return { username: user.username, role: user.role }; // Devuelve un objeto con el nombre de usuario y el rol del usuario.
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.handleInternalServer('Error al validar el usuario'); // Si ocurre un error al validar el usuario, lanza una excepción InternalServerErrorException.
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
        this.handleNotFound('Usuario no encontrado');
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        this.handleBadRequest('Contraseña incorrecta');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordDto = new UpdatePasswordDto();
      updatePasswordDto.password = hashedPassword;
      const validationErrors = await validate(updatePasswordDto);
      if (validationErrors.length > 0) {
        this.handleBadRequest('Datos inválidos');
      }
      const updatedPassword = await this.userModel.updateOne(
        {
          username: username,
        },
        updatePasswordDto,
      );
      if (updatedPassword.modifiedCount === 0) {
        this.handleNotFound('Usuario no encontrado');
      }
      return this.successResponse('Contraseña actualizada correctamente'); // Devuelve un objeto con un mensaje de éxito.
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.handleInternalServer('Error al actualizar la contraseña'); // Si ocurre un error al actualizar la contraseña, lanza una excepción InternalServerErrorException.
    }
  }
}
