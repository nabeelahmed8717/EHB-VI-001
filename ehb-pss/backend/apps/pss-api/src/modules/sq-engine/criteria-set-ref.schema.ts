import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Prop } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type CriteriaSetRefDocument = HydratedDocument<CriteriaSetRef>;

/**
 * CriteriaSet Reference — Read-only Mongoose registration for sq-engine.
 *
 * sq-engine needs to READ criteria_sets to evaluate entity data.
 * The criteria module owns and writes this collection.
 *
 * This is a read-only reference schema — sq-engine never writes to criteria_sets.
 * When the criteria module is built, sq-engine should import CriteriaService
 * and call criteria.getCriteriaSet(platform_id, entity_type) instead of
 * querying this model directly.
 *
 * Collection: criteria_sets (same as criteria module will own)
 *
 * NOTE: field_key is a mapping from criterion id → entity_data field key.
 * e.g. criterion { id: 'c1', field_key: 'title' } checks entity_data.title
 * If field_key is absent, falls back to checking entity_data[criterion.id].
 */

export class CriterionRef {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true, default: false })
  required: boolean;

  @Prop({ required: true })
  sq_min: number;

  /**
   * Maps this criterion to a specific key in entity_data.
   * e.g. field_key: 'title' → checks entity_data.title
   * e.g. field_key: 'images' → checks entity_data.images (array length > 0)
   * If absent, falls back to entity_data[criterion.id]
   */
  @Prop({ type: String, default: null })
  field_key: string | null;
}

const CriterionRefSchema = new MongooseSchema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
    sq_min: { type: Number, required: true },
    field_key: { type: String, default: null },
  },
  { _id: false },
);

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'criteria_sets',
})
export class CriteriaSetRef {
  @Prop({ required: true, index: true })
  platform_id: string;

  @Prop({ required: true })
  entity_type: string;

  @Prop({ type: [CriterionRefSchema], default: [] })
  criteria: CriterionRef[];
}

export const CriteriaSetRefSchema = SchemaFactory.createForClass(CriteriaSetRef);

// Compound unique index: one criteria set per platform + entity type
CriteriaSetRefSchema.index({ platform_id: 1, entity_type: 1 }, { unique: true });
