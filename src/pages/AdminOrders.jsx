import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/api';
import NotificationModal from '../components/NotificationModal';
import './AdminOrders.css';

const statusOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_preparacion', label: 'En preparación' },
  { value: 'listo', label: 'Listo' },
  { value: 'entregado', label: 'Entregado' },
];

const statusLabel = (status) => {
  const item = statusOptions.find((s) => s.value === status);
  return item ? item.label : status;
};

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [expandedId, setExpandedId] = useState(null);
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrders = async (opts = {}) => {
    try {
      setLoading(true);
      const params = {
        status: opts.status ?? (statusFilter !== 'todos' ? statusFilter : undefined),
        search: opts.search ?? (searchTerm.trim() || undefined),
      };
      const response = await orderService.getAll(params);
      setOrders(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } else {
        setNotification({ isOpen: true, message: 'Error al cargar pedidos', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await orderService.updateStatus(id, status);
      setNotification({ isOpen: true, message: 'Estado actualizado', type: 'success' });
      loadOrders();
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } else {
        setNotification({ isOpen: true, message: 'No se pudo actualizar el estado', type: 'error' });
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadOrders({ search: searchTerm.trim() });
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    loadOrders({ status: value !== 'todos' ? value : undefined });
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const statusClass = (status) => {
    switch (status) {
      case 'pendiente':
        return 'badge-warning';
      case 'en_preparacion':
        return 'badge-info';
      case 'listo':
        return 'badge-success';
      case 'entregado':
        return 'badge-neutral';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="admin-panel orders-page">
      <header className="admin-header">
        <h1>Pedidos</h1>
        <div className="admin-actions">
          <button onClick={() => navigate('/admin')} className="btn-secondary">
            Productos
          </button>
          <button onClick={() => navigate('/')} className="btn-secondary">
            Ver Tienda
          </button>
          <button onClick={() => { localStorage.removeItem('adminToken'); navigate('/admin/login'); }} className="btn-danger">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="admin-content">
        <div className="orders-toolbar">
          <form className="orders-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Buscar/pegar ID de pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn-primary">Buscar</button>
          </form>

          <div className="orders-filters">
            {['todos', ...statusOptions.map(s => s.value)].map((value) => (
              <button
                key={value}
                className={`filter-chip ${statusFilter === value ? 'active' : ''}`}
                onClick={() => handleStatusFilter(value)}
                type="button"
              >
                {value === 'todos' ? 'Todos' : statusLabel(value)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading">Esperando pedidos...</div>
        ) : orders.length === 0 ? (
          <div className="no-orders">No hay pedidos</div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div className="order-card" key={order._id}>
                <div className="order-card-header">
                  <div>
                    <div className="order-id">{order.orderId}</div>
                    <div className="order-date">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className={`badge ${statusClass(order.status)}`}>
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="order-summary">
                  <div>
                    <p className="label">Cliente</p>
                    <p className="value">{order.customer?.name || 'Sin nombre'}</p>
                  </div>
                  <div>
                    <p className="label">Teléfono</p>
                    <p className="value">{order.customer?.phone || 'Sin teléfono'}</p>
                  </div>
                  <div>
                    <p className="label">Total</p>
                    <p className="value strong">{formatCurrency(order.total || 0)}</p>
                  </div>
                  <div>
                    <p className="label">Items</p>
                    <p className="value">{order.items?.length || 0}</p>
                  </div>
                </div>

                <div className="order-actions">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                    className="status-select"
                  >
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => toggleExpand(order._id)}
                  >
                    {expandedId === order._id ? 'Ocultar detalles' : 'Ver detalles'}
                  </button>
                </div>

                {expandedId === order._id && (
                  <div className="order-details">
                    <div className="order-section">
                      <h4>Items</h4>
                      {(order.items || []).map((item, idx) => (
                        <div className="order-item" key={idx}>
                          <div className="item-head">
                            <span className="item-name">{item.name}</span>
                            <span className="item-qty">x{item.quantity}</span>
                            <span className="item-price">{formatCurrency(item.price)}</span>
                          </div>
                          {item.options && item.options.length > 0 && (
                            <ul className="item-options">
                              {item.options.map((opt, oIdx) => (
                                <li key={oIdx}>
                                  <span>{opt.label}: {opt.value}</span>
                                  {opt.priceModifier ? (
                                    <span className="opt-price">
                                      {opt.priceModifier > 0 ? '+' : ''}{formatCurrency(opt.priceModifier)}
                                    </span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                          {item.notes && <p className="item-notes">Nota: {item.notes}</p>}
                        </div>
                      ))}
                    </div>

                    <div className="order-section">
                      <h4>Cliente</h4>
                      <p><strong>Nombre:</strong> {order.customer?.name || 'Sin nombre'}</p>
                      <p><strong>Teléfono:</strong> {order.customer?.phone || 'Sin teléfono'}</p>
                      <p><strong>Dirección:</strong> {order.customer?.address || 'Sin dirección'}</p>
                      {order.customer?.note && <p><strong>Nota:</strong> {order.customer.note}</p>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, isOpen: false })}
      />
    </div>
  );
};

export default AdminOrders;


