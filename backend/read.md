# Student Seating Plan Arrangement System

## Overview

A complete Node.js backend API system for managing student seating arrangements in examination halls. The system provides secure employee authentication, file upload capabilities for students and classrooms, intelligent seating algorithms for different exam types, and automatic PDF generation of seating plans.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture

The server uses a modern Node.js setup with:
- **Express.js** as the web framework with ES modules
- **MongoDB** with Mongoose ODM for data persistence
- **JWT** authentication with bcrypt password hashing
- **Multer** for file upload handling
- **XLSX** library for Excel/CSV file parsing
- **PDFKit** for seating plan PDF generation
- **Express Validator** for request validation

### API Structure

The API follows RESTful principles with modular route organization:
- **Authentication routes** (`/auth`): Employee registration and login
- **Upload routes** (`/upload`): Student and classroom file uploads
- **Generation routes** (`/generate`): Seating arrangement creation
- **Result routes** (`/result`): PDF download and result management

### Database Schema

MongoDB collections with Mongoose schemas:
- **Employee**: Stores admin credentials with hashed passwords
- **Student**: Student records with roll number, department, section, year
- **Classroom**: Classroom configurations with capacity and seating layout
- **SeatingResult**: Generated seating arrangements with metadata

### Authentication System

JWT-based authentication with:
- Secure password hashing using bcrypt (cost factor 12)
- Token-based session management
- Middleware protection for authenticated routes
- Employee registration with unique constraints

### File Processing System

Robust file upload and parsing:
- Support for Excel (.xlsx, .xls) and CSV formats
- Data validation with detailed error reporting
- Duplicate detection and prevention
- File size limits and type validation
- Automatic file cleanup after processing

### Seating Algorithms

Two intelligent seating arrangement algorithms:

#### Semester Exam Algorithm
- Groups students by department
- Arranges with alternating departments to prevent cheating
- No two adjacent seats have students from the same department
- Cyclic department distribution across classrooms

#### Mid-term Exam Algorithm
- Pairs senior students (3rd & 4th year) with juniors (1st & 2nd year)
- Promotes mentoring and reduces student anxiety
- Roll numbers arranged in ascending order within year groups
- Handles remaining students when pairing isn't possible

### PDF Generation System

Comprehensive PDF creation using PDFKit:
- Multi-page documents with classroom-specific layouts
- Visual grid representation of seating arrangements
- Statistical summaries and utilization metrics
- Professional formatting with headers and legends
- Automatic file management and storage

## External Dependencies

### Core Backend
- **express**: Web application framework
- **mongoose**: MongoDB object modeling
- **bcryptjs**: Password hashing library
- **jsonwebtoken**: JWT token generation and verification
- **cors**: Cross-origin resource sharing middleware
- **dotenv**: Environment variable management

### File Processing
- **multer**: Multipart/form-data handling for file uploads
- **xlsx**: Excel file reading and parsing
- **express-validator**: Request validation middleware

### PDF Generation
- **pdfkit**: PDF generation library with table support

### Development
- **nodemon**: Development server with auto-restart

## Recent Changes (January 2025)

- **Complete project replacement**: Replaced 3D medieval settlement game with student seating backend
- **Backend API implementation**: Built complete REST API with authentication and file processing
- **Database design**: Created MongoDB schemas for all entities
- **Smart algorithms**: Implemented semester and mid-term seating arrangement algorithms
- **PDF generation**: Added comprehensive PDF creation with visual layouts
- **Error handling**: Implemented robust validation and error management
- **File upload system**: Created secure file processing with cleanup

The application is designed for deployment on Replit with MongoDB Atlas integration through environment variables.