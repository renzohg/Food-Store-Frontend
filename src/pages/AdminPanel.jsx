import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: 'hamburguesas',
    sinStock: false,
    published: true,
    options: getDefaultOptionsForCategory('hamburguesas')
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadProducts();
  }, [navigate]);

  const loadProducts = async (preserveScroll = false) => {
    try {
      const scrollPosition = preserveScroll ? window.scrollY : null;
      setLoading(true);
      const response = await productService.getAll({ admin: 'true' });
      setAllProducts(response.data);
      if (preserveScroll && scrollPosition !== null) {
        setTimeout(() => {
          window.scrollTo(0, scrollPosition);
        }, 0);
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

  // Filtrar productos según búsqueda
  useEffect(() => {
    let filtered = [...allProducts];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = allProducts.filter(product => 
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.price.toString().includes(term)
      );
    }
    
    // Paginación
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    setProducts(filtered.slice(startIndex, endIndex));
    
    // Resetear página si no hay resultados en la página actual
    if (filtered.length > 0 && startIndex >= filtered.length) {
      setCurrentPage(1);
    }
  }, [allProducts, searchTerm, currentPage, productsPerPage]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
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
                [field]: parseFloat(value) || 0
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
          [field]: field === 'priceModifier' ? (parseFloat(value) || 0) : value
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
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Preparar TODAS las opciones que están en formData.options
      const processedOptions = {};
      
      // Procesar todas las opciones del formulario
      Object.keys(formData.options || {}).forEach(key => {
        const option = formData.options[key];
        if (!option) return;
        
        // Si tiene choices (choices, bebida, custom, etc.)
        if (option.choices && Array.isArray(option.choices)) {
          const validChoices = option.choices
            .filter(c => c && c.name && c.name.trim() !== '') // Solo guardar choices con nombre válido
            .map(c => ({
              name: c.name.trim(),
              priceModifier: parseFloat(c.priceModifier) || 0,
              isDefault: c.isDefault || false
            }));
          
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
        price: parseFloat(formData.price),
        image: formData.image,
        category: formData.category,
        sinStock: formData.sinStock,
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
      loadProducts();
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
      setNotification({ isOpen: true, message: error.response?.data?.message || 'Error al guardar el producto', type: 'error' });
    }
  };

  const handleEdit = (product) => {
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
            mergedOptions[key] = {
              enabled: savedOption.enabled !== undefined ? savedOption.enabled : false,
              choices: savedOption.choices.map(c => ({
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
      description: product.description,
      price: product.price.toString(),
      image: product.image || '',
      category: product.category || 'hamburguesas',
      sinStock: product.sinStock || false,
      published: product.published !== undefined ? product.published : true,
      options: mergedOptions
    });
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
    setFormData({
      name: '',
      description: '',
      price: '',
      image: '',
      category: 'hamburguesas',
      sinStock: false,
      published: true,
      options: getDefaultOptionsForCategory('hamburguesas')
    });
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
                  value={Math.abs(option.priceModifier || 0)}
                  onChange={(e) => {
                    const absValue = Math.abs(parseFloat(e.target.value) || 0);
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Esta opción requiere que al menos una opción esté marcada como "Por defecto"
              </p>
            )}
          </div>
          {option.enabled && (
            <div className="option-choices-admin">
              {requiresDefault && (
                <p className="choices-instruction">Marca una opción como "Por defecto". Siempre debe haber al menos una marcada como por defecto.</p>
              )}
              {(option.choices || []).map((choice, index) => {
                const isDefault = choice.isDefault || false;
                const canUnsetDefault = requiresDefault && hasDefault && option.choices.filter(c => c.isDefault).length > 1;
                
                return (
                  <div key={index} className={`choice-row-admin ${isDefault ? 'default-choice-admin' : ''}`}>
                    <div className="choice-input-group">
                      <label className="input-label">
                        Nombre de la opción:
                      </label>
                      <input
                        type="text"
                        name={`options.${config.key}.${index}.name`}
                        value={choice.name || ''}
                        onChange={handleInputChange}
                        className="styled-input"
                        placeholder="Ej: Clásica, Completa, etc."
                      />
                    </div>
                    <div className="choice-input-group">
                      <label className="input-label">
                        Valor del modificador (ARS):
                        {isDefault && <span className="default-indicator"> (Por defecto - dejar en 0)</span>}
                      </label>
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
                          className="styled-input"
                          placeholder="0.00"
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
                      {!isDefault && (
                        <p className="input-hint">
                          {choice.priceModifier < 0 
                            ? `Esta opción RESTARÁ $${Math.abs(choice.priceModifier || 0).toFixed(2)} al precio`
                            : `Esta opción SUMARÁ $${Math.abs(choice.priceModifier || 0).toFixed(2)} al precio`}
                        </p>
                      )}
                    </div>
                    {requiresDefault && (
                      <button
                        type="button"
                        className="set-default-btn"
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
                        {isDefault ? (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Por defecto
                          </>
                        ) : 'Marcar como por defecto'}
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
              <p className="choices-instruction">Agrega las bebidas que quieras. No es obligatorio tener una por defecto.</p>
              <button
                type="button"
                className="add-choice-btn"
                onClick={() => {
                  const currentChoices = option.choices || [];
                  const newChoices = [...currentChoices, { name: '', priceModifier: 0 }];
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
              {(option.choices || []).map((choice, index) => (
                <div key={index} className="choice-row-admin">
                  <div className="choice-input-group">
                    <label className="input-label">Nombre de la bebida:</label>
                    <input
                      type="text"
                      name={`options.${config.key}.${index}.name`}
                      value={choice.name || ''}
                      onChange={handleInputChange}
                      className="styled-input"
                      placeholder="Ej: Coca Cola, Agua, etc."
                    />
                  </div>
                  <div className="choice-input-group">
                    <label className="input-label">Precio (ARS):</label>
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
                        className="styled-input"
                        placeholder="0.00"
                      />
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
                        <span>Resta</span>
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="remove-choice-btn"
                    onClick={() => {
                      const currentChoices = option.choices || [];
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}
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
              <p className="choices-instruction">Crea opciones personalizadas. Puedes marcar una como por defecto (opcional).</p>
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
                      <label className="input-label">Nombre de la opción:</label>
                      <input
                        type="text"
                        name={`options.${config.key}.${index}.name`}
                        value={choice.name || ''}
                        onChange={handleInputChange}
                        className="styled-input"
                        placeholder="Ej: Opción 1, etc."
                      />
                    </div>
                    <div className="choice-input-group">
                      <label className="input-label">
                        Valor del modificador (ARS):
                        {isDefault && <span className="default-indicator"> (Por defecto)</span>}
                      </label>
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
                          className="styled-input"
                          placeholder="0.00"
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
                      {!isDefault && (
                        <p className="input-hint">
                          {choice.priceModifier < 0 
                            ? `Esta opción RESTARÁ $${Math.abs(choice.priceModifier || 0).toFixed(2)} al precio`
                            : `Esta opción SUMARÁ $${Math.abs(choice.priceModifier || 0).toFixed(2)} al precio`}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="set-default-btn"
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
                      {isDefault ? '✓ Por defecto' : 'Marcar como por defecto'}
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
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
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

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Panel de Administración</h1>
        <div className="admin-actions">
          <button onClick={() => navigate('/')} className="btn-secondary">
            Ver Tienda
          </button>
          <button onClick={handleLogout} className="btn-danger">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-toolbar">
          <button 
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }} 
            className="btn-primary"
          >
            {showForm ? 'Cancelar' : 'Nuevo Producto'}
          </button>
        </div>
        
        <div className="admin-search-bar">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o precio..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-search-input"
          />
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="product-form">
            <h2>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio (ARS) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Descripción *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
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
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="sinStock"
                    checked={formData.sinStock}
                    onChange={handleInputChange}
                  />
                  Sin stock
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>URL de Imagen</label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            {categoryOptions.length > 0 && (
              <div className="options-section">
                <div className="options-header">
                  <h3>Opciones Configurables ({formData.category})</h3>
                  <button
                    type="button"
                    className="accordion-toggle"
                    onClick={() => setOptionsExpanded(!optionsExpanded)}
                  >
                    {optionsExpanded ? '▼ Ocultar' : '▶ Mostrar'}
                  </button>
                </div>
                {optionsExpanded && (
                  <div className="options-content">
                    {categoryOptions.map(config => renderOptionField(config))}
                  </div>
                )}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingProduct ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="loading">Cargando productos...</div>
        ) : (
          <div className="products-table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
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
                      {searchTerm ? 'No se encontraron productos con ese criterio de búsqueda.' : 'No hay productos. Crea uno nuevo.'}
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td className="description-cell">
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
                            className="btn-edit"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleTogglePublished(product)}
                            className={(product.published !== false) ? 'btn-hide' : 'btn-show'}
                            title={(product.published !== false) ? 'Ocultar producto' : 'Publicar producto'}
                          >
                            {(product.published !== false) ? 'Ocultar' : 'Mostrar'}
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="btn-delete"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Paginación */}
            {(() => {
              const filteredCount = searchTerm.trim() 
                ? allProducts.filter(product => 
                    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.price.toString().includes(searchTerm)
                  ).length
                : allProducts.length;
              const totalPages = Math.ceil(filteredCount / productsPerPage);
              
              if (totalPages <= 1) return null;
              
              return (
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
              );
            })()}
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
        onConfirm={confirmModal.onConfirm || (() => {})}
        onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default AdminPanel;
