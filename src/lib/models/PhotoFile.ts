import { Schema, model, models, type Document } from 'mongoose'
import 'server-only'
import { type PhotoFileDocument } from '../modelInterfaces'

const PhotoFileSchema = new Schema({
  file: {
    type: Buffer,
    required: [true, 'File Buffer is required'],
  },
  mimeType: {
    type: String,
    required: [true, 'Mime Type is required'],
  },
  size: {
    type: Number,
    required: [true, 'Size is required'],
  }
},
{
  timestamps: true
})

export default models?.PhotoFile || model<PhotoFileDocument & Document>('PhotoFile', PhotoFileSchema)