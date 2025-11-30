import mongoose from 'mongoose';

const classroomSchema = new mongoose.Schema({
  classroomNo: {
    type: String,
    required: [true, 'Classroom number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [200, 'Capacity cannot exceed 200']
  },
  benches: {
    type: Number,
    required: [true, 'Number of benches is required'],
    min: [1, 'Must have at least 1 bench'],
    max: [100, 'Cannot exceed 100 benches']
  },
  personsPerBench: {
    type: Number,
    required: [true, 'Persons per bench is required'],
    min: [1, 'Must have at least 1 person per bench'],
    max: [4, 'Cannot exceed 4 persons per bench']
  }
}, {
  timestamps: true
});

// Validation to ensure capacity matches benches * personsPerBench
classroomSchema.pre('save', function(next) {
  const calculatedCapacity = this.benches * this.personsPerBench;
  if (this.capacity !== calculatedCapacity) {
    const error = new Error(`Capacity (${this.capacity}) must equal benches (${this.benches}) × persons per bench (${this.personsPerBench}) = ${calculatedCapacity}`);
    return next(error);
  }
  next();
});

const Classroom = mongoose.model('Classroom', classroomSchema);

export default Classroom;