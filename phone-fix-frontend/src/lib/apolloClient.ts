import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// URL del backend GraphQL
const httpLink = createHttpLink({
  // Descomenta la siguiente línea para trabajar de manera Local:
  // uri: 'http://localhost:8000/graphql/',
  
  // IP del Servidor Desplegado:
  uri: 'http://95.111.245.9:8000/graphql/',
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
  }
});

// Inicializamos el cliente
export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});
