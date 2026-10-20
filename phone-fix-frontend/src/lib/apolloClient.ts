import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// URL del backend GraphQL obtenida dinámicamente de las variables de entorno
// Si se accede desde un dispositivo móvil en la misma red Wi-Fi, resuelve dinámicamente la IP del host
const getApiUri = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/graphql/';
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    if (currentHost && currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      try {
        const parsed = new URL(envUrl);
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          parsed.hostname = currentHost;
          return parsed.toString();
        }
      } catch {
        return `http://${currentHost}:8000/graphql/`;
      }
    }
  }
  return envUrl;
};

const httpLink = createHttpLink({
  uri: getApiUri(),
});

// Link de autenticación para inyectar el JWT en cada petición
const authLink = setContext((_, { headers }) => {
  // Obtenemos el token almacenado
  const token = localStorage.getItem('jwt_token');
  
  // Retornamos los headers con la autorización, manteniendo otros si existen
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

// Inicializamos el cliente
export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});
