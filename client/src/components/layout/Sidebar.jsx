import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import {
  HiOutlineViewGrid,
  HiOutlineDocumentText,
  HiOutlinePlusCircle,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineUsers,
  HiOutlineClipboardList,
  HiOutlineAdjustments,
  HiOutlineMenu,
  HiOutlineX,
} from 'react-icons/hi';
import './Sidebar.css';

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { to: '/dashboard', icon: <HiOutlineViewGrid />, label: 'Dashboard', roles: null },
    { to: '/leaves/my', icon: <HiOutlineDocumentText />, label: 'My Leaves', roles: null },
    { to: '/leaves/new', icon: <HiOutlinePlusCircle />, label: 'New Request', roles: null },
    { to: '/leaves/calendar', icon: <HiOutlineCalendar />, label: 'Calendar', roles: null },
    { to: '/balances', icon: <HiOutlineChartBar />, label: 'Leave Balance', roles: null },
    { to: '/leaves/team', icon: <HiOutlineUserGroup />, label: 'Team Leaves', roles: [ROLES.MANAGER, ROLES.ADMIN] },
    { to: '/reports', icon: <HiOutlineClipboardList />, label: 'Reports', roles: [ROLES.MANAGER, ROLES.ADMIN] },
    { to: '/admin/users', icon: <HiOutlineUsers />, label: 'Users', roles: [ROLES.ADMIN] },
    { to: '/admin/departments', icon: <HiOutlineOfficeBuilding />, label: 'Departments', roles: [ROLES.ADMIN] },
    { to: '/admin/leave-types', icon: <HiOutlineCog />, label: 'Leave Types', roles: [ROLES.ADMIN] },
    { to: '/admin/workflows', icon: <HiOutlineAdjustments />, label: 'Workflows', roles: [ROLES.ADMIN] },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button className="mobile-menu-button" onClick={toggleMobileMenu} aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}>
        {isMobileMenuOpen ? <HiOutlineX /> : <HiOutlineMenu />}
      </button>

      {/* Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={closeMobileMenu} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h2>HLF</h2>
          <span>HR LeaveFlow</span>
        </div>
        <nav className="sidebar-nav">
          {navItems
            .filter((item) => !item.roles || item.roles.includes(role))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
        </nav>
      </aside>
    </>
  );
}
