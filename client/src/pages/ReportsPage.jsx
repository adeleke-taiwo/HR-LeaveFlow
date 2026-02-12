import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaveService } from '../services/leaveService';
import { departmentService } from '../services/departmentService';
import { userService } from '../services/userService';
import { downloadFile } from '../utils/downloadFile';
import LeaveTypeDistribution from '../components/charts/LeaveTypeDistribution';
import DepartmentUtilization from '../components/charts/DepartmentUtilization';
import LeavesTrendChart from '../components/charts/LeavesTrendChart';
import toast from 'react-hot-toast';
import './ReportsPage.css';
import { useAuth } from '../hooks/useAuth';

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('exports');
  const [exportFilters, setExportFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    departmentId: '',
  });
  const [annualReportFilters, setAnnualReportFilters] = useState({
    userId: '',
    year: new Date().getFullYear(),
  });
  const [analyticsFilters, setAnalyticsFilters] = useState({
    departmentId: '',
    startDate: '',
    endDate: '',
  });
  const [isExporting, setIsExporting] = useState(false);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.getAll,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
    enabled: user.role !== 'employee',
  });

  const { data: annualReport, isLoading: loadingAnnualReport } = useQuery({
    queryKey: ['annualReport', annualReportFilters.userId, annualReportFilters.year],
    queryFn: () => leaveService.getAnnualReport(annualReportFilters.userId, annualReportFilters.year),
    enabled: !!annualReportFilters.userId && activeTab === 'annual',
  });

  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['departmentAnalytics', analyticsFilters.departmentId, analyticsFilters],
    queryFn: () => leaveService.getDepartmentAnalytics(analyticsFilters.departmentId, {
      startDate: analyticsFilters.startDate,
      endDate: analyticsFilters.endDate,
    }),
    enabled: !!analyticsFilters.departmentId && activeTab === 'analytics',
  });

  const handleExport = async (format) => {
    try {
      setIsExporting(true);
      const response = await leaveService.exportLeaves(exportFilters, format);
      const filename = `leaves_${new Date().toISOString().split('T')[0]}.${format}`;
      downloadFile(response.data, filename);
      toast.success(`Export successful: ${filename}`);
    } catch (error) {
      let message = 'Export failed';
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          message = json.message || message;
        } catch {}
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const deptList = departments?.data?.data || [];
  const userList = users?.data?.data || [];
  const report = annualReport?.data?.data;
  const analytics = analyticsData?.data?.data;

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>Reports & Analytics</h1>
        <p>Export data and view analytics</p>
      </div>

      <div className="reports-tabs">
        <button
          className={`tab ${activeTab === 'exports' ? 'active' : ''}`}
          onClick={() => setActiveTab('exports')}
        >
          Exports
        </button>
        <button
          className={`tab ${activeTab === 'annual' ? 'active' : ''}`}
          onClick={() => setActiveTab('annual')}
        >
          Annual Reports
        </button>
        {user.role === 'admin' && (
          <button
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Department Analytics
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'exports' && (
          <div className="exports-section">
            <div className="filters-card">
              <h3>Export Filters</h3>
              <div className="filters-grid">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={exportFilters.startDate}
                    max={exportFilters.endDate || undefined}
                    onChange={(e) => setExportFilters({ ...exportFilters, startDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={exportFilters.endDate}
                    min={exportFilters.startDate || undefined}
                    onChange={(e) => setExportFilters({ ...exportFilters, endDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={exportFilters.status}
                    onChange={(e) => setExportFilters({ ...exportFilters, status: e.target.value })}
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="pending_hr">Awaiting HR</option>
                  </select>
                </div>
                {user.role === 'admin' && (
                  <div className="form-group">
                    <label>Department</label>
                    <select
                      value={exportFilters.departmentId}
                      onChange={(e) => setExportFilters({ ...exportFilters, departmentId: e.target.value })}
                    >
                      <option value="">All Departments</option>
                      {deptList.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="export-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleExport('csv')}
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export CSV'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export PDF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'annual' && (
          <div className="annual-section">
            <div className="filters-card">
              <h3>Select Employee & Year</h3>
              <div className="filters-grid">
                <div className="form-group">
                  <label>Employee</label>
                  <select
                    value={annualReportFilters.userId}
                    onChange={(e) =>
                      setAnnualReportFilters({ ...annualReportFilters, userId: e.target.value })
                    }
                  >
                    <option value="">Select Employee</option>
                    {userList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input
                    type="number"
                    min="2020"
                    max={new Date().getFullYear() + 1}
                    value={annualReportFilters.year}
                    onChange={(e) =>
                      setAnnualReportFilters({ ...annualReportFilters, year: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>

            {loadingAnnualReport && <div className="loading">Loading report...</div>}

            {report && (
              <div className="report-content">
                <div className="report-header">
                  <h3>Annual Leave Report - {report.year}</h3>
                  <div className="employee-info">
                    <p><strong>Employee:</strong> {report.employee.name}</p>
                    <p><strong>Email:</strong> {report.employee.email}</p>
                    <p><strong>Department:</strong> {report.employee.department}</p>
                  </div>
                </div>

                <div className="summary-cards">
                  <div className="summary-card">
                    <h4>Total Leaves Requested</h4>
                    <p className="stat-value">{report.summary.totalLeavesRequested}</p>
                  </div>
                  <div className="summary-card">
                    <h4>Days Taken</h4>
                    <p className="stat-value">{report.summary.totalDaysTaken}</p>
                  </div>
                  <div className="summary-card">
                    <h4>Days Pending</h4>
                    <p className="stat-value">{report.summary.totalDaysPending}</p>
                  </div>
                </div>

                <div className="balances-section">
                  <h4>Leave Balances</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Leave Type</th>
                        <th>Allocated</th>
                        <th>Used</th>
                        <th>Pending</th>
                        <th>Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.balances.map((balance, index) => (
                        <tr key={index}>
                          <td>{balance.leaveType}</td>
                          <td>{balance.allocated}</td>
                          <td>{balance.used}</td>
                          <td>{balance.pending}</td>
                          <td>{balance.available}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="leave-type-breakdown">
                  <h4>Breakdown by Leave Type</h4>
                  {Object.entries(report.leavesByType).map(([typeName, data]) => (
                    <div key={typeName} className="type-card">
                      <h5>{typeName}</h5>
                      <p>Total Days: {data.totalDays}</p>
                      <p>
                        Approved: {data.approved} | Pending: {data.pending} | Rejected: {data.rejected}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && user.role === 'admin' && (
          <div className="analytics-section">
            <div className="filters-card">
              <h3>Department Analytics Filters</h3>
              <div className="filters-grid">
                <div className="form-group">
                  <label>Department</label>
                  <select
                    value={analyticsFilters.departmentId}
                    onChange={(e) =>
                      setAnalyticsFilters({ ...analyticsFilters, departmentId: e.target.value })
                    }
                  >
                    <option value="">Select Department</option>
                    {deptList.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={analyticsFilters.startDate}
                    max={analyticsFilters.endDate || undefined}
                    onChange={(e) =>
                      setAnalyticsFilters({ ...analyticsFilters, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={analyticsFilters.endDate}
                    min={analyticsFilters.startDate || undefined}
                    onChange={(e) =>
                      setAnalyticsFilters({ ...analyticsFilters, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {loadingAnalytics && <div className="loading">Loading analytics...</div>}

            {analytics && (
              <div className="analytics-content">
                <div className="analytics-header">
                  <h3>{analytics.department} - Analytics</h3>
                  <p>Period: {analytics.dateRange}</p>
                </div>

                <div className="summary-cards">
                  <div className="summary-card">
                    <h4>Total Leaves</h4>
                    <p className="stat-value">{analytics.summary.totalLeaves}</p>
                  </div>
                  <div className="summary-card">
                    <h4>Total Days</h4>
                    <p className="stat-value">{analytics.summary.totalDays}</p>
                  </div>
                  <div className="summary-card">
                    <h4>Approved</h4>
                    <p className="stat-value">{analytics.summary.approved}</p>
                  </div>
                  <div className="summary-card">
                    <h4>Pending</h4>
                    <p className="stat-value">{analytics.summary.pending}</p>
                  </div>
                </div>

                <div className="charts-grid">
                  <div className="chart-card">
                    <h4>Monthly Trends</h4>
                    <LeavesTrendChart data={analytics.monthlyTrends} />
                  </div>
                  <div className="chart-card">
                    <h4>Leave Type Distribution</h4>
                    <LeaveTypeDistribution data={analytics.typeDistribution} />
                  </div>
                  <div className="chart-card full-width">
                    <h4>Employee Utilization</h4>
                    <DepartmentUtilization data={analytics.employeeUtilization} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
