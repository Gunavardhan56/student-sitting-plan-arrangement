import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GenerateSeating = () => {
  const { API_BASE } = useAuth();
  const navigate = useNavigate();
  const [examType, setExamType] = useState('semester');
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [classroomConfigs, setClassroomConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classroomsRes, studentsRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/upload/classrooms`),
        axios.get(`${API_BASE}/upload/students`)
      ]);

      if (classroomsRes.status === 'fulfilled' && classroomsRes.value.data.success) {
        const classroomData = classroomsRes.value.data.data.classrooms;
        setClassrooms(classroomData);
        // Initialize configs with default 10x6 layout for each classroom
        setClassroomConfigs(classroomData.map(classroom => ({
          classroomNo: classroom.classroomNo,
          rows: Math.min(10, Math.ceil(Math.sqrt(classroom.capacity))),
          cols: Math.min(6, Math.ceil(classroom.capacity / Math.ceil(Math.sqrt(classroom.capacity))))
        })));
      }

      if (studentsRes.status === 'fulfilled' && studentsRes.value.data.success) {
        setStudents(studentsRes.value.data.data.students);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load data. Please ensure students and classrooms are uploaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (classroomNo, field, value) => {
    const numValue = parseInt(value) || 1;
    setClassroomConfigs(prev => 
      prev.map(config => 
        config.classroomNo === classroomNo 
          ? { ...config, [field]: numValue }
          : config
      )
    );
  };

  const handleGenerate = async () => {
    setError('');
    
    // Validation
    if (students.length === 0) {
      setError('No students found. Please upload students first.');
      return;
    }
    
    if (classrooms.length === 0) {
      setError('No classrooms found. Please upload classrooms first.');
      return;
    }

    if (classroomConfigs.length === 0) {
      setError('Please configure at least one classroom.');
      return;
    }

    // Calculate total capacity
    const totalCapacity = classroomConfigs.reduce((sum, config) => 
      sum + (config.rows * config.cols), 0
    );

    if (students.length > totalCapacity) {
      setError(`Not enough seats. Students: ${students.length}, Total configured capacity: ${totalCapacity}`);
      return;
    }

    setGenerating(true);

    try {
      const response = await axios.post(`${API_BASE}/generate`, {
        examType,
        classroomConfigs
      });

      if (response.data.success) {
        // Redirect to history page to show the result
        navigate('/seating-history');
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Generation error:', error);
      setError(error.response?.data?.message || 'Failed to generate seating arrangement');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900">Generate Seating Plan 📋</h1>
        <p className="text-gray-600 mt-2">
          Configure classroom layouts and generate seating arrangements for examinations
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">👨‍🎓</div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Students</p>
              <p className="text-xl font-bold text-blue-900">{students.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🏫</div>
            <div>
              <p className="text-sm text-green-600 font-medium">Available Classrooms</p>
              <p className="text-xl font-bold text-green-900">{classrooms.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Exam Type Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Exam Type</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`cursor-pointer border-2 rounded-lg p-4 transition-colors ${
              examType === 'semester' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}>
              <input
                type="radio"
                value="semester"
                checked={examType === 'semester'}
                onChange={(e) => setExamType(e.target.value)}
                className="sr-only"
              />
              <div className="flex items-start">
                <div className="text-2xl mr-3">📚</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Semester Exam</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Students are arranged with alternating departments to prevent cheating between students of the same course.
                  </p>
                </div>
              </div>
            </label>

            <label className={`cursor-pointer border-2 rounded-lg p-4 transition-colors ${
              examType === 'mid' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}>
              <input
                type="radio"
                value="mid"
                checked={examType === 'mid'}
                onChange={(e) => setExamType(e.target.value)}
                className="sr-only"
              />
              <div className="flex items-start">
                <div className="text-2xl mr-3">👥</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Mid-term Exam</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Senior students (3rd & 4th year) are paired with junior students (1st & 2nd year) for mentoring.
                  </p>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Classroom Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Classroom Configuration</h2>
        <p className="text-gray-600 mb-6">
          Configure the seating layout (rows × columns) for each classroom
        </p>

        {classroomConfigs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏫</div>
            <p className="text-gray-500">No classrooms available. Please upload classroom data first.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classroomConfigs.map((config, index) => {
              const classroom = classrooms.find(c => c.classroomNo === config.classroomNo);
              const configuredCapacity = config.rows * config.cols;
              const isOverCapacity = configuredCapacity > classroom?.capacity;

              return (
                <div key={config.classroomNo} className="border border-gray-300 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Classroom
                      </label>
                      <div className="p-2 bg-gray-100 rounded text-sm font-medium">
                        {config.classroomNo}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rows
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={config.rows}
                        onChange={(e) => handleConfigChange(config.classroomNo, 'rows', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Columns
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={config.cols}
                        onChange={(e) => handleConfigChange(config.classroomNo, 'cols', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacity Check
                      </label>
                      <div className={`p-2 rounded text-sm font-medium ${
                        isOverCapacity 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {configuredCapacity} / {classroom?.capacity}
                      </div>
                    </div>
                  </div>

                  {isOverCapacity && (
                    <div className="mt-2 text-sm text-red-600">
                      ⚠️ Configuration exceeds classroom capacity!
                    </div>
                  )}
                </div>
              );
            })}

            {/* Total Capacity Summary */}
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Total Configured Capacity:</span>
                <span className="font-bold text-lg">
                  {classroomConfigs.reduce((sum, config) => sum + (config.rows * config.cols), 0)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">Students to be seated:</span>
                <span className="text-sm font-medium">{students.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={generating || classroomConfigs.length === 0 || students.length === 0}
          className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {generating ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Generating Seating Plan...
            </div>
          ) : (
            'Generate Seating Plan'
          )}
        </button>
      </div>
    </div>
  );
};

export default GenerateSeating;