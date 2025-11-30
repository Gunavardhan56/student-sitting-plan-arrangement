import express from 'express';
import { body, validationResult } from 'express-validator';
import Employee from '../models/Employee.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Register employee
router.post('/register', [
  body('empId')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Employee ID must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Employee ID can only contain letters, numbers, underscores, and hyphens'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s.]+$/)
    .withMessage('Name can only contain letters, spaces, and dots'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
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

    const { empId, name, email, password } = req.body;

    // Check if employee with same empId or email already exists
    const existingEmployee = await Employee.findOne({
      $or: [
        { empId: empId.trim() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingEmployee) {
      const field = existingEmployee.empId === empId.trim() ? 'Employee ID' : 'Email';
      return res.status(409).json({
        success: false,
        message: `${field} already exists`
      });
    }

    // Create new employee
    const employee = new Employee({
      empId: empId.trim(),
      name: name.trim(),
      email: email.toLowerCase(),
      password
    });

    await employee.save();

    // Generate token
    const token = generateToken(employee);

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      data: {
        employee: employee.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        success: false,
        message: `${field === 'empId' ? 'Employee ID' : 'Email'} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login employee
router.post('/login', [
  body('empId')
    .trim()
    .notEmpty()
    .withMessage('Employee ID is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
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

    const { empId, password } = req.body;

    // Find employee by empId
    const employee = await Employee.findOne({ empId: empId.trim() });
    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await employee.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(employee);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        employee: employee.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Get current employee profile (requires authentication)
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const employee = await Employee.findById(decoded.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: {
        employee: employee.toJSON()
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

export default router;