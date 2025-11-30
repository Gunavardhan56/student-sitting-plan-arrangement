import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import SeatingResult from '../models/SeatingResult.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Download PDF for seating result
router.get('/:id/pdf', async (req, res) => {
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
    
    if (!result.pdfGenerated || !result.pdfPath) {
      return res.status(404).json({
        success: false,
        message: 'PDF not generated for this seating result'
      });
    }
    
    const pdfPath = path.resolve(result.pdfPath);
    
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found on server'
      });
    }
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="seating-plan-${result._id}.pdf"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download PDF',
      error: error.message
    });
  }
});

// Delete seating result
router.delete('/:id', async (req, res) => {
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
    
    // Delete PDF file if it exists
    if (result.pdfPath && fs.existsSync(result.pdfPath)) {
      try {
        fs.unlinkSync(result.pdfPath);
      } catch (fileError) {
        console.warn('Failed to delete PDF file:', fileError.message);
      }
    }
    
    // Delete the database record
    await SeatingResult.deleteOne({ _id: req.params.id });
    
    res.json({
      success: true,
      message: 'Seating result deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete seating result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete seating result',
      error: error.message
    });
  }
});

export default router;