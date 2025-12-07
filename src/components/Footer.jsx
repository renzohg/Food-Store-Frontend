import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>🍔 Delicias Express</h3>
          <p>Tu restaurante de comida rápida favorito. Servimos los mejores sabores desde 2020.</p>
        </div>
        
        <div className="footer-section">
          <h4>Horarios</h4>
          <p>Lunes - Viernes: 11:00 AM - 10:00 PM</p>
          <p>Sábado - Domingo: 12:00 PM - 11:00 PM</p>
        </div>
        
        <div className="footer-section">
          <h4>Contacto</h4>
          <p>📞 (555) 123-4567</p>
          <p>✉️ contacto@deliciasexpress.com</p>
          <p>📍 Av. Principal 123, Ciudad</p>
        </div>
        
        <div className="footer-section">
          <h4>Síguenos</h4>
          <div className="social-links">
            <a href="#" aria-label="Facebook">Facebook</a>
            <a href="#" aria-label="Instagram">Instagram</a>
            <a href="#" aria-label="Twitter">Twitter</a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 Delicias Express. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;

