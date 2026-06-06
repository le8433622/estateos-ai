import { Schema, model, Types, Document } from 'mongoose'

export interface SavedPropertyDocument extends Document {
  account_id: Types.ObjectId
  property_id: Types.ObjectId
  notes?: string
}

const savedPropertySchema = new Schema<SavedPropertyDocument>(
  {
    account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      required: [true, "can't be blank"],
      index: true,
    },
    property_id: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, "can't be blank"],
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'EstateOSSavedProperty',
  },
)

savedPropertySchema.index({ account_id: 1, property_id: 1 }, { unique: true })

const SavedProperty = model<SavedPropertyDocument>('SavedProperty', savedPropertySchema)

export default SavedProperty
