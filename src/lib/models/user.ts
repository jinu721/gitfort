import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  githubId: number
  username: string
  email: string
  avatarUrl: string
  accessToken: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  githubId: {
    type: Number,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 39
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  avatarUrl: {
    type: String,
    required: true,
    trim: true,
    match: /^https?:\/\/.+/
  },
  accessToken: {
    type: String,
    required: true,
    select: false
  }
}, {
  timestamps: true,
  collection: 'users'
})

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)