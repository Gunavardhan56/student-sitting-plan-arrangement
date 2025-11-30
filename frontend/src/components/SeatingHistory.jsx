import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const SeatingHistory = () => {
  const { API_BASE } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/generate/history`);
      if (response.data.success) {
        setHistory(response.data.data.results);
      } else {
        setError('Failed to fetch seating history');
      }
    } catch (error) {
      console.error('History fetch error:', error);
      setError('Failed to fetch seating history');
    } finally {
      setLoading(false);
    }
  };

  const fetchResultDetails = async (resultId) => {
    setDetailsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/generate/${resultId}`);
      if (response.data.success) {
        setSelectedResult(response.data.data);
      } else {
        setError('Failed to fetch result details');
      }
    } catch (error) {
      console.error('Details fetch error:', error);
      setError('Failed to fetch result details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const downloadPDF = async (resultId) => {
    try {
      const response = await axios.get(`${API_BASE}/result/${resultId}/pdf`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `seating-plan-${resultId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download error:', error);
      setError('Failed to download PDF');
    }
  };

  const deleteResult = async (resultId) => {
    if (!window.confirm('Are you sure you want to delete this seating result?')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE}/result/${resultId}`);
      if (response.data.success) {
        setHistory(prev => prev.filter(item => item._id !== resultId));
        if (selectedResult && selectedResult._id === resultId) {
          setSelectedResult(null);
        }
      } else {
        setError('Failed to delete result');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete result');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading seating history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900">Seating History 📚</h1>
        <p className="text-gray-600 mt-2">
          View and manage previously generated seating arrangements
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* History List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Generated Seating Plans</h2>
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-gray-500">No seating plans generated yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Create your first seating arrangement to see it here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {history.map((item) => (
                <div
                  key={item._id}
                  className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedResult && selectedResult._id === item._id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => fetchResultDetails(item._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">
                          {item.examType === 'semester' ? '📚' : '👥'}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.examType.charAt(0).toUpperCase() + item.examType.slice(1)} Exam
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.totalStudents} students • {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.pdfGenerated && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPDF(item._id);
                          }}
                          className="text-green-600 hover:text-green-900 text-sm font-medium"
                          title="Download PDF"
                        >
                          📄
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteResult(item._id);
                        }}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Result Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Seating Details</h2>
          </div>
          
          {detailsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading details...</p>
              </div>
            </div>
          ) : selectedResult ? (
            <div className="p-6 space-y-6">
              {/* Result Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Exam Type:</span>
                    <span className="ml-2 font-medium">
                      {selectedResult.examType.charAt(0).toUpperCase() + selectedResult.examType.slice(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Students:</span>
                    <span className="ml-2 font-medium">{selectedResult.totalStudents}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Capacity:</span>
                    <span className="ml-2 font-medium">{selectedResult.totalCapacity}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Generated:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedResult.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Classroom Breakdown */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Classroom Breakdown</h3>
                <div className="space-y-3">
                  {selectedResult.placements.map((placement) => {
                    const occupiedSeats = placement.grid.flat().filter(seat => seat !== null).length;
                    const totalSeats = placement.grid.length * placement.grid[0].length;
                    
                    return (
                      <div key={placement.classroomNo} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{placement.classroomNo}</h4>
                          <span className="text-sm text-gray-500">
                            {occupiedSeats}/{totalSeats} seats
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Layout: {placement.grid.length} rows × {placement.grid[0].length} columns
                        </div>
                        <div className="mt-2 bg-gray-100 rounded p-2">
                          <div className="grid gap-1" style={{
                            gridTemplateColumns: `repeat(${placement.grid[0].length}, 1fr)`
                          }}>
                            {placement.grid.flat().map((seat, index) => (
                              <div
                                key={index}
                                className={`w-4 h-4 text-xs flex items-center justify-center rounded ${
                                  seat ? 'bg-blue-200 text-blue-800' : 'bg-gray-200'
                                }`}
                                title={seat || 'Empty'}
                              >
                                {seat ? '●' : '○'}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              {selectedResult.pdfGenerated && (
                <div className="flex justify-end">
                  <button
                    onClick={() => downloadPDF(selectedResult._id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    📄 Download PDF
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-4xl mb-4">👆</div>
                <p className="text-gray-500">Select a seating plan to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatingHistory;