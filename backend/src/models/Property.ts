import { Schema, model } from 'mongoose'
import * as movininTypes from ':movinin-types'
import * as env from '../config/env.config'
import { API_VISIBILITIES, CLAIM_STATES, LOCATION_PRECISIONS, PROPERTY_LISTING_TYPES } from '../estateos/constants'

const propertySchema = new Schema<env.Property>(
  {
    name: {
      type: String,
      required: [true, "can't be blank"],
    },
    type: {
      type: String,
      enum: [
        movininTypes.PropertyType.House,
        movininTypes.PropertyType.Apartment,
        movininTypes.PropertyType.Townhouse,
        movininTypes.PropertyType.Plot,
        movininTypes.PropertyType.Farm,
        movininTypes.PropertyType.Commercial,
        movininTypes.PropertyType.Industrial,
      ],
      required: [true, "can't be blank"],
    },
    agency: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'User',
      index: true,
    },
    description: {
      type: String,
      required: [true, "can't be blank"],
    },
    available: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
    },
    images: {
      type: [String],
    },
    bedrooms: {
      type: Number,
      required: [true, "can't be blank"],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    bathrooms: {
      type: Number,
      required: [true, "can't be blank"],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    kitchens: {
      type: Number,
      default: 1,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    parkingSpaces: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    size: {
      type: Number,
    },
    petsAllowed: {
      type: Boolean,
      required: [true, "can't be blank"],
    },
    furnished: {
      type: Boolean,
      required: [true, "can't be blank"],
    },
    minimumAge: {
      type: Number,
      required: [true, "can't be blank"],
      min: env.MINIMUM_AGE,
      max: 99,
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, "can't be blank"],
    },
    address: {
      type: String,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    price: {
      type: Number,
      required: [true, "can't be blank"],
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    cancellation: {
      type: Number,
      default: 0,
    },
    aircon: {
      type: Boolean,
      default: false,
    },
    rentalTerm: {
      type: String,
      enum: [
        movininTypes.RentalTerm.Monthly,
        movininTypes.RentalTerm.Weekly,
        movininTypes.RentalTerm.Daily,
        movininTypes.RentalTerm.Yearly,
      ],
      required: [true, "can't be blank"],
    },
    blockOnPay: {
      type: Boolean,
      default: true,
    },
    source_account_id: {
      type: Schema.Types.ObjectId,
      ref: 'AccountProfile',
      index: true,
    },
    listing_type: {
      type: String,
      enum: PROPERTY_LISTING_TYPES,
      default: 'sale',
      index: true,
    },
    property_type: {
      type: String,
      index: true,
    },
    price_per_m2: {
      type: Number,
      min: 0,
    },
    location_precision: {
      type: String,
      enum: LOCATION_PRECISIONS,
      default: 'approximate',
      index: true,
    },
    location_public: {
      type: Schema.Types.Mixed,
      default: {},
    },
    location_private: {
      type: Schema.Types.Mixed,
      default: {},
      select: false,
    },
    api_visibility: {
      type: String,
      enum: API_VISIBILITIES,
      default: 'public',
      index: true,
    },
    claim_state: {
      type: String,
      enum: CLAIM_STATES,
      default: 'self_declared',
      index: true,
    },
    trust_state: {
      type: Schema.Types.Mixed,
      default: {},
    },
    trust_score: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
      index: true,
    },
    risk_score: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
      index: true,
    },
    freshness_score: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    duplicate_risk_score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    last_checked_at: {
      type: Date,
    },
    quality_score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },
    quality_level: {
      type: String,
      enum: ['low', 'medium', 'high', 'api_grade'],
      default: 'low',
      index: true,
    },
    last_quality_check_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Property',
  },
)

propertySchema.index({ updatedAt: -1, _id: 1 })
propertySchema.index({ agency: 1, type: 1, rentalTerm: 1, available: 1, updatedAt: -1, _id: 1 })
propertySchema.index({ type: 1, rentalTerm: 1, available: 1 })
propertySchema.index({ location: 1, available: 1 })
propertySchema.index({ source_account_id: 1, claim_state: 1, updatedAt: -1 })
propertySchema.index({ api_visibility: 1, trust_score: -1, risk_score: 1 })
propertySchema.index(
  { name: 'text' },
  {
    default_language: 'none', // This disables stemming
    language_override: '_none', // Prevent MongoDB from expecting a language field
    background: true,
  },
)

const Property = model<env.Property>('Property', propertySchema)

export default Property
