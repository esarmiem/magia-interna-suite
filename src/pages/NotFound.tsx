import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
      <img src="/black-cat.png" alt="Crystal Ball" className="w-12 h-12 mx-auto mb-6 animate-fade-in" />
        <h1 className="text-4xl font-bold mb-4 animate-fade-in">404</h1>
        <p className="text-xl text-gray-600 mb-4 animate-fade-in">Oops! Pagina no encontrada</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline animate-fade-in">
          Regresa al inicio
        </a>
      </div>
    </div>
  );
};

export default NotFound;
