import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post } from './schemas/post.schema';
import { Model } from 'mongoose';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { validate } from 'class-validator';

// 23/01/2024 queda: Creación de método de filtrado por categoría, autor, etc. con parámetros de paginación.

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<Post>) {}

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

  async findAll(limit?: number, skip?: number): Promise<Post[]> {
    try {
      if (!limit) {
        limit = 10;
      }
      if (!skip) {
        skip = 0;
      }
      const posts = await this.postModel.find().limit(limit).skip(skip).lean();
      if (!posts) {
        this.handleNotFound('No hay posts para mostrar');
      }
      return posts;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al mostrar los posts');
    }
  }

  async findOne(id: string): Promise<Post> {
    try {
      const post = await this.postModel.findOne({ _id: id }).lean();
      if (!post) {
        this.handleNotFound('Post no encontrado');
      }
      return post;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al mostrar el post');
    }
  }

  async findByAuthor(
    author: string,
    limit?: number,
    skip?: number,
  ): Promise<Post[]> {
    try {
      if (!limit) {
        limit = 10;
      }
      if (!skip) {
        skip = 0;
      }
      const posts = await this.postModel
        .find({ author: author })
        .limit(limit)
        .skip(skip)
        .lean();
      if (!posts) {
        this.handleNotFound('No hay posts para mostrar');
      }
      return posts;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al mostrar los posts');
    }
  }

  async findByTitle(
    title: string,
    limit?: number,
    skip?: number,
  ): Promise<Post[]> {
    try {
      if (!limit) {
        limit = 10;
      }
      if (!skip) {
        skip = 0;
      }
      const posts = await this.postModel
        .find({ $text: { $search: title } }, { score: { $meta: 'textScore' } })
        .limit(limit)
        .skip(skip)
        .lean();
      if (!posts) {
        this.handleNotFound('No hay posts para mostrar');
      }
      return posts;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al mostrar los posts');
    }
  }

  async findByContent(
    content: string,
    limit?: number,
    skip?: number,
  ): Promise<Post[]> {
    try {
      if (!limit) {
        limit = 10;
      }
      if (!skip) {
        skip = 0;
      }
      const posts = await this.postModel
        .find({ body: { $regex: content, $options: 'i' } })
        .limit(limit)
        .skip(skip)
        .lean();
      if (!posts) {
        this.handleNotFound('No hay posts para mostrar');
      }
      return posts;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al mostrar los posts');
    }
  }

  async findByCategory(
    category: string,
    limit?: number,
    skip?: number,
  ): Promise<Post[]> {
    try {
      if (!limit) {
        limit = 10;
      }
      if (!skip) {
        skip = 0;
      }
      const posts = await this.postModel
        .find({ categories: category })
        .limit(limit)
        .skip(skip)
        .lean();
      if (!posts) {
        this.handleNotFound('No hay posts para mostrar');
      }
      return posts;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al mostrar los posts');
    }
  }

  async createPost(createPostDto: CreatePostDto): Promise<{ message: string }> {
    try {
      const errors = await validate(createPostDto);
      if (errors.length > 0) {
        this.handleBadRequest('Datos de entrada inválidos');
      }
      const createdPost = new this.postModel(createPostDto);
      if (!createdPost) {
        this.handleBadRequest('Error al crear el post');
      }
      await createdPost.save();
      return this.successResponse('Post creado correctamente');
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.handleInternalServer('Error al crear el post'); // Si ocurre un error desconocido, lanza una excepción de tipo InternalServerErrorException.
    }
  }

  async updatePost(
    id: string,
    updatePostDto: UpdatePostDto,
  ): Promise<{ message: string }> {
    try {
      const post = await this.findOne(id);
      if (!post) {
        this.handleNotFound('No se encuentra el post solicitado');
      }
      const updatePost = new UpdatePostDto();
      Object.assign(updatePost, updatePostDto);
      const errors = await validate(updatePost);
      if (errors.length > 0) {
        this.handleBadRequest('Datos de entrada inválidos');
      }
      const updatedPost = await this.postModel.updateOne(
        {
          _id: id,
        },
        updatePostDto,
      );
      if (!updatedPost || updatedPost.modifiedCount === 0) {
        this.handleBadRequest('Error al intentar acualizar el post');
      }
      return this.successResponse('Post actualizado correctamente');
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.handleInternalServer('Error al actualizar el post');
    }
  }

  async deletePost(id: string): Promise<{ message: string }> {
    try {
      const post = await this.findOne(id);
      if (!post) {
        this.handleNotFound('No se encuentra el post solicitado');
      }
      const deletedPost = await this.postModel.deleteOne({ _id: id });
      if (!deletedPost) {
        this.handleBadRequest('Error al intentar eliminar el post');
      }
      return this.successResponse('Post eliminado correctamente');
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.handleInternalServer('Error al eliminar el post'); // Si ocurre un error desconocido, lanza una excepción de tipo InternalServerErrorException.
    }
  }
}
