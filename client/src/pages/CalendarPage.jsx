import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { leaveService } from '../services/leaveService';
import { departmentService } from '../services/userService';
import toast from 'react-hot-toast';
import { ROLES } from '../utils/constants';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import './CalendarPage.css';

const KNOWN_COLORS = {
  'Annual Leave': '#3b82f6',
  'Sick Leave': '#ef4444',
  'Maternity Leave': '#a855f7',
  'Unpaid Leave': '#6b7280',
};

const FALLBACK_PALETTE = ['#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6'];

function getLeaveTypeColor(name) {
  if (KNOWN_COLORS[name]) return KNOWN_COLORS[name];
  // Hash-based fallback for unknown leave types
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user.role === ROLES.ADMIN) {
      loadDepartments();
    }
  }, [user.role]);

  useEffect(() => {
    loadCalendarLeaves();
  }, [currentDate, selectedDepartment]);

  const loadDepartments = async () => {
    try {
      const res = await departmentService.getAll();
      setDepartments(res.data.data);
    } catch (err) {
      toast.error('Failed to load departments');
    }
  };

  const loadCalendarLeaves = async () => {
    setIsLoading(true);
    try {
      const startDate = getMonthStart(currentDate);
      const endDate = getMonthEnd(currentDate);

      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };

      if (selectedDepartment) {
        params.departmentId = selectedDepartment;
      }

      const res = await leaveService.getCalendarLeaves(params);
      setLeaves(res.data.data);
    } catch (err) {
      toast.error('Failed to load calendar leaves');
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthStart = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getMonthEnd = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];

    // Monday-based offset (Mon=0 ... Sun=6)
    let startDayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    for (let i = 0; i < offset; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getLeavesForDay = (date) => {
    if (!date) return [];
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return leaves.filter((leave) => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      const checkDate = new Date(date);

      leaveStart.setHours(0, 0, 0, 0);
      leaveEnd.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);

      const inRange = checkDate >= leaveStart && checkDate <= leaveEnd;
      if (!inRange) return false;

      // On weekends, only show Maternity Leave
      if (isWeekend) {
        return leave.leaveType?.name?.toLowerCase().includes('maternity');
      }
      return true;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <div>
          <h2 className="page-title">Leave Calendar</h2>
          <p className="page-subtitle">
            {user.role === ROLES.MANAGER
              ? 'Your department team leave overview'
              : 'Organization-wide leave overview'}
          </p>
        </div>

        <div className="calendar-controls">
          {user.role === ROLES.ADMIN && departments.length > 0 && (
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="calendar-filter-select"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="calendar-navigation">
        <button onClick={previousMonth} className="calendar-nav-btn" aria-label="Previous month">
          <HiChevronLeft />
        </button>
        <div className="calendar-month-display">
          <h3>{monthYear}</h3>
          <button onClick={goToToday} className="btn-today">
            Today
          </button>
        </div>
        <button onClick={nextMonth} className="calendar-nav-btn" aria-label="Next month">
          <HiChevronRight />
        </button>
      </div>

      {isLoading ? (
        <div className="calendar-loading">Loading calendar...</div>
      ) : (
        <>
          <div className="calendar-grid">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="calendar-day-header">
                {day}
              </div>
            ))}

            {days.map((date, idx) => {
              const dayLeaves = getLeavesForDay(date);
              const isWeekend = date && (date.getDay() === 0 || date.getDay() === 6);
              return (
                <div
                  key={idx}
                  className={`calendar-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
                >
                  {date && (
                    <>
                      <div className="calendar-day-number">{date.getDate()}</div>
                      <div className="calendar-day-leaves">
                        {dayLeaves.slice(0, 3).map((leave) => (
                          <div
                            key={leave.id}
                            className="calendar-leave-item"
                            style={{
                              backgroundColor: getLeaveTypeColor(leave.leaveType?.name || 'Other'),
                            }}
                            title={`${leave.requester?.firstName} ${leave.requester?.lastName} - ${leave.leaveType?.name}`}
                          >
                            <span className="calendar-leave-name">
                              {leave.requester?.firstName} {leave.requester?.lastName?.charAt(0)}.
                            </span>
                          </div>
                        ))}
                        {dayLeaves.length > 3 && (
                          <div className="calendar-leave-more">+{dayLeaves.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="calendar-legend">
            <h4>Leave Types</h4>
            <div className="legend-items">
              {[...new Set(leaves.map((l) => l.leaveType?.name).filter(Boolean))].map((name) => (
                <div key={name} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: getLeaveTypeColor(name) }} />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
