import { useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Página no encontrada</h2>
        <p>Lo sentimos, el plato que buscas no está en nuestro menú.</p>
        <button onClick={() => navigate('/')} className="back-home-btn">
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default NotFound;
