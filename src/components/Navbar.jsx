import { useState } from 'react';
import './Navbar.css';

const Navbar = ({ cartItemCount = 0, onCartClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <svg className="brand-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <h1>Delicias Express</h1>
          <p className="tagline">Sabor auténtico en cada bocado</p>
        </div>
        <div className="navbar-right">
          <button 
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12"/>
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18"/>
              )}
            </svg>
          </button>
          <ul className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
            <li><a href="#inicio" onClick={(e) => { e.preventDefault(); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Inicio</a></li>
            <li><a href="#menu" onClick={(e) => { e.preventDefault(); setMenuOpen(false); document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }); }}>Menú</a></li>
            <li><a href="#nosotros" onClick={(e) => { e.preventDefault(); setMenuOpen(false); document.getElementById('nosotros')?.scrollIntoView({ behavior: 'smooth' }); }}>Nosotros</a></li>
            <li><a href="#contacto" onClick={(e) => { e.preventDefault(); setMenuOpen(false); document.querySelector('.footer')?.scrollIntoView({ behavior: 'smooth' }); }}>Contacto</a></li>
          </ul>
          <button className="cart-button" onClick={onCartClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Carrito
            {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

