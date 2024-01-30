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

// 23/01/2024 queda: Creación de método de filtrado por categoría, autor, etc. con parámetros de paginación.

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<Post>) {}

  private applyDefaultPagination(
    limit?: number,
    skip?: number,
  ): { limit: number; skip: number } {
    const defaultLimit = 10;
    const defaultSkip = 0;

    return {
      limit: limit || defaultLimit,
      skip: skip || defaultSkip,
    };
  } // Método privado para establecer valores por defecto de paginación si no son establecidos.

  private successResponse(message: string): { message: string } {
    return { message };
  } // Método privado para manejar respuesta exitosa.

  private handleBadRequest(message: string): void {
    throw new BadRequestException(message);
  } // Método privado para manejar BadRequestException.

  private handleInternalServer(message: string): void {
    throw new InternalServerErrorException(message);
  } // Método privado para manejar InternalServerErrorException.

  private handleNotFound(message: string): void {
    throw new NotFoundException(message);
  } // Método privado para manejar NotFoundException

  async findAll(limit?: number, skip?: number): Promise<Post[]> {
    try {
      const { limit: adjustedLimit, skip: adjustedSkip } =
        this.applyDefaultPagination(limit, skip); // Aplica el método de comprobación de parámetros de paginación.
      const posts = await this.postModel
        .find()
        .limit(adjustedLimit)
        .skip(adjustedSkip)
        .lean(); // Busca todos los posts en la base de datos y los retorna. Con las condiciones de paginación, por defecto 10 posts por página
      if (!posts) {
        this.handleNotFound('No hay posts para mostrar');
      } // Si no hay posts, lanza un error de tipo NotFoundException.
      return posts; // Retorna los posts encontrados.
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al mostrar los posts'); // Si ocurre un error, lanza un error de tipo InternalServerErrorException.
    }
  } // Método para mostrar todos los posts con parámetros de paginación.

  async findOne(id: string): Promise<Post> {
    try {
      const post = await this.postModel.findOne({ _id: id }).lean(); // Busca el post con el id especificado en la base de datos.
      if (!post) {
        this.handleNotFound('Post no encontrado');
      } // Si no se encuentra el post, lanza un error de tipo NotFoundException.
      return post; // Retorna el post encontrado.
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al mostrar el post'); // Si ocurre un error, lanza un error de tipo InternalServerErrorException.
    }
  } // Método para mostrar un post por su id.

  async findByAuthor(
    author: string,
    limit?: number,
    skip?: number,
  ): Promise<Post[]> {
    try {
      const { limit: adjustedLimit, skip: adjustedSkip } =
        this.applyDefaultPagination(limit, skip); // Aplica el método de comprobación de parámetros de paginación.
      const posts = await this.postModel
        .find({ author: author })
        .limit(adjustedLimit)
        .skip(adjustedSkip)
        .lean(); // Busca los post por los parámetros dados.
      if (!posts) {
        this.handleNotFound('No hay posts para mostrar');
      } // Si no encuentra posts, devuelve un error NotFoundException.
      return posts; // Devuelve los posts buscados.
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al mostrar los posts'); // Si ocurre un error, lanza un InternalServerErrorException.
    }
  } // Método para buscar posts por autor.

  async findByTitle(
    title: string,
    limit?: number,
    skip?: number,
  ): Promise<Post[]> {
    try {
      const { limit: adjustedLimit, skip: adjustedSkip } =
        this.applyDefaultPagination(limit, skip); // Aplica el método de comprobación de parámetros de paginación.
      const posts = await this.postModel
        .find({ $text: { $search: title } }, { score: { $meta: 'textScore' } })
        .limit(adjustedLimit)
        .skip(adjustedSkip)
        .lean(); // Busca posts por los parámetros otorgados.
      if (!posts) {
        this.handleNotFound('No hay posts para mostrar');
      } // Si no encuentra posts, devuelve un error NotFoundException.
      return posts; // Devuelve los posts encontrados.
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al mostrar los posts'); // Si ocurre un error, lanza un InternalServerErrorException.
    }
  } // Método para buscar posts por título.

  async findByContent(
    content: string,
    limit?: number,
    skip?: number,
  ): Promise<Post[]> {
    try {
      const { limit: adjustedLimit, skip: adjustedSkip } =
        this.applyDefaultPagination(limit, skip); // Aplica el método de comprobación de parámetros de paginación.
      const posts = await this.postModel
        .find({ body: { $regex: content, $options: 'i' } })
        .limit(adjustedLimit)
        .skip(adjustedSkip)
        .lean(); // Busca posts por los parámetros otorgados.
      if (!posts) {
        this.handleNotFound('No hay posts para mostrar');
      } // Si no encuentra posts, devuelve un error NotFoundException.
      return posts; // Devuelve los posts encontrados.
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al mostrar los posts'); // Si ocurre un error, lanza un InternalServerErrorException
    }
  } // Método para buscar posts por contenido del mismo.

  async findByCategory(
    category: string,
    limit?: number,
    skip?: number,
  ): Promise<Post[]> {
    try {
      const { limit: adjustedLimit, skip: adjustedSkip } =
        this.applyDefaultPagination(limit, skip); // Aplica el método de comprobación de parámetros de paginación.
      const posts = await this.postModel
        .find({ categories: category })
        .limit(adjustedLimit)
        .skip(adjustedSkip)
        .lean(); // Busca posts por los parámetros otorgados.
      if (!posts) {
        this.handleNotFound('No hay posts para mostrar');
      } // Si no encuentra posts, devuelve un error NotFoundException.
      return posts; // Devuelve los posts encontrados.
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleInternalServer('Error al mostrar los posts'); // Si ocurre un error, lanza un InternalServerErrorException.
    }
  } // Método para buscar posts por categoría.

  async createPost(createPostDto: CreatePostDto): Promise<{ message: string }> {
    try {
      const errors = await validate(createPostDto); // Valida los datos de entrada del post.
      if (errors.length > 0) {
        this.handleBadRequest('Datos de entrada inválidos');
      } // Si los datos de entrada no son válidos, lanza un error de tipo BadRequestException.
      const createdPost = new this.postModel(createPostDto); // Crea un nuevo post con los datos de entrada.
      if (!createdPost) {
        this.handleBadRequest('Error al crear el post');
      } // Si no se crea el post, lanza un error de tipo BadRequestException.
      await createdPost.save(); // Guarda el post en la base de datos.
      return this.successResponse('Post creado correctamente'); // Retorna un mensaje de éxito.
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.handleInternalServer('Error al crear el post'); // Si ocurre un error desconocido, lanza una excepción de tipo InternalServerErrorException.
    }
  } // Método para crear un nuevo post. El método recibe un objeto CreatePostDto que contiene los datos del nuevo post. El método valida los datos de entrada del post antes de crearlo y guardarlo en la db.

  async updatePost(
    id: string,
    updatePostDto: UpdatePostDto,
  ): Promise<{ message: string }> {
    try {
      const post = await this.findOne(id); // Busca el post por su id.
      if (!post) {
        this.handleNotFound('No se encuentra el post solicitado');
      } // Si no se encuentra el post, lanza un error de tipo NotFoundException.
      const updatePost = new UpdatePostDto(); // Crea un nuevo objeto UpdatePostDto.
      Object.assign(updatePost, updatePostDto); // Asigna los valores de updatePostDto a updatePost.
      const errors = await validate(updatePost); // Valida los datos de entrada del post.
      if (errors.length > 0) {
        this.handleBadRequest('Datos de entrada inválidos');
      } // Si los datos de entrada no son válidos, lanza un error de tipo BadRequestException.
      const updatedPost = await this.postModel.updateOne(
        {
          _id: id,
        },
        updatePostDto,
      ); // Actualiza el post en la base de datos.
      if (!updatedPost || updatedPost.modifiedCount === 0) {
        this.handleBadRequest('Error al intentar acualizar el post');
      } // Si no se actualiza el post, lanza un error de tipo BadRequestException.
      return this.successResponse('Post actualizado correctamente');
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.handleInternalServer('Error al actualizar el post'); // Si ocurre un error desconocido, lanza una excepción de tipo InternalServerErrorException.
    }
  } // Método para actualizar un post. El método recibe un objeto UpdatePostDto que contiene los datos del nuevo post. El método valida los datos de entrada del post antes de actualizarlo y guardarlo en la db.

  async deletePost(id: string): Promise<{ message: string }> {
    try {
      const post = await this.findOne(id); // Busca el post por su id.
      if (!post) {
        this.handleNotFound('No se encuentra el post solicitado');
      } // Si no se encuentra el post, lanza un error de tipo NotFoundException.
      const deletedPost = await this.postModel.deleteOne({ _id: id }); // Elimina el post de la base de datos.
      if (!deletedPost) {
        this.handleBadRequest('Error al intentar eliminar el post');
      } // Si no se elimina el post, lanza un error de tipo BadRequestException.
      return this.successResponse('Post eliminado correctamente'); // Retorna un mensaje de éxito.
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.handleInternalServer('Error al eliminar el post'); // Si ocurre un error desconocido, lanza una excepción de tipo InternalServerErrorException.
    }
  } // Método para eliminar un post. El método recibe un id del post que se desea eliminar. El método valida que el post exista antes de eliminarlo de la base de datos.
}
