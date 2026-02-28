import { useState } from 'react';
import { orderService } from '../services/api';
import './Cart.css';

const Cart = ({ cart, isOpen, onClose, onRemoveItem, onUpdateQuantity }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', address: '', note: '', deliveryType: 'local' });
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.finalPrice * item.quantity), 0);
  };

  const handleFinalizeOrder = async () => {
    if (cart.length === 0) return;

    if (!showCustomerForm) {
      setShowCustomerForm(true);
      return;
    }

    if (!customerInfo.name) {
      return;
    }

    if (customerInfo.deliveryType === 'domicilio' && !customerInfo.address) {
      return;
    }

    setIsSubmitting(true);
    try {
      const items = cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.finalPrice,
        productId: item._id,
        options: Object.entries(item.selectedOptions || {}).map(([key, value]) => {
          if (value === true) return { label: key, value: 'Sí', priceModifier: 0 };
          if (value === false) return { label: key, value: 'No', priceModifier: 0 };
          if (typeof value === 'string') return { label: key, value, priceModifier: 0 };
          return null;
        }).filter(Boolean),
        notes: item.notes || ''
      }));

      const orderData = {
        items,
        customer: {
          name: customerInfo.name,
          deliveryType: customerInfo.deliveryType,
          address: customerInfo.deliveryType === 'domicilio' ? (customerInfo.address || '') : '',
          note: customerInfo.note || ''
        },
        total: calculateTotal(),
        status: 'pendiente'
      };

      const response = await orderService.create(orderData);
      const orderId = response.data.orderId;

      // Abrir WhatsApp con el ID del pedido
      const whatsappNumber = '5493541227477';
      const whatsappMessage = `ID del pedido: ${orderId}`;
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappUrl, '_blank');

      // Limpiar carrito y formulario
      cart.forEach((_, index) => onRemoveItem(0));
      setCustomerInfo({ name: '', address: '', note: '', deliveryType: 'local' });
      setShowCustomerForm(false);
      onClose();
    } catch (error) {
      console.error('Error al crear pedido:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Carrito de Compras</h2>
          <button className="close-button" onClick={onClose}>
            ×
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
                        ${Math.round(item.finalPrice * item.quantity)}
                      </div>
                      <button className="remove-button" onClick={() => onRemoveItem(index)}>
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-footer">
                {showCustomerForm && (
                  <div className="customer-form">
                    <h3>Información del Cliente</h3>
                    <input
                      type="text"
                      placeholder="Nombre *"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      required
                    />
                    <div className="delivery-type">
                      <label className="delivery-option">
                        <input
                          type="radio"
                          name="deliveryType"
                          value="local"
                          checked={customerInfo.deliveryType === 'local'}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, deliveryType: e.target.value })}
                        />
                        <span>Retira en el local</span>
                      </label>
                      <label className="delivery-option">
                        <input
                          type="radio"
                          name="deliveryType"
                          value="domicilio"
                          checked={customerInfo.deliveryType === 'domicilio'}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, deliveryType: e.target.value })}
                        />
                        <span>Envío a domicilio</span>
                      </label>
                    </div>
                    {customerInfo.deliveryType === 'domicilio' && (
                      <input
                        type="text"
                        placeholder="Dirección *"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                        required={customerInfo.deliveryType === 'domicilio'}
                      />
                    )}
                    <textarea
                      placeholder="Descripción / Notas adicionales"
                      value={customerInfo.note}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, note: e.target.value })}
                      rows="3"
                    />
                  </div>
                )}
                <div className="cart-total">
                  <span>Total:</span>
                  <span className="total-price">${Math.round(calculateTotal())}</span>
                </div>
                <button
                  className="checkout-button"
                  onClick={handleFinalizeOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Procesando...' : showCustomerForm ? 'Confirmar Pedido' : 'Finalizar Pedido'}
                </button>
                {showCustomerForm && (
                  <button
                    className="checkout-button cancel"
                    onClick={() => {
                      setShowCustomerForm(false);
                      setCustomerInfo({ name: '', address: '', note: '', deliveryType: 'local' });
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;

