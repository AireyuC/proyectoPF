FROM node:20-alpine

WORKDIR /app

# Copia los archivos de configuración
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia el resto del código
COPY . .

# Expone el puerto por defecto de Vite
EXPOSE 5173

# Arranca Vite en modo desarrollo, aceptando conexiones externas
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
