import * as bcrypt from 'bcrypt';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoggedUser } from './interfaces/loggedUser';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().lean();
  }

  async findOne(username?: string, email?: string): Promise<User> {
    return this.userModel.findOne({ username, email }).lean();
  }

  async createUser({ password, ...userData }: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = new this.userModel({
      password: hashedPassword,
      ...userData,
    });
    return createdUser.save();
  }

  async updateUser(
    username: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userModel
      .updateOne({ username: username }, updateUserDto)
      .lean();
  }

  async deleteUser(username: string): Promise<User> {
    return this.userModel.deleteOne({ username: username }).lean();
  }

  async validateUser(username: string, password: string): Promise<LoggedUser> {
    const user = await this.findOne(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      return {
        username: user.username,
        role: user.role,
      };
    }
  }

  async updatePassword(
    username: string,
    password: string,
    newPassword: string,
  ): Promise<User> {
    try {
      const user = await this.findOne(username);
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        throw new BadRequestException('Contraseña incorrecta');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      return this.updateUser(user.username, {
        password: hashedPassword,
      } as UpdateUserDto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar la contraseña');
    }
  }
}
