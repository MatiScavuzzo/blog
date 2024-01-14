import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  author: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Array, required: true })
  categories: string[];
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ author: 1 });
PostSchema.index({ title: 'text', author: 'text' });
