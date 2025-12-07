import { useState, useEffect } from 'react';
import './ProductDetail.css';

const ProductDetail = ({ product, onClose, onAddToCart }) => {
  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    if (product && product.options) {
      const initialOptions = {};
      
      // Inicializar opciones según lo que esté disponible
      Object.keys(product.options).forEach(key => {
        const option = product.options[key];
        if (option.enabled) {
          if (option.choices && option.choices.length > 0) {
            // Para bebida y personalizada, solo seleccionar si hay una opción marcada como default
            // Para otras opciones, buscar la opción por defecto o usar la primera
            if (key === 'bebida' || key === 'personalizada') {
              const defaultChoice = option.choices.find(c => c.isDefault);
              if (defaultChoice) {
                initialOptions[key] = defaultChoice.name;
              }
              // Si no hay default, no seleccionar ninguna (permitir que el usuario elija)
            } else {
              // Para otras opciones (tipo, tamaño, conPapas, etc.), siempre seleccionar la default o la primera
              const defaultChoice = option.choices.find(c => c.isDefault) || option.choices[0];
              initialOptions[key] = defaultChoice.name;
            }
          }
        }
      });
      
      setSelectedOptions(initialOptions);
    }
  }, [product]);

  const calculatePrice = () => {
    if (!product) return 0;
    
    let total = product.price;
    
    if (!product.options) return total;
    
    Object.keys(product.options).forEach(key => {
      const option = product.options[key];
      if (!option.enabled) return;
      
      const selectedValue = selectedOptions[key];
      
      if (option.choices && option.choices.length > 0) {
        // Opción con choices (tipo, tamaño, cantidad, bebida, conPapas, etc.)
        const choice = option.choices.find(c => c.name === selectedValue);
        if (choice) {
          total += choice.priceModifier || 0;
        }
      }
    });
    
    return total;
  };

  const getBasePrice = () => {
    return product?.price || 0;
  };

  const getPriceDifference = () => {
    return calculatePrice() - getBasePrice();
  };

  const handleAddToCart = () => {
    onAddToCart({
      ...product,
      selectedOptions,
      finalPrice: calculatePrice()
    });
    onClose();
  };

  const renderOption = (key, option) => {
    if (!option.enabled) return null;

    // Opción con choices (tipo, tamaño, cantidad, bebida, porcion, conPapas, etc.)
    if (option.choices && option.choices.length > 0) {
      const labels = {
        conPapas: 'Con/Sin papas',
        tipo: 'Tipo',
        tamaño: 'Tamaño',
        cantidad: 'Cantidad',
        porcion: 'Porción',
        bebida: 'Bebida',
        personalizada: 'Opciones'
      };

      // Para bebida y personalizada, permitir no seleccionar ninguna opción
      const isOptional = key === 'bebida' || key === 'personalizada';

      return (
        <div className="option-group" key={key}>
          <label className="option-label">{labels[key] || key}:</label>
          <div className="option-choices">
            {isOptional && (
              <label className="choice-label">
                <input
                  type="radio"
                  name={key}
                  value=""
                  checked={!selectedOptions[key] || selectedOptions[key] === ''}
                  onChange={(e) => {
                    const newOptions = { ...selectedOptions };
                    delete newOptions[key];
                    setSelectedOptions(newOptions);
                  }}
                />
                <span>Ninguna</span>
              </label>
            )}
            {option.choices.map((choice, index) => {
              const isSelected = selectedOptions[key] === choice.name;
              const isDefault = choice.isDefault;
              const priceMod = choice.priceModifier || 0;
              
              return (
                <label key={index} className={`choice-label ${isDefault ? 'default-choice' : ''}`}>
                  <input
                    type="radio"
                    name={key}
                    value={choice.name}
                    checked={isSelected}
                    onChange={(e) => setSelectedOptions({
                      ...selectedOptions,
                      [key]: e.target.value
                    })}
                  />
                  <span>
                    {choice.name}
                    {isDefault && <span className="default-badge"> (Por defecto)</span>}
                  </span>
                  {priceMod !== 0 && (
                    <span className={`option-price ${priceMod < 0 ? 'discount' : ''}`}>
                      {priceMod > 0 ? '+' : ''}${priceMod.toFixed(2)}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          {key === 'tipo' && selectedOptions[key] && (() => {
            const selectedChoice = option.choices.find(c => c.name === selectedOptions[key]);
            const basePrice = getBasePrice();
            const newPrice = basePrice + (selectedChoice?.priceModifier || 0);
            if (selectedChoice && !selectedChoice.isDefault && selectedChoice.priceModifier > 0) {
              return (
                <p className="option-hint">
                  Precio con {selectedChoice.name}: ${newPrice.toFixed(2)} (+${selectedChoice.priceModifier.toFixed(2)})
                </p>
              );
            }
            return null;
          })()}
        </div>
      );
    }

    return null;
  };

  if (!product) return null;

  const hasOptions = product.options && Object.keys(product.options).some(key => product.options[key].enabled);
  const priceDiff = getPriceDifference();

  return (
    <div className="product-detail-overlay" onClick={onClose}>
      <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="close-button" onClick={onClose}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
        
        <div className="product-detail-content">
          <div className="product-detail-image">
            {product.image ? (
              <img src={product.image} alt={product.name} />
            ) : (
              <div className="product-placeholder">Sin imagen</div>
            )}
          </div>
          
          <div className="product-detail-info">
            <h2>{product.name}</h2>
            <p className="product-detail-description">{product.description}</p>
            
            <div className="price-section-top">
              <div className="price-breakdown">
                <span className="price-label">Precio base:</span>
                <span className="price-base">${getBasePrice().toFixed(2)}</span>
              </div>
              {priceDiff !== 0 && (
                <div className="price-difference">
                  <span className="price-label">Modificaciones:</span>
                  <span className={`price-mod ${priceDiff > 0 ? 'positive' : 'negative'}`}>
                    {priceDiff > 0 ? '+' : ''}${priceDiff.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="price-total-row">
                <span className="price-label">Precio total:</span>
                <span className="price-total">${calculatePrice().toFixed(2)}</span>
              </div>
            </div>
            
            {hasOptions && (
              <div className="product-options">
                <h3 className="options-title">Configura tu pedido:</h3>
                {Object.keys(product.options || {}).map(key => 
                  renderOption(key, product.options[key])
                )}
              </div>
            )}

            <div className="product-detail-footer">
              <button 
                className="add-to-cart-button"
                onClick={handleAddToCart}
                disabled={product.sinStock}
              >
                {product.sinStock ? 'Sin stock' : 'Agregar al carrito'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
