# Usar imagen oficial de Python
FROM python:3.11-slim

# Variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Configuración de directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias
# gcc y libpq-dev son frecuentemente necesarios para psycopg2
RUN apt-get update \
    && apt-get install -y gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copiamos el resto del código
COPY . /app/

# Exponemos el puerto de Django
EXPOSE 8000
