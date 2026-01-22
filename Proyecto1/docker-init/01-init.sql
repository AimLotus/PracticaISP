-- Script de inicialización opcional para PostgreSQL
-- Este script se ejecuta automáticamente cuando se crea el contenedor por primera vez

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone
SET timezone = 'America/Guayaquil';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Base de datos inicializada correctamente';
END $$;
