import express from 'express';
import { body, validationResult } from 'express-validator';
import Student from '../models/Student.js';
import Classroom from '../models/Classroom.js';
import SeatingResult from '../models/SeatingResult.js';
import { generatePDF } from '../utils/pdfGenerator.js';

const router = express.Router();

// Helper function to shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function to generate semester seating (department alternation)
const generateSemesterSeating = (students, classrooms, classroomConfigs) => {
  const placements = [];
  let studentIndex = 0;
  
  // Group students by department
  const studentsByDept = {};
  students.forEach(student => {
    if (!studentsByDept[student.dept]) {
      studentsByDept[student.dept] = [];
    }
    studentsByDept[student.dept].push(student.rollNo);
  });
  
  // Sort roll numbers within each department
  Object.keys(studentsByDept).forEach(dept => {
    studentsByDept[dept].sort();
  });
  
  const departments = Object.keys(studentsByDept);
  const departmentIndexes = {};
  departments.forEach(dept => departmentIndexes[dept] = 0);
  
  for (const config of classroomConfigs) {
    const classroom = classrooms.find(c => c.classroomNo === config.classroomNo);
    if (!classroom) continue;
    
    const { rows, cols } = config;
    const grid = Array(rows).fill().map(() => Array(cols).fill(null));
    
    // Fill grid with alternating departments
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const deptIndex = (row * cols + col) % departments.length;
        const dept = departments[deptIndex];
        
        if (studentsByDept[dept] && departmentIndexes[dept] < studentsByDept[dept].length) {
          grid[row][col] = studentsByDept[dept][departmentIndexes[dept]];
          departmentIndexes[dept]++;
        }
      }
    }
    
    placements.push({
      classroomNo: config.classroomNo,
      grid
    });
  }
  
  return placements;
};

// Helper function to generate mid-term seating (senior-junior pairing)
const generateMidTermSeating = (students, classrooms, classroomConfigs) => {
  const placements = [];
  
  // Group students by year
  const studentsByYear = {
    1: [],
    2: [],
    3: [],
    4: []
  };
  
  students.forEach(student => {
    studentsByYear[student.year].push(student.rollNo);
  });
  
  // Sort roll numbers within each year
  Object.keys(studentsByYear).forEach(year => {
    studentsByYear[year].sort();
  });
  
  // Create senior-junior pairs
  const pairs = [];
  const seniors = [...studentsByYear[3], ...studentsByYear[4]]; // 3rd and 4th year
  const juniors = [...studentsByYear[1], ...studentsByYear[2]]; // 1st and 2nd year
  
  const maxPairs = Math.min(seniors.length, juniors.length);
  for (let i = 0; i < maxPairs; i++) {
    pairs.push([seniors[i], juniors[i]]);
  }
  
  // Add remaining students as single occupants
  const remaining = [];
  if (seniors.length > maxPairs) {
    remaining.push(...seniors.slice(maxPairs));
  }
  if (juniors.length > maxPairs) {
    remaining.push(...juniors.slice(maxPairs));
  }
  
  let pairIndex = 0;
  let remainingIndex = 0;
  
  for (const config of classroomConfigs) {
    const classroom = classrooms.find(c => c.classroomNo === config.classroomNo);
    if (!classroom) continue;
    
    const { rows, cols } = config;
    const grid = Array(rows).fill().map(() => Array(cols).fill(null));
    
    // Fill grid with pairs first, then remaining students
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col += 2) { // Process in pairs (bench seats)
        if (pairIndex < pairs.length) {
          // Place a senior-junior pair
          grid[row][col] = pairs[pairIndex][0]; // Senior
          if (col + 1 < cols) {
            grid[row][col + 1] = pairs[pairIndex][1]; // Junior
          }
          pairIndex++;
        } else if (remainingIndex < remaining.length) {
          // Place remaining students
          grid[row][col] = remaining[remainingIndex];
          remainingIndex++;
          if (col + 1 < cols && remainingIndex < remaining.length) {
            grid[row][col + 1] = remaining[remainingIndex];
            remainingIndex++;
          }
        }
      }
    }
    
    placements.push({
      classroomNo: config.classroomNo,
      grid
    });
  }
  
  return placements;
};

