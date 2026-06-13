import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  UploadCloud, 
  LogOut, 
  GraduationCap,
  FileCheck,
  User
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userRole = user?.role || 'student';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const teacherLinks = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/exams/new', icon: <PlusCircle size={20} />, label: 'Nouveau Examen' },
    { path: '/copies/upload', icon: <UploadCloud size={20} />, label: 'Scanner Copies' },
  ];

  const studentLinks = [
    { path: '/my-results', icon: <FileCheck size={20} />, label: 'Mes Résultats' },
  ];

  const links = userRole === 'teacher' ? teacherLinks : studentLinks;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">
            <GraduationCap size={28} color="#6366f1" />
          </div>
          <h1>AutoCorrect <span>AI</span></h1>
        </div>
        
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink 
              key={link.path} 
              to={link.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              <User size={18} />
            </div>
            <div className="user-info">
              <p className="user-name">{user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}</p>
              <p className="user-role">{userRole === 'teacher' ? 'Enseignant' : 'Étudiant'}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-search">
            {/* Search bar placeholder */}
          </div>
          <div className="header-actions">
            <div className="notification-badge">
              <span className="dot"></span>
            </div>
          </div>
        </header>
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
