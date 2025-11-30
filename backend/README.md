# Student Seating Plan Arrangement System

A complete Node.js + Express + MongoDB Atlas backend API for managing student seating arrangements in examination halls.

## Features

- **Employee Authentication**: Secure registration and login system with JWT tokens
- **File Upload**: Excel/CSV file upload and parsing for students and classrooms
- **Smart Seating Algorithms**: 
  - Semester exams: Department-wise alternating arrangement
  - Mid-term exams: Senior-junior pairing system
- **PDF Generation**: Automatic PDF generation for seating plans
- **RESTful API**: Well-structured API endpoints with proper validation

## Quick Start

1. **Set Environment Variables**:
   - Copy `.env.example` to `.env`
   - Add your MongoDB Atlas connection string to `MONGO_URI`
   - Set your JWT secret key

2. **Start the Server**:
   ```bash
   npm run dev
   ```

3. **API Endpoints**:
   - `POST /auth/register` - Register admin employee
   - `POST /auth/login` - Login employee
   - `POST /upload/students` - Upload students Excel/CSV
   - `POST /upload/classrooms` - Upload classrooms Excel/CSV
   - `POST /generate` - Generate seating arrangement
   - `GET /result/:id/pdf` - Download seating plan PDF

## File Formats

### Students File (Excel/CSV)
Required columns: `rollNo`, `dept`, `section`, `year`

Example:
```
rollNo    | dept | section | year
----------|------|---------|-----
21CS001   | CSE  | A       | 1
21IT002   | IT   | A       | 1
21ECE003  | ECE  | B       | 2
```

### Classrooms File (Excel/CSV)
Required columns: `classroomNo`, `capacity`, `benches`, `personsPerBench`

Example:
```
classroomNo | capacity | benches | personsPerBench
------------|----------|---------|----------------
A101        | 60       | 30      | 2
B201        | 40       | 20      | 2
```

## Seating Algorithms

### Semester Exam
- Students arranged with alternating departments
- No adjacent seats from same department
- Prevents cheating between same-course students

### Mid-term Exam
- Seniors (3rd & 4th year) paired with juniors (1st & 2nd year)
- Facilitates mentoring and reduces student anxiety
- Roll numbers arranged in ascending order

## Authentication

All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

All endpoints return standardized JSON responses:
```json
{
  "success": boolean,
  "message": "Description",
  "data": {}, // On success
  "errors": [] // On validation errors
}
```

## Tech Stack

- **Node.js** with ES modules
- **Express.js** web framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **xlsx** for Excel parsing
- **PDFKit** for PDF generation
- **bcrypt** for password hashing