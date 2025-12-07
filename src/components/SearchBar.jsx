import { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch, onFilterChange, filters, onSortChange, sortOrder }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const categories = [
    { value: 'hamburguesas', label: '🍔 Hamburguesas' },
    { value: 'pizzas', label: '🍕 Pizzas' },
    { value: 'lomos', label: '🥩 Lomitos' },
    { value: 'empanadas', label: '🥟 Empanadas' }
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
            Ofertas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`category-btn ${filters.category === cat.value ? 'active' : ''}`}
              onClick={() => onFilterChange('category', cat.value)}
            >
              {cat.label.replace(/[🍔🍕🥩🥟]/g, '').trim()}
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
