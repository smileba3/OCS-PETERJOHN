import { Schema, model, models, type Document } from 'mongoose'
import 'server-only'
import { type DepartmentDocument } from '../modelInterfaces'

const DepartmentSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  memoTemplates: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Template'
    }],
    default: []
  },
  letterTemplates: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Template'
    }],
    default: []
  },
  isDissolved: {
    type: Boolean,
    default: false,
  }
},
{
  timestamps: true
})

export default models?.Department || model<DepartmentDocument & Document>('Department', DepartmentSchema)