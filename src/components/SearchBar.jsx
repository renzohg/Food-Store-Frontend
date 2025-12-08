import { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch, onFilterChange, filters, onSortChange, sortOrder }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const categoryIcons = {
    ofertas: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    hamburguesas: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 10c0-2 2-4 8-4s8 2 8 4"/>
        <path d="M4 10h16"/>
        <path d="M4 14h16"/>
        <path d="M4 14c0 2 2 4 8 4s8-2 8-4"/>
      </svg>
    ),
    pizzas: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L3 21h18L12 2z"/>
        <circle cx="10" cy="12" r="1" fill="currentColor"/>
        <circle cx="14" cy="16" r="1" fill="currentColor"/>
      </svg>
    ),
    lomos: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="8" width="16" height="2" rx="1"/>
        <rect x="4" y="11" width="16" height="4" rx="1"/>
        <rect x="4" y="16" width="16" height="2" rx="1"/>
      </svg>
    ),
    empanadas: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 8c0-2 2-4 6-4s6 2 6 4c0 8-6 12-6 12s-6-4-6-12z"/>
        <path d="M8 10c2 2 4 3 4 3s2-1 4-3" fill="none" strokeWidth="1.5"/>
      </svg>
    )
  };

  const categories = [
    { value: 'hamburguesas', label: 'Hamburguesas' },
    { value: 'pizzas', label: 'Pizzas' },
    { value: 'lomos', label: 'Lomitos' },
    { value: 'empanadas', label: 'Empanadas' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSearch} className="search-form">
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">Buscar</button>
      </form>
      
      <div className="filters">
        <div className="category-buttons">
          <button
            type="button"
            className={`category-btn ${!filters.category ? 'active' : ''}`}
            onClick={() => onFilterChange('category', '')}
          >
            Todas
          </button>
          <button
            type="button"
            className={`category-btn ${filters.category === 'ofertas' ? 'active' : ''}`}
            onClick={() => onFilterChange('category', 'ofertas')}
          >
            {categoryIcons.ofertas}
            Ofertas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`category-btn ${filters.category === cat.value ? 'active' : ''}`}
              onClick={() => onFilterChange('category', cat.value)}
            >
              {categoryIcons[cat.value]}
              {cat.label}
            </button>
          ))}
          <button
            onClick={() => {
              setSearchTerm('');
              onFilterChange('reset');
              onSortChange('');
            }}
            className="clear-button"
            title="Limpiar filtros"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="sort-section">
          <label>Ordenar por precio:</label>
          <select
            value={sortOrder || ''}
            onChange={(e) => onSortChange(e.target.value)}
            className="sort-select"
          >
            <option value="">Sin ordenar</option>
            <option value="asc">Menor a Mayor</option>
            <option value="desc">Mayor a Menor</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
