// Configuración de opciones por categoría
export const getDefaultOptionsForCategory = (category) => {
  const optionsMap = {
    hamburguesas: {
      conPapas: { 
        enabled: false, 
        choices: [
          { name: 'Con papas', priceModifier: 0, isDefault: true },
          { name: 'Sin papas', priceModifier: 0, isDefault: false }
        ]
      },
      tipo: { 
        enabled: false, 
        defaultChoice: 0,
        choices: [
          { name: 'Clásica', priceModifier: 0, isDefault: true }, 
          { name: 'Completa', priceModifier: 0, isDefault: false }
        ] 
      },
      bebida: {
        enabled: false,
        choices: []
      }
    },
    lomos: {
      conPapas: { 
        enabled: false, 
        choices: [
          { name: 'Sin papas', priceModifier: 0, isDefault: true },
          { name: 'Con papas', priceModifier: 0, isDefault: false }
        ]
      },
      tamaño: { 
        enabled: false, 
        choices: [
          { name: 'Simple', priceModifier: 0, isDefault: true }, 
          { name: 'Completo', priceModifier: 0, isDefault: false }
        ] 
      }
    },
    pizzas: {
      porcion: { 
        enabled: false,
        defaultChoice: 0,
        choices: [
          { name: 'Completa', priceModifier: 0, isDefault: true },
          { name: 'Mitad', priceModifier: 0, isDefault: false }
        ] 
      },
      bebida: {
        enabled: false,
        choices: [
          { name: 'Sin bebida', priceModifier: 0, isDefault: true },
          { name: 'Coca Cola', priceModifier: 0 },
          { name: 'Sprite', priceModifier: 0 },
          { name: 'Agua', priceModifier: 0 },
          { name: 'Jugo', priceModifier: 0 }
        ]
      }
    },
    empanadas: {
      cantidad: { 
        enabled: false, 
        choices: [
          { name: 'Unidad', priceModifier: 0, isDefault: false },
          { name: 'Media docena', priceModifier: 0, isDefault: false },
          { name: 'Docena', priceModifier: 0, isDefault: true }
        ] 
      }
    },
    tacos: {
      cantidad: { 
        enabled: false, 
        choices: [
          { name: '1 unidad', priceModifier: 0 },
          { name: '2 unidades', priceModifier: 0 },
          { name: '3 unidades', priceModifier: 0 }
        ] 
      }
    },
    burritos: {
      tamaño: { 
        enabled: false, 
        choices: [
          { name: 'Regular', priceModifier: 0 },
          { name: 'Grande', priceModifier: 0 }
        ] 
      }
    },
    ensaladas: {
      tamaño: { 
        enabled: false, 
        choices: [
          { name: 'Individual', priceModifier: 0 },
          { name: 'Familiar', priceModifier: 0 }
        ] 
      }
    },
    aperitivos: {},
    bebidas: {
      tamaño: { 
        enabled: false, 
        choices: [
          { name: 'Chica', priceModifier: 0 },
          { name: 'Mediana', priceModifier: 0 },
          { name: 'Grande', priceModifier: 0 }
        ] 
      }
    }
  };

  // Agregar opciones comunes a todas las categorías
  const commonOptions = {
    bebida: {
      enabled: false,
      choices: []
    },
    personalizada: {
      enabled: false,
      choices: []
    }
  };

  return { ...optionsMap[category], ...commonOptions } || commonOptions;
};

