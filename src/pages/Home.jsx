import { useState, useEffect } from 'react';
import { productService } from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductDetail from '../components/ProductDetail';
import Cart from '../components/Cart';
import SearchBar from '../components/SearchBar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import About from '../components/About';
import './Home.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
  });
  const [sortOrder, setSortOrder] = useState('');

  useEffect(() => {
    loadProducts();
  }, [filters, sortOrder]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;

      const response = await productService.getAll(params);
      let sortedProducts = [...response.data];
      
      if (sortOrder === 'asc') {
        sortedProducts.sort((a, b) => a.price - b.price);
      } else if (sortOrder === 'desc') {
        sortedProducts.sort((a, b) => b.price - a.price);
      }
      
      setProducts(sortedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm) => {
    setFilters({ ...filters, search: searchTerm });
  };

  const handleFilterChange = (key, value) => {
    if (key === 'reset') {
      setFilters({
        search: '',
        category: '',
        minPrice: '',
        maxPrice: '',
      });
      setSortOrder('');
    } else {
      setFilters({ ...filters, [key]: value });
    }
  };

  const handleSortChange = (order) => {
    setSortOrder(order);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const handleAddToCart = (productWithOptions) => {
    const existingItemIndex = cart.findIndex(
      item => item._id === productWithOptions._id &&
      JSON.stringify(item.selectedOptions) === JSON.stringify(productWithOptions.selectedOptions)
    );

    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { ...productWithOptions, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(index);
      return;
    }
    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    setCart(newCart);
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="home">
      <Navbar cartItemCount={cartItemCount} onCartClick={() => setCartOpen(true)} />
      <Hero />
      
      <section className="menu-section" id="menu">
        <div className="container">
          <h2 className="section-title">Nuestro Menú</h2>
          <p className="section-subtitle">Explora nuestra deliciosa selección</p>

          <SearchBar
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            filters={filters}
            onSortChange={handleSortChange}
            sortOrder={sortOrder}
          />

          {loading ? (
            <div className="loading">Cargando productos...</div>
          ) : products.length === 0 ? (
            <div className="no-products">
              <p>No se encontraron productos</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  onClick={handleProductClick}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <About />
      <Footer />
      
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
      
      <Cart
        cart={cart}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
      />
    </div>
  );
};

export default Home;
