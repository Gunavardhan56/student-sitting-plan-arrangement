# Student Seating Plan Arrangement System

A full-stack web application for managing student seating arrangements in examination halls. The system provides intelligent seating algorithms, file upload capabilities, and automatic PDF generation for seating plans.

## Features

- **Employee Authentication**: Secure registration and login system with JWT tokens
- **File Upload**: Excel/CSV file upload and parsing for students and classrooms
- **Smart Seating Algorithms**: 
  - Semester exams: Department-wise alternating arrangement
  - Mid-term exams: Senior-junior pairing system
- **PDF Generation**: Automatic PDF generation for seating plans
- **Modern UI**: React frontend with Tailwind CSS
- **RESTful API**: Well-structured API endpoints with proper validation

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose
- JWT Authentication
- PDFKit for PDF generation
- Multer for file uploads
- XLSX for Excel/CSV parsing

### Frontend
- React 18
- Vite (build tool)
- React Router
- Tailwind CSS
- Axios for API calls

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas account)
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd sittingplan
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
MONGO_URI=your_mongodb_connection_string_here
PORT=8001
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

**MongoDB Setup:**
- For MongoDB Atlas: Get your connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- For local MongoDB: Use `mongodb://localhost:27017/student_seating`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_BACKEND_URL=http://localhost:8001
```

**Note:** Vite uses the `VITE_` prefix for environment variables instead of `REACT_APP_`.

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:8001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000` (Vite will automatically open your browser)

### Production Build

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
```

The production build will be in the `frontend/dist` directory.

To preview the production build:
```bash
cd frontend
npm run preview
```

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

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register admin employee
- `POST /api/auth/login` - Login employee
- `GET /api/auth/profile` - Get current employee profile

### Upload
- `POST /api/upload/students` - Upload students Excel/CSV
- `POST /api/upload/classrooms` - Upload classrooms Excel/CSV
- `GET /api/upload/students` - Get all students
- `GET /api/upload/classrooms` - Get all classrooms

### Generation
- `POST /api/generate` - Generate seating arrangement
- `GET /api/generate/history` - Get seating plan history
- `GET /api/generate/:id` - Get specific seating plan details

### Results
- `GET /api/result/:id/pdf` - Download seating plan PDF

## Seating Algorithms

### Semester Exam
- Students arranged with alternating departments
- No adjacent seats from same department
- Prevents cheating between same-course students

### Mid-term Exam
- Seniors (3rd & 4th year) paired with juniors (1st & 2nd year)
- Ensures mixed year seating arrangement

## Project Structure

```
sittingplan/
├── backend/
│   ├── server/
│   │   ├── index.js          # Main server file
│   │   ├── middleware/       # Auth middleware
│   │   ├── models/           # MongoDB models
│   │   ├── routes/           # API routes
│   │   └── utils/            # Utility functions
│   ├── uploads/              # Uploaded files (gitignored)
│   ├── pdfs/                 # Generated PDFs (gitignored)
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── context/          # React context
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env.example
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.
