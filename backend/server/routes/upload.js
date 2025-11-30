import express from 'express';
import { body, validationResult } from 'express-validator';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import Student from '../models/Student.js';
import Classroom from '../models/Classroom.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Helper function to validate and clean student data
const validateStudentData = (data) => {
  const errors = [];
  const validatedData = [];

  data.forEach((row, index) => {
    const rowNum = index + 2; // Excel row number (assuming header is row 1)
    
    if (!row.rollNo || typeof row.rollNo !== 'string') {
      errors.push(`Row ${rowNum}: Roll number is required and must be a string`);
      return;
    }
    
    if (!row.dept || typeof row.dept !== 'string') {
      errors.push(`Row ${rowNum}: Department is required and must be a string`);
      return;
    }
    
    if (!row.section || typeof row.section !== 'string') {
      errors.push(`Row ${rowNum}: Section is required and must be a string`);
      return;
    }
    
    if (!row.year || (typeof row.year !== 'number' && typeof row.year !== 'string')) {
      errors.push(`Row ${rowNum}: Year is required and must be a number`);
      return;
    }
    
    const year = parseInt(row.year);
    if (isNaN(year) || year < 1 || year > 4) {
      errors.push(`Row ${rowNum}: Year must be between 1 and 4`);
      return;
    }
    
    const dept = row.dept.toString().trim().toUpperCase();
    const validDepts = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM', 'BIO', 'AERO', 'AUTO'];
    if (!validDepts.includes(dept)) {
      errors.push(`Row ${rowNum}: Invalid department "${dept}". Valid departments are: ${validDepts.join(', ')}`);
      return;
    }
    
    const section = row.section.toString().trim().toUpperCase();
    if (!/^[A-Z]$/.test(section)) {
      errors.push(`Row ${rowNum}: Section must be a single uppercase letter`);
      return;
    }
    
    validatedData.push({
      rollNo: row.rollNo.toString().trim().toUpperCase(),
      dept,
      section,
      year
    });
  });

  return { errors, validatedData };
};

// Helper function to validate and clean classroom data
const validateClassroomData = (data) => {
  const errors = [];
  const validatedData = [];

  data.forEach((row, index) => {
    const rowNum = index + 2;
    
    if (!row.classroomNo || typeof row.classroomNo !== 'string') {
      errors.push(`Row ${rowNum}: Classroom number is required and must be a string`);
      return;
    }
    
    if (!row.capacity || (typeof row.capacity !== 'number' && typeof row.capacity !== 'string')) {
      errors.push(`Row ${rowNum}: Capacity is required and must be a number`);
      return;
    }
    
    if (!row.benches || (typeof row.benches !== 'number' && typeof row.benches !== 'string')) {
      errors.push(`Row ${rowNum}: Benches is required and must be a number`);
      return;
    }
    
    if (!row.personsPerBench || (typeof row.personsPerBench !== 'number' && typeof row.personsPerBench !== 'string')) {
      errors.push(`Row ${rowNum}: Persons per bench is required and must be a number`);
      return;
    }
    
    const capacity = parseInt(row.capacity);
    const benches = parseInt(row.benches);
    const personsPerBench = parseInt(row.personsPerBench);
    
    if (isNaN(capacity) || capacity < 1 || capacity > 200) {
      errors.push(`Row ${rowNum}: Capacity must be between 1 and 200`);
      return;
    }
    
    if (isNaN(benches) || benches < 1 || benches > 100) {
      errors.push(`Row ${rowNum}: Benches must be between 1 and 100`);
      return;
    }
    
    if (isNaN(personsPerBench) || personsPerBench < 1 || personsPerBench > 4) {
      errors.push(`Row ${rowNum}: Persons per bench must be between 1 and 4`);
      return;
    }
    
    if (capacity !== benches * personsPerBench) {
      errors.push(`Row ${rowNum}: Capacity (${capacity}) must equal benches (${benches}) × persons per bench (${personsPerBench}) = ${benches * personsPerBench}`);
      return;
    }
    
    validatedData.push({
      classroomNo: row.classroomNo.toString().trim().toUpperCase(),
      capacity,
      benches,
      personsPerBench
    });
  });

  return { errors, validatedData };
};

// Upload students
router.post('/students', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    
    try {
      // Read the Excel/CSV file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'File is empty or has no valid data'
        });
      }

      // Validate data
      const { errors, validatedData } = validateStudentData(data);
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Data validation failed',
          errors
        });
      }

      // Check for duplicates in the uploaded data
      const rollNumbers = validatedData.map(student => student.rollNo);
      const duplicateRollNumbers = rollNumbers.filter((rollNo, index) => rollNumbers.indexOf(rollNo) !== index);
      
      if (duplicateRollNumbers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate roll numbers found in uploaded file',
          duplicates: [...new Set(duplicateRollNumbers)]
        });
      }

      // Clear existing students and insert new ones
      await Student.deleteMany({});
      const insertedStudents = await Student.insertMany(validatedData);

      res.json({
        success: true,
        message: `Successfully uploaded ${insertedStudents.length} students`,
        data: {
          count: insertedStudents.length,
          students: insertedStudents.slice(0, 10) // Show first 10 as preview
        }
      });

    } catch (fileError) {
      console.error('File processing error:', fileError);
      return res.status(400).json({
        success: false,
        message: 'Error processing file. Please ensure it\'s a valid Excel or CSV file.',
        error: fileError.message
      });
    } finally {
      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

  } catch (error) {
    console.error('Student upload error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload students',
      error: error.message
    });
  }
});

// Upload classrooms
router.post('/classrooms', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    
    try {
      // Read the Excel/CSV file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'File is empty or has no valid data'
        });
      }

      // Validate data
      const { errors, validatedData } = validateClassroomData(data);
      
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Data validation failed',
          errors
        });
      }

      // Check for duplicates in the uploaded data
      const classroomNumbers = validatedData.map(classroom => classroom.classroomNo);
      const duplicateClassrooms = classroomNumbers.filter((classroomNo, index) => classroomNumbers.indexOf(classroomNo) !== index);
      
      if (duplicateClassrooms.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate classroom numbers found in uploaded file',
          duplicates: [...new Set(duplicateClassrooms)]
        });
      }

      // Clear existing classrooms and insert new ones
      await Classroom.deleteMany({});
      const insertedClassrooms = await Classroom.insertMany(validatedData);

      res.json({
        success: true,
        message: `Successfully uploaded ${insertedClassrooms.length} classrooms`,
        data: {
          count: insertedClassrooms.length,
          classrooms: insertedClassrooms
        }
      });

    } catch (fileError) {
      console.error('File processing error:', fileError);
      return res.status(400).json({
        success: false,
        message: 'Error processing file. Please ensure it\'s a valid Excel or CSV file.',
        error: fileError.message
      });
    } finally {
      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

  } catch (error) {
    console.error('Classroom upload error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload classrooms',
      error: error.message
    });
  }
});

// Get uploaded students (for verification)
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ rollNo: 1 }).limit(100);
    const totalCount = await Student.countDocuments();
    
    res.json({
      success: true,
      data: {
        students,
        totalCount,
        showing: students.length
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
});

// Get uploaded classrooms (for verification)
router.get('/classrooms', async (req, res) => {
  try {
    const classrooms = await Classroom.find().sort({ classroomNo: 1 });
    
    res.json({
      success: true,
      data: {
        classrooms,
        totalCount: classrooms.length
      }
    });
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch classrooms'
    });
  }
});

export default router;