export const getCategoryOptionsConfig = (category) => {
  const configMap = {
    hamburguesas: [
      { key: 'conPapas', label: 'Con/Sin papas', type: 'choices', requiresDefault: true },
      { key: 'tipo', label: 'Tipo (Clásica/Completa)', type: 'choices', requiresDefault: true },
      { key: 'bebida', label: 'Bebida opcional', type: 'bebida', help: 'Permite agregar bebida al pedido. Puedes agregar las bebidas que quieras con sus precios.', requiresDefault: false },
      { key: 'personalizada', label: 'Opción Personalizada', type: 'custom', help: 'Crea opciones completamente personalizadas. Puedes agregar o eliminar opciones y marcar una como por defecto.', requiresDefault: false }
    ],
    lomos: [
      { key: 'conPapas', label: 'Con/Sin papas', type: 'choices', requiresDefault: true },
      { key: 'tamaño', label: 'Tamaño (Simple/Completo)', type: 'choices', requiresDefault: true },
      { key: 'bebida', label: 'Bebida opcional', type: 'bebida', help: 'Permite agregar bebida al pedido. Puedes agregar las bebidas que quieras con sus precios.', requiresDefault: false },
      { key: 'personalizada', label: 'Opción Personalizada', type: 'custom', help: 'Crea opciones completamente personalizadas. Puedes agregar o eliminar opciones y marcar una como por defecto.', requiresDefault: false }
    ],
    pizzas: [
      { key: 'porcion', label: 'Porción (Completa/Mitad)', type: 'choices', requiresDefault: true },
      { key: 'bebida', label: 'Bebida opcional', type: 'bebida', help: 'Permite agregar bebida al pedido. Puedes agregar las bebidas que quieras con sus precios.', requiresDefault: false },
      { key: 'personalizada', label: 'Opción Personalizada', type: 'custom', help: 'Crea opciones completamente personalizadas. Puedes agregar o eliminar opciones y marcar una como por defecto.', requiresDefault: false }
    ],
    empanadas: [
      { key: 'cantidad', label: 'Cantidad', type: 'choices', requiresDefault: true },
      { key: 'bebida', label: 'Bebida opcional', type: 'bebida', help: 'Permite agregar bebida al pedido. Puedes agregar las bebidas que quieras con sus precios.', requiresDefault: false },
      { key: 'personalizada', label: 'Opción Personalizada', type: 'custom', help: 'Crea opciones completamente personalizadas. Puedes agregar o eliminar opciones y marcar una como por defecto.', requiresDefault: false }
    ],
    tacos: [
      { key: 'cantidad', label: 'Cantidad', type: 'choices', requiresDefault: true },
      { key: 'bebida', label: 'Bebida opcional', type: 'bebida', help: 'Permite agregar bebida al pedido. Puedes agregar las bebidas que quieras con sus precios.', requiresDefault: false },
      { key: 'personalizada', label: 'Opción Personalizada', type: 'custom', help: 'Crea opciones completamente personalizadas. Puedes agregar o eliminar opciones y marcar una como por defecto.', requiresDefault: false }
    ],
    burritos: [
      { key: 'tamaño', label: 'Tamaño (Regular/Grande)', type: 'choices', requiresDefault: true },
      { key: 'bebida', label: 'Bebida opcional', type: 'bebida', help: 'Permite agregar bebida al pedido. Puedes agregar las bebidas que quieras con sus precios.', requiresDefault: false },
      { key: 'personalizada', label: 'Opción Personalizada', type: 'custom', help: 'Crea opciones completamente personalizadas. Puedes agregar o eliminar opciones y marcar una como por defecto.', requiresDefault: false }
    ],
    ensaladas: [
      { key: 'tamaño', label: 'Tamaño (Individual/Familiar)', type: 'choices', requiresDefault: true },
      { key: 'bebida', label: 'Bebida opcional', type: 'bebida', help: 'Permite agregar bebida al pedido. Puedes agregar las bebidas que quieras con sus precios.', requiresDefault: false },
      { key: 'personalizada', label: 'Opción Personalizada', type: 'custom', help: 'Crea opciones completamente personalizadas. Puedes agregar o eliminar opciones y marcar una como por defecto.', requiresDefault: false }
    ],
    aperitivos: [
      { key: 'bebida', label: 'Bebida opcional', type: 'bebida', help: 'Permite agregar bebida al pedido. Puedes agregar las bebidas que quieras con sus precios.', requiresDefault: false },
      { key: 'personalizada', label: 'Opción Personalizada', type: 'custom', help: 'Crea opciones completamente personalizadas. Puedes agregar o eliminar opciones y marcar una como por defecto.', requiresDefault: false }
    ],
    bebidas: [
      { key: 'tamaño', label: 'Tamaño (Chica/Mediana/Grande)', type: 'choices', requiresDefault: true },
      { key: 'personalizada', label: 'Opción Personalizada', type: 'custom', help: 'Crea opciones completamente personalizadas. Puedes agregar o eliminar opciones y marcar una como por defecto.', requiresDefault: false }
    ]
  };

  return configMap[category] || [];
};

