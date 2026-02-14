import mongoose, { Schema, Document } from 'mongoose'

export interface IWorkflowRun extends Document {
  repositoryId: string
  workflowName: string
  status: 'success' | 'failure' | 'cancelled' | 'in_progress'
  conclusion: string
  runNumber: number
  createdAt: Date
  completedAt: Date
  duration: number
}

const WorkflowRunSchema = new Schema<IWorkflowRun>({
  repositoryId: {
    type: String,
    required: true,
    ref: 'Repository',
    index: true
  },
  workflowName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'failure', 'cancelled', 'in_progress'],
    index: true
  },
  conclusion: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  runNumber: {
    type: Number,
    required: true,
    min: 1
  },
  completedAt: {
    type: Date
  },
  duration: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'workflow_runs'
})

WorkflowRunSchema.index({ repositoryId: 1, createdAt: -1 })
WorkflowRunSchema.index({ status: 1, conclusion: 1 })
WorkflowRunSchema.index({ workflowName: 1 })
WorkflowRunSchema.index({ runNumber: 1 })
WorkflowRunSchema.index({ duration: -1 })

export const WorkflowRun = mongoose.models.WorkflowRun || mongoose.model<IWorkflowRun>('WorkflowRun', WorkflowRunSchema)

// Export as WorkflowRunModel for backward compatibility
export const WorkflowRunModel = WorkflowRun