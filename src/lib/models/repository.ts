import mongoose, { Schema, Document } from 'mongoose'

export interface IRepository extends Document {
  userId: string
  githubId: number
  name: string
  fullName: string
  private: boolean
  language: string
  starCount: number
  forkCount: number
  lastScanDate: Date
  securityScore: number
  createdAt: Date
  updatedAt: Date
}

const RepositorySchema = new Schema<IRepository>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  githubId: {
    type: Number,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200
  },
  private: {
    type: Boolean,
    required: true,
    default: false
  },
  language: {
    type: String,
    trim: true,
    maxlength: 50
  },
  starCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  forkCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lastScanDate: {
    type: Date,
    index: true
  },
  securityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'repositories'
})

RepositorySchema.index({ userId: 1, githubId: 1 }, { unique: true })
RepositorySchema.index({ userId: 1, lastScanDate: 1 })
RepositorySchema.index({ securityScore: 1 })
RepositorySchema.index({ language: 1 })
RepositorySchema.index({ starCount: -1 })

export const Repository = mongoose.models.Repository || mongoose.model<IRepository>('Repository', RepositorySchema)