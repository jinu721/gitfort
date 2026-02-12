import mongoose, { Schema, Document } from 'mongoose'

export interface IVulnerability {
  type: 'env_var' | 'aws_key' | 'api_key' | 'private_key'
  severity: 'low' | 'medium' | 'high' | 'critical'
  file: string
  line: number
  description: string
  suggestion: string
}

export interface ISecurityScan extends Document {
  repositoryId: string
  scanDate: Date
  vulnerabilities: IVulnerability[]
  riskScore: number
  status: 'completed' | 'failed' | 'in_progress'
  createdAt: Date
  updatedAt: Date
}

const VulnerabilitySchema = new Schema<IVulnerability>({
  type: {
    type: String,
    required: true,
    enum: ['env_var', 'aws_key', 'api_key', 'private_key']
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical']
  },
  file: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 500
  },
  line: {
    type: Number,
    required: true,
    min: 1
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 1000
  },
  suggestion: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 1000
  }
}, { _id: false })

const SecurityScanSchema = new Schema<ISecurityScan>({
  repositoryId: {
    type: String,
    required: true,
    ref: 'Repository',
    index: true
  },
  scanDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  vulnerabilities: {
    type: [VulnerabilitySchema],
    required: true,
    default: []
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['completed', 'failed', 'in_progress'],
    default: 'in_progress'
  }
}, {
  timestamps: true,
  collection: 'security_scans'
})

SecurityScanSchema.index({ repositoryId: 1, scanDate: -1 })
SecurityScanSchema.index({ riskScore: -1 })
SecurityScanSchema.index({ status: 1 })
SecurityScanSchema.index({ 'vulnerabilities.severity': 1 })

export const SecurityScan = mongoose.models.SecurityScan || mongoose.model<ISecurityScan>('SecurityScan', SecurityScanSchema)