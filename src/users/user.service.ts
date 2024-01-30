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
import { LoggedUser } from 'src/interfaces/loggedTypes';
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
  } // Método privado para manejar respuesta exitosa.

  private handleBadRequest(message: string): void {
    throw new BadRequestException(message);
  } // Método privado para manejar BadRequestException.

  private handleConflict(message: string): void {
    throw new ConflictException(message);
  } // Método privado para manejar ConflictException.

  private handleInternalServer(message: string): void {
    throw new InternalServerErrorException(message);
  } // Método privado para manejar InternalServerErrorException.

  private handleNotFound(message: string): void {
    throw new NotFoundException(message);
  } // Método privado para manejar NotFoundException

  private filterSensitiveFieldsPublic(user: User): PublicUserInfo {
    if (!user) {
      return null;
    }
    const publicUserInfo: PublicUserInfo = {
      username: user.username,
    };
    return publicUserInfo;
  } // Método privado para manejar el tipo de información que recibe un usuario de rol 'user' al acceder al listado de usuarios de la db.

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
  } // Método privado para manejar el tipo de información que recibe un usuario de rol 'admin' al acceder al listado de usuarios de la db.

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
  } // Método privado para manejar la información que se muestra de los usuarios en su perfil.

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
  } // Método para devolver todos los usuarios para los usuarios de rol 'user'

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
  } // Método para devolver todos los usuarios para los usuarios de rol 'admin'

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
        } // Si no se encuentra el usuario, se lanza una excepción NotFoundException.
        return user;
      } else if (email) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
          this.handleNotFound('Usuario no encontrado');
        } // Si no se encuentra el usuario, se lanza una excepción NotFoundException.
        return user;
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.handleInternalServer('Error al buscar el usuario'); // Si ocurre un error al buscar el usuario arroja una excepción InternalServerErrorException.
    }
  } // Método para encontrar al usuario que intenta hacer el login, ya sea mediante 'username' o 'email'

  async findProfile(username: string): Promise<PublicProfile> {
    try {
      if (!username) {
        this.handleNotFound('El usuario no existe');
      } // Si no llega el parámetro username lanza una excepción de tipo NotFoundException.
      const user = await this.userModel.findOne({ username });
      const publicProfile = this.publicProfile(user);
      return publicProfile; // Devuelve el perfil de usuario con datos que pueden ser visibles, a excepción de la contraseña.
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al buscar el perfil'); // Si ocurre un error al intentar encontrar el perfil arroja una excepción InternalServerErrorException.
    }
  } // Método para acceder al perfil de un usuario determinado.

  async createUser({
    password,
    username,
    ...userData
  }: CreateUserDto): Promise<{ message: string }> {
    try {
      const existingUser = await this.findByUsernameOrEmail(username);
      if (existingUser) {
        this.handleConflict('El nombre de usuario ya existe');
      } // Si el usuario ya existe, lanza una excepción ConflictException.
      const hashedPassword = await bcrypt.hash(password, 10);
      const createUserDto = new CreateUserDto();
      createUserDto.password = hashedPassword;
      createUserDto.username = username;
      createUserDto.email = userData.email;
      createUserDto.name = userData.name;
      createUserDto.surname = userData.surname;
      createUserDto.role = userData.role;

      const validationErrors = await validate(createUserDto);
      if (validationErrors.length > 0) {
        this.handleBadRequest('Datos inválidos');
      } // Valida los datos proporcionados en el body de la petición POST, con class-validator de acuerdo al DTO. De resultar un error, lanza una BadRequestException.

      const newUser = new this.userModel(createUserDto);
      const createdUser = await newUser.save(); // Guarda el nuevo usuario en la base de datos y devuelve la instancia del objeto creado.
      if (!createdUser) {
        this.handleConflict('Error al crear el usuario');
      } // Si ocurre un error al guardar el documento en la db, se lanza un error ConflictException
      return this.successResponse('Usuario creado correctamente'); // Devuelve un objeto con un mensaje de éxito.
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.handleInternalServer('Error al crear el usuario'); // Si ocurre un error al crear el usuario, lanza una excepción InternalServerErrorException.
    }
  } // Método para crear un nuevo usuario. El parámetro password es el hash de la contraseña proporcionada por el usuario. El resto de parámetros son los datos del usuario a crear.

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
      } // Valida los datos proporcionados en el body de la petición PUT, con class-validator de acuerdo al DTO. De resultar un error, lanza una BadRequestException.
      const updatedUser = await this.userModel.updateOne(
        {
          username: username,
        },
        updateUserDto,
      ); // Actualiza el usuario con los datos proporcionados en el body de la petición PUT.
      if (updatedUser.modifiedCount === 0) {
        this.handleNotFound('Usuario no encontrado para actualizar');
      } // Si no se encuentran coincidencias con el usuario a actualizar, se lanza una excepción NotFoundException.
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
  } // Método para actualizar un usuario. El parámetro updateUserDto es el objeto con los datos a actualizar. El parámetro username es el nombre de usuario del usuario a actualizar.

  async deleteUser(username: string): Promise<{ message: string }> {
    try {
      const deletedUser = await this.userModel.deleteOne({
        username: username,
      }); // Elimina el usuario con el nombre de usuario proporcionado.
      if (deletedUser.deletedCount === 0) {
        this.handleNotFound('Usuario no encontrado');
      } // Si no se encuentra coincidencia con el usuario a eliminar, se lanza una excepción NotFoundException.
      return this.successResponse('Usuario eliminado correctamente'); // Devuelve un objeto con un mensaje de éxito.
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al eliminar el usuario'); // Si ocurre un error al eliminar el usuario, lanza una excepción InternalServerErrorException.
    }
  } // Método para eliminar un usuario. El parámetro username es el nombre de usuario del usuario a eliminar.

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
      } // Si no se proporciona un nombre de usuario ni un email, lanza una excepción BadRequestException.
      const user = await this.findByUsernameOrEmail(username, email); // Busca al usuario con los datos proporcionados, sea con username o con email
      if (!user) {
        this.handleNotFound('Usuario no encontrado');
      } // Si no se encuentra el usuario, lanza una excepción NotFoundException.
      const passwordMatch = await bcrypt.compare(password, user.password); // Compara la contraseña proporcionada con la contraseña del usuario.
      if (!passwordMatch) {
        this.handleBadRequest('Contraseña incorrecta');
      } // Si la contraseña no coincide, lanza una excepción BadRequestException.
      return { username: user.username, role: user.role }; // Devuelve un objeto con el nombre de usuario y el rol del usuario.
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.handleInternalServer('Error al validar el usuario'); // Si ocurre un error al validar el usuario, lanza una excepción InternalServerErrorException.
    }
  } // Método para validar el usuario que intenta hacer el login. El parámetro password es la contraseña proporcionada por el usuario. El parámetro username o email es el nombre de usuario o email del usuario a validar.

  async updatePassword(
    username: string,
    password: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const user = await this.findByUsernameOrEmail(username, undefined); // Busca al usuario con el nombre de usuario proporcionado. El segundo parámetro, declarado como undefined es el por el campo Email, (continua abajo)
      // porque para cambiar la password tiene que estar logueado en la app previamente el usuario y el parámetro va a llegar desde el controlador como username.
      if (!user) {
        this.handleNotFound('Usuario no encontrado');
      } // Si no se encuentra el usuario, lanza una excepción NotFoundException.

      const passwordMatch = await bcrypt.compare(password, user.password); // Compara la contraseña proporcionada con la contraseña del usuario.
      if (!passwordMatch) {
        this.handleBadRequest('Contraseña incorrecta');
      } // Si la contraseña no coincide, lanza una excepción BadRequestException.

      const hashedPassword = await bcrypt.hash(newPassword, 10); // Si la contraseña coincide, se encripta la nueva contraseña y se actualiza el usuario.
      const updatePasswordDto = new UpdatePasswordDto();
      updatePasswordDto.password = hashedPassword;
      const validationErrors = await validate(updatePasswordDto);
      if (validationErrors.length > 0) {
        this.handleBadRequest('Datos inválidos');
      } // Valida los datos proporcionados en el body de la petición PUT, con class-validator de acuerdo al DTO. De resultar un error, lanza una BadRequestException.
      const updatedPassword = await this.userModel.updateOne(
        {
          username: username,
        },
        updatePasswordDto,
      ); // Actualiza el usuario con los datos proporcionados en el body de la petición PUT.
      if (updatedPassword.modifiedCount === 0) {
        this.handleNotFound('Usuario no encontrado');
      } // Si no se encuentran coincidencias con el usuario a actualizar, se lanza una excepción NotFoundException.
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
  } // Método para actualizar la contraseña de un usuario. El parámetro username es el nombre de usuario del usuario a actualizar. El parámetro password es la contraseña actual del usuario.
  // El parámetro newPassword es la nueva contraseña del usuario.
}
