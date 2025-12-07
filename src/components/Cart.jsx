import './Cart.css';

const Cart = ({ cart, isOpen, onClose, onRemoveItem, onUpdateQuantity }) => {
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.finalPrice * item.quantity), 0);
  };

  if (!isOpen) return null;

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Carrito de Compras</h2>
                      <button className="close-button" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
        </div>
        
        <div className="cart-content">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item, index) => (
                  <div key={index} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{item.name}</h4>
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <div className="cart-item-options">
                          {Object.entries(item.selectedOptions).map(([key, value]) => {
                            if (value === true) {
                              return <span key={key}>Con papas</span>;
                            } else if (value && value !== false) {
                              return <span key={key}>{value}</span>;
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </div>
                    <div className="cart-item-controls">
                      <div className="quantity-controls">
                        <button onClick={() => onUpdateQuantity(index, item.quantity - 1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(index, item.quantity + 1)}>+</button>
                      </div>
                      <div className="cart-item-price">
                        ${(item.finalPrice * item.quantity).toFixed(2)}
                      </div>
                                  <button className="remove-button" onClick={() => onRemoveItem(index)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="18" y1="6" x2="6" y2="18"></line>
                                      <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                  </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total:</span>
                  <span className="total-price">${calculateTotal().toFixed(2)}</span>
                </div>
                <button className="checkout-button">Finalizar Pedido</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;

