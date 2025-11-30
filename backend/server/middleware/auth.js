import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Verify that the employee still exists
    const employee = await Employee.findById(decoded.id).select('-password');
    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: Employee not found'
      });
    }

    req.user = employee;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    } else {
      console.error('Authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  }
};

export const generateToken = (employee) => {
  return jwt.sign(
    {
      id: employee._id,
      empId: employee.empId,
      email: employee.email
    },
    process.env.JWT_SECRET || 'your-secret-key',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  );
};