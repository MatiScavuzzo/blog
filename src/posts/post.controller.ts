import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './post.service';
import { Post as Publication } from './schemas/post.schema';
import { PaginationQuery } from 'src/interfaces/paginationQuery';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { LoginRequest } from 'src/interfaces/loggedTypes';
import { CreatePostDto } from './dto/create-post.dto';

function isPositiveInteger(value: string): boolean {
  const regex = /[0-9]/gi;
  return regex.test(value) && parseInt(value, 10) >= 0;
}

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  private getPaginationParams(paginationQuery: PaginationQuery) {
    const getValidatedValue = (value: string, defaultValue: number): number => {
      return isPositiveInteger(value) ? parseInt(value, 10) : defaultValue;
    };

    const limit = getValidatedValue(paginationQuery.limit, 10);
    const skip = getValidatedValue(paginationQuery.skip, 0);

    return { limit, skip };
  }

  @Get()
  async findAll(
    @Query() paginationQuery: PaginationQuery,
  ): Promise<Publication[]> {
    try {
      const { limit, skip } = this.getPaginationParams(paginationQuery);
      const posts = await this.postsService.findAll(limit, skip);
      if (!posts || posts.length === 0) {
        throw new NotFoundException('No hay posts para mostrar');
      }
      return posts;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Ocurrió un error al intentar mostrar los posts',
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Publication> {
    try {
      const post = await this.postsService.findOne(id);
      if (!post) {
        throw new NotFoundException('Post no encontrado');
      }
      return post;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al buscar el post solicitado',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('new')
  async newPost(
    @Req() req: LoginRequest,
    @Body() createPostDto: CreatePostDto,
  ): Promise<{ message: string }> {
    try {
      const { username } = req.user;
      if (!username) {
        throw new UnauthorizedException(
          'Para crear un post debés estar logueado',
        );
      }
      const post = await this.postsService.createPost(createPostDto);
      if (!post) {
        throw new BadRequestException(
          'Error al crear el post, verifique los datos ingresados',
        );
      }
      return { message: 'Post creado correctamente' };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el post');
    }
  }
}
