import { Roles, type MemoIndividualDocument } from "@/lib/modelInterfaces";
import { Schema, model, models, type Document } from 'mongoose';
import 'server-only';
import User from './User';

const MemoIndividualSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
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
        return !!user && user.role === Roles.Admin;
      },
      message: 'Prepared by should be prepared by Admin account only.'
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
      priority: Number
    }],
    default: []
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  cc: {
    type: [Schema.Types.ObjectId],
    ref: 'User',
  },
},
  {
    timestamps: true
  })

export default models?.MemoIndividual || model<MemoIndividualDocument & Document>('MemoIndividual', MemoIndividualSchema)