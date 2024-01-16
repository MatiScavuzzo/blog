import {
  BadRequestException,
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

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<Post>) {}

  private successResponse(message: string): { message: string } {
    return { message };
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
        throw new NotFoundException('No hay posts para mostrar');
      }
      return posts;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al mostrar los posts');
    }
  }

  async findOne(id: string): Promise<Post> {
    try {
      const post = await this.postModel.findOne({ _id: id }).lean();
      if (!post) {
        throw new NotFoundException('Post no encontrado');
      }
      return post;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al mostrar el post');
    }
  }

  async createPost(createPostDto: CreatePostDto): Promise<{ message: string }> {
    try {
      const errors = await validate(createPostDto);
      if (errors.length > 0) {
        throw new BadRequestException('Datos de entrada inválidos');
      }
      const createdPost = new this.postModel(createPostDto);
      if (!createdPost) {
        throw new BadRequestException('Error al crear el post');
      }
      await createdPost.save();
      return this.successResponse('Post creado correctamente');
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el post'); // Si ocurre un error desconocido, lanza una excepción de tipo InternalServerErrorException.
    }
  }

  async updatePost(
    id: string,
    updatePostDto: UpdatePostDto,
  ): Promise<{ message: string }> {
    try {
      const post = await this.findOne(id);
      if (!post) {
        throw new NotFoundException('No se encuentra el post solicitado');
      }
      const errors = await validate(updatePostDto);
      if (errors.length > 0) {
        throw new BadRequestException('Datos de entrada inválidos');
      }
      const createdPost = await this.postModel.updateOne({
        _id: id,
        updatePostDto,
      });
      if (!createdPost) {
        throw new BadRequestException('Error al intentar acualizar el post');
      }
      createdPost;
      return this.successResponse('Post actualizado correctamente');
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el post');
    }
  }
}
