import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Shared embedded schema for a MinIO-stored file object.
 * Reuse this in any Mongoose schema that stores a reference to a MinIO upload.
 *
 * `_id: false` because this is always an embedded (nested) sub-document —
 * it does not need its own MongoDB ObjectId since it lives inside a parent document.
 *
 * @example
 * class MyDocument {
 *   \@Prop({ type: MinioObjectSchema })
 *   attachment?: MinioObject;
 * }
 */
@Schema({ _id: false })
export class MinioObject {
  /** MinIO object key (storage path) */
  @Prop({ type: String, required: true })
  fileKey: string;

  /** MinIO bucket name */
  @Prop({ type: String })
  fileBucket?: string;

  /** Original file name */
  @Prop({ type: String })
  fileName?: string;

  /** MIME type */
  @Prop({ type: String })
  mimeType?: string;

  /** File size in bytes */
  @Prop({ type: Number })
  fileSize?: number;

  /** Public URL (if the object is publicly accessible) */
  @Prop({ type: String })
  publicUrl?: string;
}

export const MinioObjectSchema = SchemaFactory.createForClass(MinioObject);