// Generate seating plan
router.post('/', [
  body('examType')
    .isIn(['semester', 'mid'])
    .withMessage('Exam type must be either "semester" or "mid"'),
  body('classroomConfigs')
    .isArray({ min: 1 })
    .withMessage('At least one classroom configuration is required'),
  body('classroomConfigs.*.classroomNo')
    .notEmpty()
    .withMessage('Classroom number is required'),
  body('classroomConfigs.*.rows')
    .isInt({ min: 1, max: 20 })
    .withMessage('Rows must be between 1 and 20'),
  body('classroomConfigs.*.cols')
    .isInt({ min: 1, max: 20 })
    .withMessage('Columns must be between 1 and 20')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { examType, classroomConfigs } = req.body;
    
    // Fetch students and classrooms
    const students = await Student.find().sort({ rollNo: 1 });
    const classrooms = await Classroom.find();
    
    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No students found. Please upload students first.'
      });
    }
    
    if (classrooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No classrooms found. Please upload classrooms first.'
      });
    }
    
    // Validate classroom configurations
    const configuredClassrooms = [];
    let totalCapacity = 0;
    
    for (const config of classroomConfigs) {
      const classroom = classrooms.find(c => c.classroomNo === config.classroomNo);
      if (!classroom) {
        return res.status(400).json({
          success: false,
          message: `Classroom ${config.classroomNo} not found`
        });
      }
      
      const configCapacity = config.rows * config.cols;
      if (configCapacity > classroom.capacity) {
        return res.status(400).json({
          success: false,
          message: `Configuration for classroom ${config.classroomNo} exceeds capacity. Maximum capacity: ${classroom.capacity}, configured: ${configCapacity}`
        });
      }
      
      totalCapacity += configCapacity;
      configuredClassrooms.push(classroom);
    }
    
    // Check if total capacity can accommodate all students
    if (students.length > totalCapacity) {
      return res.status(400).json({
        success: false,
        message: `Not enough seats. Students: ${students.length}, Total capacity: ${totalCapacity}`
      });
    }
    
    // Generate seating arrangement based on exam type
    let placements;
    if (examType === 'semester') {
      placements = generateSemesterSeating(students, classrooms, classroomConfigs);
    } else {
      placements = generateMidTermSeating(students, classrooms, classroomConfigs);
    }
    
    // Save seating result
    const seatingResult = new SeatingResult({
      examType,
      createdBy: req.user.empId,
      placements,
      totalStudents: students.length,
      totalCapacity
    });
    
    await seatingResult.save();
    
    // Generate PDF
    try {
      const pdfPath = await generatePDF(seatingResult);
      seatingResult.pdfGenerated = true;
      seatingResult.pdfPath = pdfPath;
      await seatingResult.save();
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      // Continue without failing the entire request
    }
    
    res.json({
      success: true,
      message: 'Seating arrangement generated successfully',
      data: {
        id: seatingResult._id,
        examType: seatingResult.examType,
        totalStudents: seatingResult.totalStudents,
        totalCapacity: seatingResult.totalCapacity,
        placements: seatingResult.placements,
        pdfGenerated: seatingResult.pdfGenerated,
        createdAt: seatingResult.createdAt
      }
    });
    
  } catch (error) {
    console.error('Seating generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate seating arrangement',
      error: error.message
    });
  }
});

// Get all seating results for the authenticated user
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const results = await SeatingResult.find({ createdBy: req.user.empId })
      .select('-placements') // Exclude large placements data for list view
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await SeatingResult.countDocuments({ createdBy: req.user.empId });
    
    res.json({
      success: true,
      data: {
        results,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching seating history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seating history'
    });
  }
});

// Get specific seating result
router.get('/:id', async (req, res) => {
  try {
    const result = await SeatingResult.findOne({
      _id: req.params.id,
      createdBy: req.user.empId
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Seating result not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching seating result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seating result'
    });
  }
});

export default router;