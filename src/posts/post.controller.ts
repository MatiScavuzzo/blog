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
import { UpdatePostDto } from './dto/update-post.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

function isPositiveInteger(value: string): boolean {
  const regex = /[0-9]/gi;
  return regex.test(value) && parseInt(value, 10) >= 0;
}

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  private getPaginationParams(paginationQuery: PaginationQuery): {
    limit: number;
    skip: number;
  } {
    const getValidatedValue = (value: string, defaultValue: number): number => {
      return isPositiveInteger(value) ? parseInt(value, 10) : defaultValue;
    };

    const limit = getValidatedValue(paginationQuery.limit, 10);
    const skip = getValidatedValue(paginationQuery.skip, 0);

    return { limit, skip };
  }

  private successResponse(message: string): { message: string } {
    return { message };
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
      return this.successResponse('Post creado correctamente');
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @Put(':id/edit')
  async updatePost(
    @Req() req: LoginRequest,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<{ message: string }> {
    try {
      const post = await this.postsService.findOne(id);
      const { username, role } = req.user;
      if (username !== post.author && role !== Role.ADMIN) {
        throw new ForbiddenException(
          'No tienes permisos para editar este post',
        );
      }
      const updatedPost = await this.postsService.updatePost(id, updatePostDto);
      if (!updatedPost) {
        throw new BadRequestException(
          'Error al intentar actualizar el post, verifique los datos ingresados',
        );
      }
      return this.successResponse('Post actualizado correctamente');
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el post');
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @Delete(':id')
  async deletePost(
    @Req() req: LoginRequest,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    try {
      const post = await this.postsService.findOne(id);
      const { username, role } = req.user;
      if (username !== post.author && role !== Role.ADMIN) {
        throw new ForbiddenException(
          'No tiene permisos para realizar esta acción0,',
        );
      }
      const deletedPost = await this.postsService.deletePost(id);
      if (!deletedPost) {
        throw new BadRequestException('Error al intentar eliminar el post');
      }
      return this.successResponse('Post eliminado correctamente');
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar el post');
    }
  }

  @Get('user/:username')
  async findPostsByUser(
    @Param('username') username: string,
    @Query() paginationQuery: PaginationQuery,
  ): Promise<Publication[]> {
    try {
      const { limit, skip } = this.getPaginationParams(paginationQuery);
      const posts = await this.postsService.findByAuthor(username, limit, skip);
      if (!posts) {
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

  @Get('search')
  async searchPosts(
    @Query('title') title: string,
    @Query('content') content: string,
    @Query() paginationQuery: PaginationQuery,
  ): Promise<Publication[]> {
    try {
      const { limit, skip } = this.getPaginationParams(paginationQuery);
      if (!title && !content) {
        const posts = await this.postsService.findAll(limit, skip);
        if (!posts) {
          throw new NotFoundException('No hay posts para mostrar');
        }
        return posts;
      }
      if (title) {
        const posts = await this.postsService.findByTitle(title, limit, skip);
        if (!posts) {
          throw new NotFoundException(
            'No hay posts para mostrar con los datos solicitados',
          );
        }
        return posts;
      }
      if (content) {
        const posts = await this.postsService.findByContent(
          content,
          limit,
          skip,
        );
        if (!posts) {
          throw new NotFoundException(
            'No hay posts para mostrar con los datos solicitados',
          );
        }
        return posts;
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Ocurrió un error al intentar mostrar los posts',
      );
    }
  }

  @Get('filter/:category')
  async findPostsByCategory(
    @Param('category') category: string,
    @Query() paginationQuery: PaginationQuery,
  ): Promise<Publication[]> {
    try {
      const { limit, skip } = this.getPaginationParams(paginationQuery);
      const posts = await this.postsService.findByCategory(
        category,
        limit,
        skip,
      );
      if (!posts) {
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
}
