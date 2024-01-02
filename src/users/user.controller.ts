import { BadRequestException, Controller, Get } from '@nestjs/common';
import { UsersService } from './user.service';
import { ShowedUser } from './interfaces/showedUser';

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
}
