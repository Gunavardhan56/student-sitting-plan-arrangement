import mongoose from 'mongoose';

const placementSchema = new mongoose.Schema({
  classroomNo: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  grid: {
    type: [[String]], // 2D array of roll numbers (or null for empty seats)
    required: true,
    validate: {
      validator: function(grid) {
        return Array.isArray(grid) && grid.length > 0 && Array.isArray(grid[0]);
      },
      message: 'Grid must be a valid 2D array'
    }
  }
}, { _id: false });

const seatingResultSchema = new mongoose.Schema({
  examType: {
    type: String,
    required: [true, 'Exam type is required'],
    enum: {
      values: ['semester', 'mid'],
      message: 'Exam type must be either "semester" or "mid"'
    }
  },
  createdBy: {
    type: String,
    required: [true, 'Creator employee ID is required'],
    trim: true
  },
  placements: {
    type: [placementSchema],
    required: true,
    validate: {
      validator: function(placements) {
        return Array.isArray(placements) && placements.length > 0;
      },
      message: 'At least one placement is required'
    }
  },
  totalStudents: {
    type: Number,
    required: true,
    min: 0
  },
  totalCapacity: {
    type: Number,
    required: true,
    min: 0
  },
  pdfGenerated: {
    type: Boolean,
    default: false
  },
  pdfPath: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
seatingResultSchema.index({ createdBy: 1, createdAt: -1 });
seatingResultSchema.index({ examType: 1 });

const SeatingResult = mongoose.model('SeatingResult', seatingResultSchema);

export default SeatingResult;