import {
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { PostsService } from './post.service';
import { PaginationQuery } from './interfaces/paginationQuery';
import { Post } from './schemas/post.schema';

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
  async findAll(@Query() paginationQuery: PaginationQuery): Promise<Post[]> {
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
}
