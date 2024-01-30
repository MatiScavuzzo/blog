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

// Enumeración de roles
enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

// Función para validar si un valor es un entero positivo
function isPositiveInteger(value: string): boolean {
  const regex = /[0-9]/gi;
  return regex.test(value) && parseInt(value, 10) >= 0;
}

// Controlador para la gestión de posts
@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // Método privado para obtener los parámetros de paginación válidos
  private getPaginationParams(paginationQuery: PaginationQuery): {
    limit: number;
    skip: number;
  } {
    // Función interna para validar y obtener un valor numérico válido
    const getValidatedValue = (value: string, defaultValue: number): number => {
      return isPositiveInteger(value) ? parseInt(value, 10) : defaultValue;
    };

    // Obtener valores validados de limit y skip
    const limit = getValidatedValue(paginationQuery.limit, 10);
    const skip = getValidatedValue(paginationQuery.skip, 0);

    return { limit, skip };
  }

  // Método privado para manejar respuestas exitosas
  private successResponse(message: string): { message: string } {
    return { message };
  }

  // Endpoint para obtener todos los posts con paginación
  @Get('posts')
  async findAll(
    @Query() paginationQuery: PaginationQuery,
  ): Promise<Publication[]> {
    try {
      // Obtener parámetros de paginación
      const { limit, skip } = this.getPaginationParams(paginationQuery);

      // Llamar al servicio para obtener todos los posts
      const posts = await this.postsService.findAll(limit, skip);

      // Manejar caso en que no haya posts
      if (!posts || posts.length === 0) {
        throw new NotFoundException('No hay posts para mostrar');
      }

      // Retornar los posts obtenidos
      return posts;
    } catch (error) {
      // Manejar diferentes tipos de excepciones
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Ocurrió un error al intentar mostrar los posts',
      );
    }
  }

  // Endpoint para obtener un post por su id
  @Get('posts/:id')
  async findOne(@Param('id') id: string): Promise<Publication> {
    try {
      // Llamar al servicio para obtener un post por su id
      const post = await this.postsService.findOne(id);

      // Manejar caso en que no se encuentre el post
      if (!post) {
        throw new NotFoundException('Post no encontrado');
      }

      // Retornar el post encontrado
      return post;
    } catch (error) {
      // Manejar diferentes tipos de excepciones
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al buscar el post solicitado',
      );
    }
  }

  // Endpoint para crear un nuevo post
  @UseGuards(JwtAuthGuard)
  @Post('posts/new')
  async newPost(
    @Req() req: LoginRequest,
    @Body() createPostDto: CreatePostDto,
  ): Promise<{ message: string }> {
    try {
      // Obtener el nombre de usuario del request
      const { username } = req.user;

      // Verificar si el usuario está autenticado
      if (!username) {
        throw new UnauthorizedException(
          'Para crear un post debés estar logueado',
        );
      }

      // Llamar al servicio para crear un nuevo post
      const post = await this.postsService.createPost(createPostDto);

      // Manejar caso en que no se pueda crear el post
      if (!post) {
        throw new BadRequestException(
          'Error al crear el post, verifique los datos ingresados',
        );
      }

      // Retornar mensaje de éxito
      return this.successResponse('Post creado correctamente');
    } catch (error) {
      // Manejar diferentes tipos de excepciones
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el post');
    }
  }

  // Endpoint para actualizar un post por su id
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @Put('posts/:id/edit')
  async updatePost(
    @Req() req: LoginRequest,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<{ message: string }> {
    try {
      // Llamar al servicio para obtener un post por su id
      const post = await this.postsService.findOne(id);

      // Obtener información del usuario desde el request
      const { username, role } = req.user;

      // Verificar permisos para editar el post
      if (username !== post.author && role !== Role.ADMIN) {
        throw new ForbiddenException(
          'No tienes permisos para editar este post',
        );
      }

      // Llamar al servicio para actualizar el post
      const updatedPost = await this.postsService.updatePost(id, updatePostDto);

      // Manejar caso en que no se pueda actualizar el post
      if (!updatedPost) {
        throw new BadRequestException(
          'Error al intentar actualizar el post, verifique los datos ingresados',
        );
      }

      // Retornar mensaje de éxito
      return this.successResponse('Post actualizado correctamente');
    } catch (error) {
      // Manejar diferentes tipos de excepciones
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el post');
    }
  }

  // Endpoint para eliminar un post por su id
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @Delete('posts/:id')
  async deletePost(
    @Req() req: LoginRequest,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    try {
      // Llamar al servicio para obtener un post por su id
      const post = await this.postsService.findOne(id);

      // Obtener información del usuario desde el request
      const { username, role } = req.user;

      // Verificar permisos para eliminar el post
      if (username !== post.author && role !== Role.ADMIN) {
        throw new ForbiddenException(
          'No tiene permisos para realizar esta acción',
        );
      }

      // Llamar al servicio para eliminar el post
      const deletedPost = await this.postsService.deletePost(id);

      // Manejar caso en que no se pueda eliminar el post
      if (!deletedPost) {
        throw new BadRequestException('Error al intentar eliminar el post');
      }

      // Retornar mensaje de éxito
      return this.successResponse('Post eliminado correctamente');
    } catch (error) {
      // Manejar diferentes tipos de excepciones
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar el post');
    }
  }

  // Endpoint para obtener posts de un usuario con paginación
  @Get('posts/user/:username')
  async findPostsByUser(
    @Param('username') username: string,
    @Query() paginationQuery: PaginationQuery,
  ): Promise<Publication[]> {
    try {
      // Obtener parámetros de paginación
      const { limit, skip } = this.getPaginationParams(paginationQuery);

      // Llamar al servicio para obtener posts de un usuario
      const posts = await this.postsService.findByAuthor(username, limit, skip);

      // Manejar caso en que no haya posts
      if (!posts) {
        throw new NotFoundException('No hay posts para mostrar');
      }

      // Retornar los posts obtenidos
      return posts;
    } catch (error) {
      // Manejar diferentes tipos de excepciones
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Ocurrió un error al intentar mostrar los posts',
      );
    }
  }

  // Endpoint para buscar posts por título, contenido o ambos con paginación
  @Get('posts/search')
  async searchPosts(
    @Query('title') title: string,
    @Query('content') content: string,
    @Query() paginationQuery: PaginationQuery,
  ): Promise<Publication[]> {
    try {
      // Obtener parámetros de paginación
      const { limit, skip } = this.getPaginationParams(paginationQuery);

      // Verificar si se proporciona título o contenido
      if (!title && !content) {
        // Llamar al servicio para obtener todos los posts
        const posts = await this.postsService.findAll(limit, skip);

        // Manejar caso en que no haya posts
        if (!posts) {
          throw new NotFoundException('No hay posts para mostrar');
        }

        // Retornar los posts obtenidos
        return posts;
      }

      if (title) {
        // Llamar al servicio para buscar posts por título
        const posts = await this.postsService.findByTitle(title, limit, skip);

        // Manejar caso en que no haya posts con el título proporcionado
        if (!posts) {
          throw new NotFoundException(
            'No hay posts para mostrar con los datos solicitados',
          );
        }

        // Retornar los posts obtenidos
        return posts;
      }

      if (content) {
        // Llamar al servicio para buscar posts por contenido
        const posts = await this.postsService.findByContent(
          content,
          limit,
          skip,
        );

        // Manejar caso en que no haya posts con el contenido proporcionado
        if (!posts) {
          throw new NotFoundException(
            'No hay posts para mostrar con los datos solicitados',
          );
        }

        // Retornar los posts obtenidos
        return posts;
      }
    } catch (error) {
      // Manejar diferentes tipos de excepciones
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Ocurrió un error al intentar mostrar los posts',
      );
    }
  }

  // Endpoint para obtener posts por categoría con paginación
  @Get('posts/filter/:category')
  async findPostsByCategory(
    @Param('category') category: string,
    @Query() paginationQuery: PaginationQuery,
  ): Promise<Publication[]> {
    try {
      // Obtener parámetros de paginación
      const { limit, skip } = this.getPaginationParams(paginationQuery);

      // Llamar al servicio para obtener posts por categoría
      const posts = await this.postsService.findByCategory(
        category,
        limit,
        skip,
      );

      // Manejar caso en que no haya posts
      if (!posts) {
        throw new NotFoundException('No hay posts para mostrar');
      }

      // Retornar los posts obtenidos
      return posts;
    } catch (error) {
      // Manejar diferentes tipos de excepciones
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Ocurrió un error al intentar mostrar los posts',
      );
    }
  }
}
