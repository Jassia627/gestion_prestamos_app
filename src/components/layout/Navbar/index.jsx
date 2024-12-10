import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Cerrar menú cuando cambia la ruta
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Manejar el scroll cuando el menú está abierto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Botón para el menú móvil */}
      <button
        className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Fondo oscuro para el overlay del menú */}
      <div
        className={`menu-overlay ${isMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMenuOpen(false)}
      ></div>

      <nav className={`navbar ${isMenuOpen ? 'active' : ''}`}>
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo" onClick={() => setIsMenuOpen(false)}>
            SDLG
          </Link>
        </div>

        <div className="navbar-menu">
          {currentUser && (
            <>
              <Link
                to="/dashboard"
                className={`navbar-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/prestamos"
                className={`navbar-item ${location.pathname === '/prestamos' ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Préstamos
              </Link>
              <Link
                to="/deudores"
                className={`navbar-item ${location.pathname === '/deudores' ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Deudores
              </Link>
              <Link
                to="/reportes"
                className={`navbar-item ${location.pathname === '/reportes' ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Reportes
              </Link>
            </>
          )}

          {currentUser ? (
            <button onClick={handleLogout} className="logout-button">
              Cerrar Sesión
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="navbar-item"
                onClick={() => setIsMenuOpen(false)}
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="navbar-item"
                onClick={() => setIsMenuOpen(false)}
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
