import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  rollNo: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  dept: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    uppercase: true,
    enum: {
      values: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'BIO', 'AERO', 'AUTO'],
      message: '{VALUE} is not a valid department'
    }
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
    uppercase: true,
    match: [/^[A-Z]$/, 'Section must be a single uppercase letter']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1, 'Year must be between 1 and 4'],
    max: [4, 'Year must be between 1 and 4']
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
studentSchema.index({ dept: 1, year: 1, section: 1 });
studentSchema.index({ year: 1, rollNo: 1 });

const Student = mongoose.model('Student', studentSchema);

export default Student;