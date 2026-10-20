import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  LayoutDashboard,
  Layers,
  PlusCircle,
  Users,
  Receipt,
  LogOut,
  UserCheck
} from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <NavLink to={user?.role === 'admin' ? '/admin/dashboard' : '/my-fees'} className="nav-brand">
          <div className="brand-icon-wrapper">
            <CreditCard size={20} />
          </div>
          <span>FeeFlow</span>
        </NavLink>

        {/* Links by role */}
        <nav className="nav-links">
          {user && user.role === 'admin' && (
            <>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink
                to="/admin/fees"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Layers size={16} />
                <span>Fee Structures</span>
              </NavLink>
              <NavLink
                to="/admin/payments/new"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <PlusCircle size={16} />
                <span>Record Payment</span>
              </NavLink>
              <NavLink
                to="/admin/students"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Users size={16} />
                <span>Students</span>
              </NavLink>
            </>
          )}

          {user && user.role === 'student' && (
            <NavLink
              to="/my-fees"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Receipt size={16} />
              <span>My Fees & Receipts</span>
            </NavLink>
          )}

          {!user && (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span>Login</span>
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span>Register</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* User Info & Actions */}
        {user && (
          <div className="nav-user-section">
            <div className="user-pill">
              <UserCheck size={14} color="#6366f1" />
              <span style={{ fontWeight: 600 }}>{user.name.split(' ')[0]}</span>
              <span className={`role-badge ${user.role === 'admin' ? 'role-admin' : 'role-student'}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogoutClick}
              className="btn btn-outline btn-sm"
              title="Sign Out"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
