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
            <h3>📍 Ubicación</h3>
            <p>Av. Principal 123</p>
            <p>Ciudad, Estado 12345</p>
          </div>
          <div className="info-card">
            <h3>🕒 Horarios</h3>
            <p>Lun - Vie: 11:00 AM - 10:00 PM</p>
            <p>Sáb - Dom: 12:00 PM - 11:00 PM</p>
          </div>
          <div className="info-card">
            <h3>📞 Contacto</h3>
            <p>Tel: (555) 123-4567</p>
            <p>Email: contacto@deliciasexpress.com</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

