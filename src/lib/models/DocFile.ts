import { Schema, model, models, type Document } from 'mongoose'
import 'server-only'
import { type DocFileDocument } from '../modelInterfaces'

const DocFileSchema = new Schema({
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

export default models?.DocFile || model<DocFileDocument & Document>('DocFile', DocFileSchema)