import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user, API_BASE } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClassrooms: 0,
    totalSeatingPlans: 0
  });
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [studentsRes, classroomsRes, historyRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/upload/students`),
        axios.get(`${API_BASE}/upload/classrooms`),
        axios.get(`${API_BASE}/generate/history?limit=5`)
      ]);

      // Update stats
      const newStats = { ...stats };
      if (studentsRes.status === 'fulfilled' && studentsRes.value.data.success) {
        newStats.totalStudents = studentsRes.value.data.data.totalCount || 0;
      }
      if (classroomsRes.status === 'fulfilled' && classroomsRes.value.data.success) {
        newStats.totalClassrooms = classroomsRes.value.data.data.totalCount || 0;
      }
      if (historyRes.status === 'fulfilled' && historyRes.value.data.success) {
        const results = historyRes.value.data.data.results || [];
        newStats.totalSeatingPlans = historyRes.value.data.data.pagination?.totalCount || 0;
        setRecentHistory(results);
      }
      
      setStats(newStats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Upload Students',
      description: 'Upload student data from Excel/CSV files',
      icon: '👨‍🎓',
      link: '/upload-students',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      title: 'Upload Classrooms',
      description: 'Upload classroom details and configurations',
      icon: '🏫',
      link: '/upload-classrooms',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      title: 'Generate Seating',
      description: 'Create new seating arrangements for exams',
      icon: '📋',
      link: '/generate-seating',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      title: 'View History',
      description: 'Access previous seating plans and results',
      icon: '📚',
      link: '/seating-history',
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Manage student seating arrangements for examinations
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">👨‍🎓</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Students
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.totalStudents.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">🏫</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Classrooms
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.totalClassrooms}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📋</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Seating Plans
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.totalSeatingPlans}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className={`${action.color} ${action.hoverColor} text-white p-6 rounded-lg shadow-md transition-colors duration-200 block`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{action.icon}</div>
                <h3 className="text-lg font-semibold mb-1">{action.title}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent History */}
      {recentHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Seating Plans</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentHistory.map((item) => (
              <div key={item._id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.examType.charAt(0).toUpperCase() + item.examType.slice(1)} Exam
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.totalStudents} students • {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {item.pdfGenerated && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      PDF Ready
                    </span>
                  )}
                  <Link
                    to="/seating-history"
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 bg-gray-50 text-center">
            <Link
              to="/seating-history"
              className="text-sm font-medium text-blue-600 hover:text-blue-900"
            >
              View All History →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;