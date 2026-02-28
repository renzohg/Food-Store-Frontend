import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, orderService } from '../services/api';
import { getDefaultOptionsForCategory, getCategoryOptionsConfig } from '../utils/categoryOptions';
import NotificationModal from '../components/NotificationModal';
import ConfirmModal from '../components/ConfirmModal';
import './AdminPanel.css';

const AdminPanel = () => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('table');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const productsPerPage = 10;
  const [viewSection, setViewSection] = useState('products'); // 'products' | 'orders'
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('todos');
  const [orderExpanded, setOrderExpanded] = useState(null);
  const [ordersSidebarVisible, setOrdersSidebarVisible] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: 'hamburguesas',
    published: true,
    options: getDefaultOptionsForCategory('hamburguesas')
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadProducts();
    // NO cargar pedidos automáticamente
  }, [navigate]);

  // Efecto para manejar el scroll cuando se muestra/oculta el formulario
  useEffect(() => {
    if (showForm && editingProduct) {
      // Restaurar la posición del scroll cuando se abre el formulario en modo edición
      const savedScroll = sessionStorage.getItem('adminScrollPosition');
      if (savedScroll) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedScroll));
        });
      }
    }
  }, [showForm, editingProduct]);

  const loadProducts = async (preserveScroll = false) => {
    try {
      const scrollPosition = preserveScroll ? window.scrollY : null;
      setLoading(true);
      const response = await productService.getAll({ admin: 'true' });
      setAllProducts(response.data);
      if (preserveScroll && scrollPosition !== null) {
        // Use requestAnimationFrame for more reliable scroll restoration
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollPosition);
          });
        });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos según categoría
  useEffect(() => {
    let filtered = [...allProducts];

    if (selectedCategory !== 'todas') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    const startIndex = (currentPage - 1) * productsPerPage;
    const needsReset = filtered.length > 0 && startIndex >= filtered.length;
    const safePage = needsReset ? 1 : currentPage;
    const sliceStart = (safePage - 1) * productsPerPage;
    const sliceEnd = sliceStart + productsPerPage;

    setFilteredProducts(filtered);
    setProducts(filtered.slice(sliceStart, sliceEnd));

    if (needsReset) {
      setCurrentPage(1);
    }
  }, [allProducts, currentPage, productsPerPage, selectedCategory]);

  // Cargar pedidos
  const loadOrders = async (opts = {}) => {
    try {
      setOrdersLoading(true);
      const params = {
        status: opts.status ?? (orderStatusFilter !== 'todos' ? orderStatusFilter : undefined),
        search: opts.search ?? (orderSearchTerm.trim() || undefined)
      };
      const response = await orderService.getAll(params);
      setOrders(response.data || []);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } else {
        console.error('Error loading orders', error);
      }
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleOrderStatusChange = async (orderId, status) => {
    try {
      await orderService.updateStatus(orderId, status);
      setNotification({ isOpen: true, message: 'Estado de pedido actualizado', type: 'success' });
      // Recargar solo el pedido específico
      const response = await orderService.getById(orderId);
      setOrders(prevOrders => {
        const index = prevOrders.findIndex(o => o.orderId === orderId || o._id === orderId);
        if (index >= 0) {
          const updated = [...prevOrders];
          updated[index] = response.data;
          return updated;
        }
        return prevOrders;
      });
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
      setNotification({ isOpen: true, message: 'Error al actualizar el estado del pedido', type: 'error' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Si cambia la categoría, actualizar las opciones pero preservar bebida y personalizada
    if (name === 'category') {
      const newDefaultOptions = getDefaultOptionsForCategory(value);
      // Preservar opciones comunes (bebida y personalizada) si ya estaban configuradas
      const preservedOptions = {
        ...newDefaultOptions,
        bebida: formData.options?.bebida || newDefaultOptions.bebida,
        personalizada: formData.options?.personalizada || newDefaultOptions.personalizada
      };
      setFormData({
        ...formData,
        category: value,
        options: preservedOptions
      });
      return;
    }

    if (name.startsWith('options.')) {
      const parts = name.split('.');
      if (parts.length === 3) {
        // options.conPapas.enabled o options.conPapas.priceModifier
        const [_, optionKey, field] = parts;
        if (field === 'enabled') {
          const currentOption = formData.options[optionKey] || {};
          setFormData({
            ...formData,
            options: {
              ...formData.options,
              [optionKey]: {
                ...currentOption,
                enabled: checked,
                choices: currentOption.choices || []
              }
            }
          });
        } else {
          setFormData({
            ...formData,
            options: {
              ...formData.options,
              [optionKey]: {
                ...formData.options[optionKey],
                [field]: Math.round(parseFloat(value) || 0)
              }
            }
          });
        }
      } else if (parts.length === 4) {
        // options.tipo.0.name o options.tipo.0.priceModifier
        const [_, optionKey, choiceIndex, field] = parts;
        const newChoices = [...(formData.options[optionKey]?.choices || [])];
        newChoices[parseInt(choiceIndex)] = {
          ...newChoices[parseInt(choiceIndex)],
          [field]: field === 'priceModifier' ? Math.round(parseFloat(value) || 0) : value
        };
        setFormData({
          ...formData,
          options: {
            ...formData.options,
            [optionKey]: {
              ...formData.options[optionKey],
              enabled: formData.options[optionKey]?.enabled || false,
              choices: newChoices
            }
          }
        });
      }
    } else if (name === 'imageFile') {
      const file = e.target.files[0];
      if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
          setFormData({ ...formData, image: reader.result }); // Store as base64
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : (name === 'price' ? Math.round(parseFloat(value) || 0) : value)
      });
      if (name === 'image' && value) {
        setImagePreview(value);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Guardar posición del scroll antes de enviar
      const scrollPosition = window.scrollY;

      // Preparar TODAS las opciones que están en formData.options
      const processedOptions = {};

      // Procesar todas las opciones del formulario
      Object.keys(formData.options || {}).forEach(key => {
        const option = formData.options[key];
        if (!option) return;

        // Si tiene choices (choices, bebida, custom, etc.)
        if (option.choices && Array.isArray(option.choices)) {
          let validChoices = option.choices
            .filter(c => c && c.name && c.name.trim() !== '') // Solo guardar choices con nombre válido
            .map(c => ({
              name: c.name.trim(),
              priceModifier: parseFloat(c.priceModifier) || 0,
              isDefault: c.isDefault || false
            }));

          // Para bebida y personalizada: si no hay default, agregar "Ninguna" como opción por defecto
          const needsNoneDefault = (key === 'bebida' || key === 'personalizada') && !validChoices.some(c => c.isDefault);
          if (needsNoneDefault) {
            validChoices = [
              ...validChoices,
              { name: 'Ninguna', priceModifier: 0, isDefault: true }
            ];
          }

          // Guardar si está habilitada y hay al menos un choice válido
          if (option.enabled && validChoices.length > 0) {
            processedOptions[key] = {
              enabled: true,
              choices: validChoices
            };
          }
        }
        // Si es boolean (conPapas)
        else if (option.priceModifier !== undefined || option.default !== undefined) {
          // Guardar solo si está habilitada
          if (option.enabled) {
            processedOptions[key] = {
              enabled: true,
              priceModifier: parseFloat(option.priceModifier) || 0,
              default: option.default !== undefined ? option.default : true
            };
          }
        }
      });

      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : 0,
        image: formData.image,
        category: formData.category,
        published: formData.published !== undefined ? formData.published : true,
        options: processedOptions
      };

      if (editingProduct) {
        await productService.update(editingProduct._id, productData);
        setNotification({ isOpen: true, message: 'Producto actualizado exitosamente', type: 'success' });
      } else {
        await productService.create(productData);
        setNotification({ isOpen: true, message: 'Producto creado exitosamente', type: 'success' });
      }

      resetForm();

      // Restaurar scroll después de cargar productos
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 50);

      loadProducts(true);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
      setNotification({ isOpen: true, message: error.response?.data?.message || 'Error al guardar el producto', type: 'error' });
    }
  };

  const handleEdit = (product) => {
    // Guardar posición actual del scroll antes de abrir el formulario
    sessionStorage.setItem('adminScrollPosition', window.scrollY.toString());

    setEditingProduct(product);
    const defaultOptions = getDefaultOptionsForCategory(product.category || 'hamburguesas');

    // Mergear las opciones guardadas con las opciones por defecto
    const mergedOptions = { ...defaultOptions };

    // Si el producto tiene opciones guardadas, mergearlas
    if (product.options && typeof product.options === 'object' && Object.keys(product.options).length > 0) {
      Object.keys(product.options).forEach(key => {
        const savedOption = product.options[key];
        if (savedOption) {
          // Si tiene choices, preservar la estructura completa (incluso si está deshabilitada)
          if (savedOption.choices && Array.isArray(savedOption.choices) && savedOption.choices.length > 0) {
            // Limpiar opción auto "Ninguna" para no mostrarla al admin en edición
            const cleanedChoices = savedOption.choices
              .filter(c => !(c.name === 'Ninguna' && c.isDefault));

            mergedOptions[key] = {
              enabled: savedOption.enabled !== undefined ? savedOption.enabled : false,
              choices: cleanedChoices.map(c => ({
                name: c.name || '',
                priceModifier: parseFloat(c.priceModifier) || 0,
                isDefault: c.isDefault || false
              }))
            };
          }
          // Si es boolean (conPapas), preservar la estructura (incluso si está deshabilitada)
          else if (savedOption.priceModifier !== undefined || savedOption.default !== undefined) {
            mergedOptions[key] = {
              enabled: savedOption.enabled !== undefined ? savedOption.enabled : false,
              priceModifier: parseFloat(savedOption.priceModifier) || 0,
              default: savedOption.default !== undefined ? savedOption.default : (defaultOptions[key]?.default !== undefined ? defaultOptions[key].default : true)
            };
          }
        }
      });
    }

    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price ? product.price.toString() : '',
      image: product.image || '',
      category: product.category || 'hamburguesas',
      published: product.published !== undefined ? product.published : true,
      options: mergedOptions
    });
    setImagePreview(product.image || null);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      message: '¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          await productService.delete(id);
          setNotification({ isOpen: true, message: 'Producto eliminado exitosamente', type: 'success' });
          setConfirmModal({ isOpen: false, message: '', onConfirm: null });
          loadProducts(true);
        } catch (error) {
          if (error.response?.status === 401) {
            localStorage.removeItem('adminToken');
            navigate('/admin/login');
          }
          setNotification({ isOpen: true, message: error.response?.data?.message || 'Error al eliminar el producto', type: 'error' });
          setConfirmModal({ isOpen: false, message: '', onConfirm: null });
        }
      }
    });
  };

  const handleTogglePublished = async (product) => {
    try {
      const newPublished = !product.published;
      await productService.togglePublished(product._id, newPublished);
      setNotification({
        isOpen: true,
        message: newPublished ? 'Producto publicado exitosamente' : 'Producto ocultado exitosamente',
        type: 'success'
      });
      loadProducts(true);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
      setNotification({ isOpen: true, message: error.response?.data?.message || 'Error al cambiar el estado del producto', type: 'error' });
    }
  };

  const handleStockChange = async (productId, newStockValue) => {
    try {
      const sinStock = newStockValue === 'sinStock';
      await productService.updateStock(productId, sinStock);
      setNotification({
        isOpen: true,
        message: sinStock ? 'Producto marcado como sin stock' : 'Producto marcado como disponible',
        type: 'success'
      });
      loadProducts(true);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
      setNotification({ isOpen: true, message: error.response?.data?.message || 'Error al actualizar el stock', type: 'error' });
    }
  };

  const resetForm = () => {
    // Limpiar la posición guardada cuando se cierra el formulario
    sessionStorage.removeItem('adminScrollPosition');

    setFormData({
      name: '',
      description: '',
      price: '',
      image: '',
      category: 'hamburguesas',
      published: true,
      options: getDefaultOptionsForCategory('hamburguesas')
    });
    setImagePreview(null);
    setImageFile(null);
    setEditingProduct(null);
    setShowForm(false);
  };

  const renderOptionField = (config) => {
    const option = formData.options[config.key];
    if (!option) return null;

    if (config.type === 'boolean') {
      return (
        <div className="option-config" key={config.key}>
          <div className="option-header">
            <label className="option-checkbox-label">
              <input
                type="checkbox"
                name={`options.${config.key}.enabled`}
                checked={option.enabled || false}
                onChange={handleInputChange}
              />
              <span className="option-title">{config.label}</span>
            </label>
            {config.help && <p className="option-help">{config.help}</p>}
          </div>
          {option.enabled && (
            <div className="option-details">
              <label className="input-label">
                Valor del modificador (ARS):
                <span className="input-hint">Solo si la opción viene por defecto marcada</span>
              </label>
              <div className="price-modifier-controls">
                <input
                  type="number"
                  name={`options.${config.key}.priceModifier`}
                  value={Math.round(Math.abs(option.priceModifier || 0))}
                  onChange={(e) => {
                    const absValue = Math.round(Math.abs(parseFloat(e.target.value) || 0));
                    const isNegative = option.priceModifier < 0;
                    handleInputChange({
                      target: {
                        name: `options.${config.key}.priceModifier`,
                        value: isNegative ? -absValue : absValue
                      }
                    });
                  }}
                  step="0.01"
                  min="0"
                  className="styled-input"
                  placeholder="0.00"
                />
                <label className="modifier-type-toggle">
                  <input
                    type="checkbox"
                    checked={option.priceModifier < 0}
                    onChange={(e) => {
                      const currentValue = Math.abs(option.priceModifier || 0);
                      handleInputChange({
                        target: {
                          name: `options.${config.key}.priceModifier`,
                          value: e.target.checked ? -currentValue : currentValue
                        }
                      });
                    }}
                  />
                  <span>Resta precio</span>
                </label>
              </div>
              <p className="input-hint">
                {option.priceModifier < 0
                  ? `Esta opción RESTARÁ $${Math.abs(option.priceModifier || 0).toFixed(2)} al precio si se quita`
                  : `Esta opción SUMARÁ $${Math.abs(option.priceModifier || 0).toFixed(2)} al precio si se quita`}
              </p>
            </div>
          )}
        </div>
      );
    } else if (config.type === 'choices') {
      const requiresDefault = config.requiresDefault !== false;
      const hasDefault = option.choices?.some(c => c.isDefault) || false;

      return (
        <div className="option-config" key={config.key}>
          <div className="option-header">
            <label className="option-checkbox-label">
              <input
                type="checkbox"
                name={`options.${config.key}.enabled`}
                checked={option.enabled || false}
                onChange={handleInputChange}
              />
              <span className="option-title">{config.label}</span>
            </label>
            {config.help && config.key !== 'tipo' && config.key !== 'tamaño' && config.key !== 'porcion' && <p className="option-help">{config.help}</p>}
            {requiresDefault && !hasDefault && option.enabled && (
              <p className="option-help error">
                ⚠ Esta opción requiere que al menos una opción esté marcada como "Por defecto"
              </p>
            )}
          </div>
          {option.enabled && (
            <div className="option-choices-admin">

              {(option.choices || []).map((choice, index) => {
                const isDefault = choice.isDefault || false;
                const canUnsetDefault = requiresDefault && hasDefault && option.choices.filter(c => c.isDefault).length > 1;

                return (
                  <div key={index} className={`choice-row-admin ${isDefault ? 'default-choice-admin' : ''}`}>
                    <div className="choice-input-group">
                      <label className="input-label">Nombre:</label>
                      <input
                        type="text"
                        name={`options.${config.key}.${index}.name`}
                        value={choice.name || ''}
                        onChange={handleInputChange}
                        className="styled-input-compact"
                        placeholder="Ej: Clásica, Completa, etc."
                      />
                    </div>
                    <div className="choice-input-group">
                      <label className="input-label">Precio Extra:</label>
                      <div className="price-modifier-controls">
                        <input
                          type="number"
                          name={`options.${config.key}.${index}.priceModifier`}
                          value={Math.abs(choice.priceModifier || 0)}
                          onChange={(e) => {
                            const absValue = Math.abs(parseFloat(e.target.value) || 0);
                            const isNegative = choice.priceModifier < 0;
                            handleInputChange({
                              target: {
                                name: `options.${config.key}.${index}.priceModifier`,
                                value: isNegative ? -absValue : absValue
                              }
                            });
                          }}
                          step="0.01"
                          min="0"
                          className="styled-input-compact price-input-small"
                          placeholder="0"
                          disabled={isDefault && requiresDefault}
                        />
                        {!isDefault && (
                          <label className="modifier-type-toggle">
                            <input
                              type="checkbox"
                              checked={choice.priceModifier < 0}
                              onChange={(e) => {
                                const currentValue = Math.abs(choice.priceModifier || 0);
                                handleInputChange({
                                  target: {
                                    name: `options.${config.key}.${index}.priceModifier`,
                                    value: e.target.checked ? -currentValue : currentValue
                                  }
                                });
                              }}
                            />
                            <span>Resta precio</span>
                          </label>
                        )}
                      </div>

                    </div>
                    {requiresDefault && (
                      <button
                        type="button"
                        className={`set-default-btn ${isDefault ? 'active' : ''}`}
                        onClick={() => {
                          // Solo permitir cambiar si hay más de una opción o si no es la única marcada
                          const currentChoices = option.choices || [];
                          const defaultCount = currentChoices.filter(c => c.isDefault).length;
                          if (isDefault && defaultCount === 1) {
                            setNotification({ isOpen: true, message: 'Debe haber al menos una opción marcada como por defecto. Marca otra opción primero.', type: 'error' });
                            return;
                          }

                          const newChoices = currentChoices.map((c, i) => ({
                            ...c,
                            isDefault: i === index,
                            priceModifier: i === index ? 0 : c.priceModifier
                          }));
                          setFormData({
                            ...formData,
                            options: {
                              ...formData.options,
                              [config.key]: {
                                ...option,
                                choices: newChoices
                              }
                            }
                          });
                        }}
                      >
                        {isDefault ? '✓ Principal' : 'Predeterminada'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    } else if (config.type === 'bebida') {
      return (
        <div className="option-config" key={config.key}>
          <div className="option-header">
            <label className="option-checkbox-label">
              <input
                type="checkbox"
                name={`options.${config.key}.enabled`}
                checked={option.enabled || false}
                onChange={handleInputChange}
              />
              <span className="option-title">{config.label}</span>
            </label>
            {config.help && <p className="option-help">{config.help}</p>}
          </div>
          {option.enabled && (
            <div className="option-choices-admin">

              <button
                type="button"
                className="add-choice-btn"
                onClick={() => {
                  const currentChoices = option.choices || [];
                  const newChoices = [...currentChoices, { name: '', priceModifier: 0, isDefault: false }];
                  setFormData({
                    ...formData,
                    options: {
                      ...formData.options,
                      [config.key]: {
                        ...option,
                        choices: newChoices
                      }
                    }
                  });
                }}
              >
                + Agregar Bebida
              </button>
              {(option.choices || []).map((choice, index) => {
                const currentChoices = option.choices || [];
                const isDefault = choice.isDefault || false;
                const hasDefault = currentChoices.some(c => c.isDefault);
                const defaultCount = currentChoices.filter(c => c.isDefault).length;
                const canUnsetDefault = !isDefault || defaultCount > 1;

                return (
                  <div key={index} className={`choice-row-admin ${isDefault ? 'default-choice-admin' : ''}`}>
                    <div className="choice-input-group">
                      <label className="input-label">Bebida / Marca:</label>
                      <input
                        type="text"
                        name={`options.${config.key}.${index}.name`}
                        value={choice.name || ''}
                        onChange={handleInputChange}
                        className="styled-input-compact"
                        placeholder="Ej: Coca Cola"
                      />
                    </div>
                    <div className="choice-input-group">
                      <label className="input-label">Precio Extra:</label>
                      <div className="price-modifier-controls">
                        <input
                          type="number"
                          name={`options.${config.key}.${index}.priceModifier`}
                          value={Math.abs(choice.priceModifier || 0)}
                          onChange={(e) => {
                            const absValue = Math.abs(parseFloat(e.target.value) || 0);
                            const isNegative = choice.priceModifier < 0;
                            handleInputChange({
                              target: {
                                name: `options.${config.key}.${index}.priceModifier`,
                                value: isNegative ? -absValue : absValue
                              }
                            });
                          }}
                          step="1"
                          min="0"
                          className="styled-input-compact price-input-small"
                          placeholder="0"
                          disabled={isDefault}
                        />
                        {!isDefault && (
                          <label className="modifier-type-toggle">
                            <input
                              type="checkbox"
                              checked={choice.priceModifier < 0}
                              onChange={(e) => {
                                const currentValue = Math.abs(choice.priceModifier || 0);
                                handleInputChange({
                                  target: {
                                    name: `options.${config.key}.${index}.priceModifier`,
                                    value: e.target.checked ? -currentValue : currentValue
                                  }
                                });
                              }}
                            />
                            <span>Restar</span>
                          </label>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`set-default-btn ${isDefault ? 'active' : ''}`}
                      onClick={() => {
                        const current = option.choices || [];
                        let newChoices;
                        if (isDefault && defaultCount === 1) {
                          // Permitir quitar la única por defecto para que se use "Ninguna" auto
                          newChoices = current.map((c, i) => ({
                            ...c,
                            isDefault: false
                          }));
                        } else {
                          newChoices = current.map((c, i) => ({
                            ...c,
                            isDefault: i === index
                          }));
                        }
                        setFormData({
                          ...formData,
                          options: {
                            ...formData.options,
                            [config.key]: {
                              ...option,
                              choices: newChoices
                            }
                          }
                        });
                      }}
                    >
                      {isDefault ? '✓ Principal' : 'Predeterminada'}
                    </button>
                    <button
                      type="button"
                      className="remove-choice-btn"
                      onClick={() => {
                        const currentChoices = option.choices || [];
                        if (isDefault && defaultCount === 1 && currentChoices.length > 1) {
                          // evitar dejar sin default al intentar borrar la única default
                          setNotification({ isOpen: true, message: 'Marca otra bebida como por defecto antes de eliminar esta.', type: 'error' });
                          return;
                        }
                        const newChoices = currentChoices.filter((_, i) => i !== index);
                        setFormData({
                          ...formData,
                          options: {
                            ...formData.options,
                            [config.key]: {
                              ...option,
                              choices: newChoices
                            }
                          }
                        });
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    } else if (config.type === 'custom') {
      return (
        <div className="option-config" key={config.key}>
          <div className="option-header">
            <label className="option-checkbox-label">
              <input
                type="checkbox"
                name={`options.${config.key}.enabled`}
                checked={option.enabled || false}
                onChange={handleInputChange}
              />
              <span className="option-title">{config.label}</span>
            </label>
            {config.help && <p className="option-help">{config.help}</p>}
          </div>
          {option.enabled && (
            <div className="option-choices-admin">

              <button
                type="button"
                className="add-choice-btn"
                onClick={() => {
                  const newChoices = [...(option.choices || []), { name: '', priceModifier: 0, isDefault: false }];
                  setFormData({
                    ...formData,
                    options: {
                      ...formData.options,
                      [config.key]: {
                        ...option,
                        choices: newChoices
                      }
                    }
                  });
                }}
              >
                + Agregar Opción
              </button>
              {(option.choices || []).map((choice, index) => {
                const currentChoices = option.choices || [];
                const isDefault = choice.isDefault || false;
                const hasDefault = currentChoices.some(c => c.isDefault) || false;
                const defaultCount = currentChoices.filter(c => c.isDefault).length;
                const canUnsetDefault = !isDefault || defaultCount > 1;

                return (
                  <div key={index} className={`choice-row-admin ${isDefault ? 'default-choice-admin' : ''}`}>
                    <div className="choice-input-group">
                      <label className="input-label">Nombre:</label>
                      <input
                        type="text"
                        name={`options.${config.key}.${index}.name`}
                        value={choice.name || ''}
                        onChange={handleInputChange}
                        className="styled-input-compact"
                        placeholder="Ej: Opción 1, etc."
                      />
                    </div>
                    <div className="choice-input-group">
                      <label className="input-label">Precio Extra:</label>
                      <div className="price-modifier-controls">
                        <input
                          type="number"
                          name={`options.${config.key}.${index}.priceModifier`}
                          value={Math.abs(choice.priceModifier || 0)}
                          onChange={(e) => {
                            const absValue = Math.abs(parseFloat(e.target.value) || 0);
                            const isNegative = choice.priceModifier < 0;
                            handleInputChange({
                              target: {
                                name: `options.${config.key}.${index}.priceModifier`,
                                value: isNegative ? -absValue : absValue
                              }
                            });
                          }}
                          step="1"
                          min="0"
                          className="styled-input-compact price-input-small"
                          placeholder="0"
                          disabled={isDefault}
                        />
                        {!isDefault && (
                          <label className="modifier-type-toggle">
                            <input
                              type="checkbox"
                              checked={choice.priceModifier < 0}
                              onChange={(e) => {
                                const currentValue = Math.abs(choice.priceModifier || 0);
                                handleInputChange({
                                  target: {
                                    name: `options.${config.key}.${index}.priceModifier`,
                                    value: e.target.checked ? -currentValue : currentValue
                                  }
                                });
                              }}
                            />
                            <span>Resta precio</span>
                          </label>
                        )}
                      </div>

                    </div>
                    <button
                      type="button"
                      className={`set-default-btn ${isDefault ? 'active' : ''}`}
                      onClick={() => {
                        const currentChoices = option.choices || [];
                        if (isDefault && defaultCount === 1) {
                          // Permitir quitar el default si es la única opción
                          const newChoices = currentChoices.map((c, i) => ({
                            ...c,
                            isDefault: false
                          }));
                          setFormData({
                            ...formData,
                            options: {
                              ...formData.options,
                              [config.key]: {
                                ...option,
                                choices: newChoices
                              }
                            }
                          });
                        } else {
                          const newChoices = currentChoices.map((c, i) => ({
                            ...c,
                            isDefault: i === index,
                            priceModifier: i === index ? 0 : c.priceModifier
                          }));
                          setFormData({
                            ...formData,
                            options: {
                              ...formData.options,
                              [config.key]: {
                                ...option,
                                choices: newChoices
                              }
                            }
                          });
                        }
                      }}
                    >
                      {isDefault ? '✓ Principal' : 'Predeterminada'}
                    </button>
                    <button
                      type="button"
                      className="remove-choice-btn"
                      onClick={() => {
                        const currentChoices = option.choices || [];
                        if (isDefault && defaultCount === 1 && currentChoices.length > 1) {
                          setNotification({ isOpen: true, message: 'No puedes eliminar la única opción marcada como por defecto. Marca otra como por defecto primero.', type: 'error' });
                          return;
                        }
                        const newChoices = currentChoices.filter((_, i) => i !== index);
                        setFormData({
                          ...formData,
                          options: {
                            ...formData.options,
                            [config.key]: {
                              ...option,
                              choices: newChoices
                            }
                          }
                        });
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const categoryOptions = getCategoryOptionsConfig(formData.category);
  const orderStatusOptions = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_preparacion', label: 'En preparación' },
    { value: 'listo', label: 'Listo' },
    { value: 'entregado', label: 'Entregado' },
  ];
  const categoryFilters = [
    { value: 'todas', label: 'Todas' },
    { value: 'hamburguesas', label: 'Hamburguesas' },
    { value: 'lomos', label: 'Lomos' },
    { value: 'pizzas', label: 'Pizzas' },
    { value: 'empanadas', label: 'Empanadas' }
  ];

  const filteredCount = filteredProducts.length;
  const totalPages = Math.ceil(filteredCount / productsPerPage) || 1;

  const renderProductCard = (product) => {
    const shortDescription = product.description.length > 90
      ? `${product.description.substring(0, 90)}...`
      : product.description;

    return (
      <div className="product-card" key={product._id}>
        <div className="card-media">
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <div className="card-placeholder">Sin imagen</div>
          )}
          <div className="card-badges">
            <span className={`badge ${product.published !== false ? 'badge-success' : 'badge-warning'}`}>
              {product.published !== false ? 'Visible' : 'Oculto'}
            </span>
            <span className={`badge ${product.sinStock ? 'badge-danger' : 'badge-neutral'}`}>
              {product.sinStock ? 'Sin stock' : 'Disponible'}
            </span>
          </div>
        </div>
        <div className="card-content">
          <div className="card-header">
            <div>
              <h3 className="card-title">{product.name}</h3>
              <span className="pill">{product.category}</span>
            </div>
            <span className="card-price">${product.price.toFixed(2)}</span>
          </div>
          <p className="card-description">{shortDescription}</p>
          <div className="card-stock">
            <label>Stock</label>
            <select
              value={product.sinStock ? 'sinStock' : 'disponible'}
              onChange={(e) => handleStockChange(product._id, e.target.value)}
              className="stock-select"
            >
              <option value="disponible">Disponible</option>
              <option value="sinStock">Sin stock</option>
            </select>
          </div>
          <div className="card-actions">
            <button
              onClick={() => handleEdit(product)}
              className="icon-btn btn-edit"
              title="Editar"
              aria-label="Editar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15.232 5.232a2.5 2.5 0 1 1 3.536 3.536L7.5 20H4v-3.5l11.232-11.268Z" />
              </svg>
            </button>
            <button
              onClick={() => handleTogglePublished(product)}
              className={`icon-btn ${(product.published !== false) ? 'btn-hide' : 'btn-show'}`}
              title={(product.published !== false) ? 'Ocultar producto' : 'Publicar producto'}
              aria-label={(product.published !== false) ? 'Ocultar producto' : 'Publicar producto'}
            >
              {product.published !== false ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 3 18 18M10.477 10.489A3 3 0 0 0 12 15c1.657 0 3-1.343 3-3 0-.53-.132-1.03-.365-1.468" />
                  <path d="M9.88 4.24A9.42 9.42 0 0 1 12 4c5.5 0 9 7 9 7a17.05 17.05 0 0 1-2.102 3.368M6.236 6.27C4.187 7.77 3 10 3 10s3.5 7 9 7c1.225 0 2.374-.273 3.43-.75" />
                </svg>
              )}
            </button>
            <button
              onClick={() => handleDelete(product._id)}
              className="icon-btn btn-delete"
              title="Eliminar"
              aria-label="Eliminar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M9 6v12m6-12v12M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Panel de Administración</h1>
        <div className="admin-actions">
          <button
            onClick={() => {
              setViewSection('products');
              setOrdersSidebarVisible(false);
            }}
            className={`btn-secondary ${viewSection === 'products' ? 'active-tab' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
            Publicaciones
          </button>
          <button
            onClick={() => {
              if (viewSection === 'products' && !ordersSidebarVisible) {
                setOrdersSidebarVisible(true);
              } else {
                setViewSection('orders');
              }
            }}
            className={`btn-secondary ${viewSection === 'orders' ? 'active-tab' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Pedidos
          </button>
          <button onClick={() => navigate('/')} className="btn-secondary btn-green">
            Ver Tienda
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
              // Guardar scroll antes de abrir nuevo formulario
              sessionStorage.setItem('adminScrollPosition', window.scrollY.toString());
            }}
            className="btn-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo Producto
          </button>
          <button onClick={handleLogout} className="btn-danger">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className={`admin-content ${viewSection === 'products' && ordersSidebarVisible ? 'with-sidebar' : ''}`}>
        {viewSection === 'orders' ? (
          <div className="orders-full">
            <div className="orders-toolbar">
              <form className="orders-search" onSubmit={async (e) => {
                e.preventDefault();
                const id = orderSearchTerm.trim();
                if (!id) return;
                setOrdersLoading(true);
                try {
                  const response = await orderService.getById(id);
                  const order = response.data;
                  // Verificar si el pedido ya existe en la lista
                  const exists = orders.some(o => o.orderId === order.orderId || o._id === order._id);
                  if (!exists) {
                    setOrders(prev => [order, ...prev]);
                    setNotification({ isOpen: true, message: 'Pedido agregado exitosamente', type: 'success' });
                  } else {
                    setNotification({ isOpen: true, message: 'Este pedido ya está en la lista', type: 'info' });
                  }
                  setOrderSearchTerm('');
                } catch (error) {
                  if (error.response?.status === 404) {
                    setNotification({ isOpen: true, message: 'Pedido no encontrado', type: 'error' });
                  } else {
                    setNotification({ isOpen: true, message: 'Error al buscar el pedido', type: 'error' });
                  }
                } finally {
                  setOrdersLoading(false);
                }
              }}>
                <input
                  type="text"
                  placeholder="Pegar ID de pedido..."
                  value={orderSearchTerm}
                  onChange={(e) => setOrderSearchTerm(e.target.value)}
                />
                <button type="submit" className="btn-primary">Buscar Pedido</button>
              </form>
              <div className="orders-filters-inline">
                {['todos', ...orderStatusOptions.map(s => s.value)].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`filter-chip ${orderStatusFilter === v ? 'active' : ''}`}
                    onClick={() => {
                      setOrderStatusFilter(v);
                      if (v === 'todos') {
                        // No hacer nada, mantener lista actual
                      } else {
                        // Filtrar lista actual por estado
                        setOrders(prev => prev.filter(o => o.status === v));
                      }
                    }}
                  >
                    {v === 'todos' ? 'Todos' : orderStatusOptions.find(o => o.value === v)?.label || v}
                  </button>
                ))}
              </div>
            </div>
            {ordersLoading ? (
              <div className="loading">Cargando pedidos...</div>
            ) : orders.length === 0 ? (
              <div className="no-orders">No hay pedidos</div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div className="order-card" key={order._id}>
                    <div className="order-card-header">
                      <div>
                        <div className="order-id">{order.orderId}</div>
                        <div className="order-date">{new Date(order.createdAt).toLocaleString()}</div>
                      </div>
                      <span className={`badge ${(() => {
                        switch (order.status) {
                          case 'pendiente': return 'badge-warning';
                          case 'en_preparacion': return 'badge-info';
                          case 'listo': return 'badge-success';
                          case 'entregado': return 'badge-neutral';
                          default: return 'badge-neutral';
                        }
                      })()}`}>{orderStatusOptions.find(o => o.value === order.status)?.label || order.status}</span>
                    </div>
                    <div className="order-summary">
                      <div>
                        <p className="label">Cliente</p>
                        <p className="value">{order.customer?.name || 'Sin nombre'}</p>
                      </div>
                      <div>
                        <p className="label">Entrega</p>
                        <p className="value">{order.customer?.deliveryType === 'domicilio' ? 'Envío a domicilio' : 'Retira en local'}</p>
                      </div>
                      <div>
                        <p className="label">Total</p>
                        <p className="value strong">${(order.total || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="label">Items</p>
                        <p className="value">{order.items?.length || 0}</p>
                      </div>
                    </div>
                    <div className="order-actions">
                      <select
                        value={order.status}
                        onChange={(e) => handleOrderStatusChange(order.orderId, e.target.value)}
                        className="status-select"
                      >
                        {orderStatusOptions.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setOrderExpanded(prev => prev === order._id ? null : order._id)}
                      >
                        {orderExpanded === order._id ? 'Ocultar detalles' : 'Ver detalles'}
                      </button>
                    </div>
                    {orderExpanded === order._id && (
                      <div className="order-details">
                        <div className="order-section">
                          <h4>Items</h4>
                          {(order.items || []).map((item, idx) => (
                            <div className="order-item" key={idx}>
                              <div className="item-head">
                                <span className="item-name">{item.name}</span>
                                <span className="item-qty">x{item.quantity}</span>
                                <span className="item-price">${item.price?.toFixed(2)}</span>
                              </div>
                              {item.options && item.options.length > 0 && (
                                <ul className="item-options">
                                  {item.options.map((opt, oIdx) => (
                                    <li key={oIdx}>
                                      <span>{opt.label}: {opt.value}</span>
                                      {opt.priceModifier ? (
                                        <span className="opt-price">
                                          {opt.priceModifier > 0 ? '+' : ''}${opt.priceModifier.toFixed(2)}
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
                          <p><strong>Tipo de entrega:</strong> {order.customer?.deliveryType === 'domicilio' ? 'Envío a domicilio' : 'Retira en local'}</p>
                          {order.customer?.deliveryType === 'domicilio' && (
                            <p><strong>Dirección:</strong> {order.customer?.address || 'Sin dirección'}</p>
                          )}
                          {order.customer?.note && <p><strong>Descripción/Nota:</strong> {order.customer.note}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="admin-layout">
            <div className="admin-main">


              {showForm && (
                <form onSubmit={handleSubmit} className="product-form-compact">
                  <div className="form-header-compact">
                    <h2>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                  </div>

                  <div className="form-two-columns">
                    <div className="form-column main-data">
                      <div className="form-group-compact">
                        <label>Nombre *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Ej: Hamburguesa Especial"
                        />
                      </div>

                      <div className="form-row-compact">
                        <div className="form-group-compact">
                          <label>Precio (ARS)</label>
                          <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            step="1"
                            min="0"
                            placeholder="0"
                          />
                        </div>
                        <div className="form-group-compact">
                          <label>Categoría</label>
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                          >
                            <option value="hamburguesas">Hamburguesas</option>
                            <option value="lomos">Lomos</option>
                            <option value="pizzas">Pizzas</option>
                            <option value="empanadas">Empanadas</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group-compact">
                        <label>Descripción</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows="3"
                          placeholder="Escribe una breve descripción..."
                        />
                      </div>

                      <div className="image-management-compact">
                        <label>Imagen del Producto</label>
                        <div className="image-inputs">
                          <input
                            type="url"
                            name="image"
                            value={formData.image && !formData.image.startsWith('data:') ? formData.image : ''}
                            onChange={handleInputChange}
                            placeholder="Pegar URL de la imagen..."
                            className="styled-input-compact"
                          />
                          <div className="file-upload-wrapper">
                            <label className="file-upload-btn">
                              <span>📁 Subir desde dispositivo</span>
                              <input
                                type="file"
                                name="imageFile"
                                accept="image/*"
                                onChange={handleInputChange}
                                style={{ display: 'none' }}
                              />
                            </label>
                          </div>
                        </div>

                        {imagePreview && (
                          <div className="image-preview-compact">
                            <p>Vista previa:</p>
                            <div className="preview-container">
                              <img src={imagePreview} alt="Preview" />
                              <button
                                type="button"
                                className="remove-preview"
                                onClick={() => {
                                  setImagePreview(null);
                                  setImageFile(null);
                                  setFormData({ ...formData, image: '' });
                                }}
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-column config-data">
                      {categoryOptions.length > 0 && (
                        <div className="options-section-compact">
                          <h3>Opciones del Menú ({formData.category})</h3>
                          <div className="options-scroll-area">
                            {categoryOptions.map(config => renderOptionField(config))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-actions-compact">
                    <button type="submit" className="btn-primary-compact">
                      {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                    <button type="button" onClick={resetForm} className="btn-secondary-compact">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              <div className="category-filters-wrapper">
                <div className="category-filters">
                  {categoryFilters.map((filter) => (
                    <button
                      key={filter.value}
                      className={`filter-chip ${selectedCategory === filter.value ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCategory(filter.value);
                        setCurrentPage(1);
                      }}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <div className="view-toggle">
                  <button
                    className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    Tabla
                  </button>
                  <button
                    className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setViewMode('cards')}
                  >
                    Publicaciones
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="loading">Cargando productos...</div>
              ) : (
                <div className="products-view">
                  {viewMode === 'table' ? (
                    <div className="products-table-container">
                      <div className="table-responsive">
                        <table className="products-table">
                          <thead>
                            <tr>
                              <th>Nombre</th>
                              <th className="col-description">Descripción</th>
                              <th>Precio</th>
                              <th>Categoría</th>
                              <th>Stock</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="no-products">
                                  {selectedCategory !== 'todas' ? 'No se encontraron productos con ese criterio.' : 'No hay productos. Crea uno nuevo.'}
                                </td>
                              </tr>
                            ) : (
                              products.map((product) => (
                                <tr key={product._id}>
                                  <td>{product.name}</td>
                                  <td className="description-cell col-description">
                                    {product.description.length > 50
                                      ? `${product.description.substring(0, 50)}...`
                                      : product.description}
                                  </td>
                                  <td>${product.price.toFixed(2)}</td>
                                  <td>{product.category}</td>
                                  <td>
                                    <select
                                      value={product.sinStock ? 'sinStock' : 'disponible'}
                                      onChange={(e) => handleStockChange(product._id, e.target.value)}
                                      className="stock-select"
                                    >
                                      <option value="disponible">Disponible</option>
                                      <option value="sinStock">Sin stock</option>
                                    </select>
                                  </td>
                                  <td>
                                    <div className="actions-buttons">
                                      <button
                                        onClick={() => handleEdit(product)}
                                        className="icon-btn btn-edit"
                                        title="Editar"
                                        aria-label="Editar"
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M15.232 5.232a2.5 2.5 0 1 1 3.536 3.536L7.5 20H4v-3.5l11.232-11.268Z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleTogglePublished(product)}
                                        className={`icon-btn ${(product.published !== false) ? 'btn-hide' : 'btn-show'}`}
                                        title={(product.published !== false) ? 'Ocultar producto' : 'Publicar producto'}
                                        aria-label={(product.published !== false) ? 'Ocultar producto' : 'Publicar producto'}
                                      >
                                        {product.published !== false ? (
                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
                                            <circle cx="12" cy="12" r="3" />
                                          </svg>
                                        ) : (
                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="m3 3 18 18M10.477 10.489A3 3 0 0 0 12 15c1.657 0 3-1.343 3-3 0-.53-.132-1.03-.365-1.468" />
                                            <path d="M9.88 4.24A9.42 9.42 0 0 1 12 4c5.5 0 9 7 9 7a17.05 17.05 0 0 1-2.102 3.368M6.236 6.27C4.187 7.77 3 10 3 10s3.5 7 9 7c1.225 0 2.374-.273 3.43-.75" />
                                          </svg>
                                        )}
                                      </button>
                                      <button
                                        onClick={() => handleDelete(product._id)}
                                        className="icon-btn btn-delete"
                                        title="Eliminar"
                                        aria-label="Eliminar"
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M3 6h18M9 6v12m6-12v12M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="products-cards-grid">
                      {products.length === 0 ? (
                        <div className="no-products-card">
                          {selectedCategory !== 'todas' ? 'No se encontraron productos con ese criterio.' : 'No hay productos. Crea uno nuevo.'}
                        </div>
                      ) : (
                        products.map((product) => renderProductCard(product))
                      )}
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                      >
                        ← Anterior
                      </button>
                      <span className="pagination-info">
                        Página {currentPage} de {totalPages} ({filteredCount} productos)
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                      >
                        Siguiente →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {ordersSidebarVisible && (
              <aside className="orders-panel">
                <div className="orders-panel-header">
                  <div>
                    <h3>Pedidos</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" onClick={() => setViewSection('orders')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                      </svg>
                      Expandir
                    </button>
                    <button className="btn-secondary icon-btn-close" onClick={() => {
                      setOrdersSidebarVisible(false);
                      setViewSection('products');
                    }} title="Cerrar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <form className="orders-search" onSubmit={async (e) => {
                  e.preventDefault();
                  const id = orderSearchTerm.trim();
                  if (!id) return;
                  setOrdersLoading(true);
                  try {
                    const response = await orderService.getById(id);
                    const order = response.data;
                    // Verificar si el pedido ya existe en la lista
                    const exists = orders.some(o => o.orderId === order.orderId || o._id === order._id);
                    if (!exists) {
                      setOrders(prev => [order, ...prev]);
                      setNotification({ isOpen: true, message: 'Pedido agregado exitosamente', type: 'success' });
                    } else {
                      setNotification({ isOpen: true, message: 'Este pedido ya está en la lista', type: 'info' });
                    }
                    setOrderSearchTerm('');
                  } catch (error) {
                    if (error.response?.status === 404) {
                      setNotification({ isOpen: true, message: 'Pedido no encontrado', type: 'error' });
                    } else {
                      setNotification({ isOpen: true, message: 'Error al buscar el pedido', type: 'error' });
                    }
                  } finally {
                    setOrdersLoading(false);
                  }
                }}>
                  <input
                    type="text"
                    placeholder="Pegar ID de pedido..."
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                  />
                  <button type="submit" className="btn-primary">Buscar Pedido</button>
                </form>
                <div className="orders-filters-inline compact">
                  {['todos', ...orderStatusOptions.map(s => s.value)].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`filter-chip ${orderStatusFilter === v ? 'active' : ''}`}
                      onClick={() => { setOrderStatusFilter(v); loadOrders({ status: v !== 'todos' ? v : undefined }); }}
                    >
                      {v === 'todos' ? 'Todos' : orderStatusOptions.find(o => o.value === v)?.label || v}
                    </button>
                  ))}
                </div>
                <div className="orders-mini-list">
                  {ordersLoading ? (
                    <div className="loading small">Esperando pedidos...</div>
                  ) : orders.length === 0 ? (
                    <div className="no-orders small">Sin pedidos</div>
                  ) : (
                    orders.slice(0, 6).map(order => (
                      <div className="mini-order" key={order._id}>
                        <div className="mini-order-row">
                          <span className="mini-order-id">{order.orderId}</span>
                          <span className={`badge ${(() => {
                            switch (order.status) {
                              case 'pendiente': return 'badge-warning';
                              case 'en_preparacion': return 'badge-info';
                              case 'listo': return 'badge-success';
                              case 'entregado': return 'badge-neutral';
                              default: return 'badge-neutral';
                            }
                          })()}`}>{orderStatusOptions.find(o => o.value === order.status)?.label || order.status}</span>
                        </div>
                        <div className="mini-order-row spaced">
                          <span>{order.customer?.name || 'Sin nombre'}</span>
                          <strong>${(order.total || 0).toFixed(2)}</strong>
                        </div>
                        <button
                          type="button"
                          className="btn-secondary inline"
                          onClick={() => {
                            setViewSection('orders');
                            setOrderExpanded(order._id);
                          }}
                        >
                          Ver detalle
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </aside>
            )}
          </div>
        )}
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, isOpen: false })}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        title="Confirmar acción"
        onConfirm={confirmModal.onConfirm || (() => { })}
        onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default AdminPanel;