import mongoose, { Document, Schema } from 'mongoose';

export interface ICoordinates {
  x: number;
  y: number;
}

export interface IViewport {
  width: number;
  height: number;
}

export interface IEvent {
  session_id: string;
  event_type: 'page_view' | 'click';
  page_url: string;
  timestamp: Date;
  coordinates?: ICoordinates;
  viewport?: IViewport;
  is_demo?: boolean;
}

export interface IEventDocument extends IEvent, Document {}

const CoordinatesSchema = new Schema<ICoordinates>(
  {
    x: { type: Number, required: true, min: 0 },
    y: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ViewportSchema = new Schema<IViewport>(
  {
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const EventSchema = new Schema<IEventDocument>(
  {
    session_id: {
      type: String,
      required: [true, 'session_id is required'],
      trim: true,
      maxlength: [128, 'session_id must not exceed 128 characters'],
      index: true,
    },
    event_type: {
      type: String,
      required: [true, 'event_type is required'],
      enum: {
        values: ['page_view', 'click'],
        message: 'event_type must be "page_view" or "click"',
      },
    },
    page_url: {
      type: String,
      required: [true, 'page_url is required'],
      trim: true,
      maxlength: [2048, 'page_url must not exceed 2048 characters'],
    },
    timestamp: {
      type: Date,
      required: [true, 'timestamp is required'],
      index: true,
    },
    coordinates: {
      type: CoordinatesSchema,
      required: false,
    },
    viewport: {
      type: ViewportSchema,
      required: false,
    },
    is_demo: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound indexes for common query patterns
EventSchema.index({ session_id: 1, timestamp: 1 });
EventSchema.index({ event_type: 1, page_url: 1 });
EventSchema.index({ page_url: 1, event_type: 1 }); // For heatmap queries
EventSchema.index({ timestamp: -1 }); // For recent events

export const Event = mongoose.model<IEventDocument>('Event', EventSchema);
