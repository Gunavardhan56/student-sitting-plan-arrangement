import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const UploadClassrooms = () => {
  const { API_BASE } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE}/upload/classrooms`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess(`Successfully uploaded ${response.data.data.count} classrooms!`);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (error.response?.data?.errors) {
        setError(error.response.data.errors.join('\n'));
      } else {
        setError(error.response?.data?.message || 'Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900">Upload Classrooms 🏫</h1>
        <p className="text-gray-600 mt-2">
          Upload classroom data from Excel (.xlsx, .xls) or CSV files
        </p>
      </div>

      {/* File Format Requirements */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-green-900 mb-3">File Format Requirements</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-green-800 mb-2">Required Columns:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• <strong>classroomNo</strong> - Classroom identifier (unique)</li>
              <li>• <strong>capacity</strong> - Total seating capacity (1-200)</li>
              <li>• <strong>benches</strong> - Number of benches (1-100)</li>
              <li>• <strong>personsPerBench</strong> - Students per bench (1-4)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-green-800 mb-2">Sample Data:</h3>
            <div className="bg-white rounded border text-xs p-3">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">classroomNo</th>
                    <th className="text-left p-1">capacity</th>
                    <th className="text-left p-1">benches</th>
                    <th className="text-left p-1">personsPerBench</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-1">A101</td>
                    <td className="p-1">60</td>
                    <td className="p-1">30</td>
                    <td className="p-1">2</td>
                  </tr>
                  <tr>
                    <td className="p-1">B201</td>
                    <td className="p-1">80</td>
                    <td className="p-1">40</td>
                    <td className="p-1">2</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-white rounded border border-green-300">
          <p className="text-sm text-green-800">
            <strong>Important:</strong> Capacity must equal benches × personsPerBench. 
            For example: 60 capacity = 30 benches × 2 persons per bench
          </p>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Drag and Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-4">
              <div className="text-4xl">🏫</div>
              <div>
                <p className="text-lg font-medium text-gray-700">
                  {file ? file.name : 'Drop your file here or click to browse'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: .xlsx, .xls, .csv (Max size: 10MB)
                </p>
              </div>
              {file && (
                <div className="bg-gray-100 rounded-lg p-3 inline-block">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Selected:</span>
                    <span className="text-sm text-gray-600">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              ✅ {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="whitespace-pre-wrap">{error}</div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!file || uploading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {uploading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </div>
              ) : (
                'Upload Classrooms'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Uploading new classroom data will replace all existing classroom records</li>
          <li>• Make sure all classroom numbers are unique across the file</li>
          <li>• Capacity calculation must be exact: capacity = benches × personsPerBench</li>
          <li>• Maximum capacity per classroom is 200 students</li>
          <li>• Maximum 100 benches per classroom</li>
          <li>• Maximum 4 students per bench</li>
        </ul>
      </div>
    </div>
  );
};

export default UploadClassrooms;