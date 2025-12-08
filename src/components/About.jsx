import './About.css';

const About = () => {
  return (
    <section className="about" id="nosotros">
      <div className="about-container">
        <div className="about-content">
          <h2>Sobre Nosotros</h2>
          <p>
            En Delicias Express, nos dedicamos a ofrecer comida rápida de calidad 
            con ingredientes frescos y sabores auténticos. Nuestra pasión por la 
            cocina se refleja en cada plato que preparamos.
          </p>
          <p>
            Desde nuestras hamburguesas jugosas hasta nuestras pizzas artesanales, 
            cada receta ha sido cuidadosamente elaborada para brindarte una 
            experiencia gastronómica única.
          </p>
        </div>
        <div className="about-info">
          <div className="info-card">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '8px'}}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Ubicación
            </h3>
            <p>Av. Principal 123</p>
            <p>Ciudad, Estado 12345</p>
          </div>
          <div className="info-card">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '8px'}}>
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Horarios
            </h3>
            <p>Lun - Vie: 11:00 AM - 10:00 PM</p>
            <p>Sáb - Dom: 12:00 PM - 11:00 PM</p>
          </div>
          <div className="info-card">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '8px'}}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Contacto
            </h3>
            <p>Tel: (555) 123-4567</p>
            <p>Email: contacto@deliciasexpress.com</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

