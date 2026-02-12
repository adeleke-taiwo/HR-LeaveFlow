import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { HiOutlineLogout, HiOutlineUser } from 'react-icons/hi';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="page-greeting">
          Welcome, {user?.firstName} {user?.lastName}
        </h1>
      </div>
      <div className="header-right">
        <span className="role-badge">{user?.role}</span>
        <button className="header-btn" onClick={() => navigate('/profile')} title="Profile">
          <HiOutlineUser />
        </button>
        <button className="header-btn" onClick={handleLogout} title="Logout">
          <HiOutlineLogout />
        </button>
      </div>
    </header>
  );
}
