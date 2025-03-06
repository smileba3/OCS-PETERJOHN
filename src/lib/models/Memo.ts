import { Roles, type MemoDocument } from "@/lib/modelInterfaces";
import { Schema, model, models, type Document } from 'mongoose';
import 'server-only';
import Department from './Department';
import User from './User';

const MemoSchema = new Schema({
  departmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department ID is required'],
  },
  title: {
    type: String,
    required: [true, 'Memorandum Title is required'],
  },
  series: {
    type: String,
    required: [true, 'Memorandum Series is required'],
  },
  content: {
    type: String,
    required: [true, 'Memorandum Content is required'],
  },
  preparedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function (val: any) {
        const user = await User.findById(val);
        if (!!user && user.role === Roles.Admin) {
          const department = await Department.findOne({
            _id: (this as any).departmentId,
            isDissolved: false,
          });
          return !!department;
        }
        return false
      },
      message: 'Prepared by should be prepared by Admin account only and is within their department.'
    },
    required: [true, 'Prepared By is required'],
  },
  signatureApprovals: {
    type: [{
      signature_id: {
        type: Schema.Types.ObjectId,
        ref: 'ESignature',
        required: [true, 'E-Signature ID is required'],
      },
      approvedDate: {
        type: Date,
        default: null
      },
      rejectedDate: {
        type: Date,
        default: null
      },
      rejectedReason: String,
      priority: Number,
    }],
  },
  cc: {
    type: [Schema.Types.ObjectId],
    ref: 'User',
  },
},
  {
    timestamps: true
  })

export default models?.Memo || model<MemoDocument & Document>('Memo', MemoSchema)