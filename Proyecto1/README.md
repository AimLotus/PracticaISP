# Sistema de Gestión para Microempresas - Backend

Este proyecto es el backend (API) del sistema, desarrollado en Laravel (PHP). Utiliza PostgreSQL como base de datos, contenerizada con Docker.

## Requisitos Previos

-   [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y ejecutándose.
-   [PHP](https://www.php.net/) 8.2 o superior instalado localmente.
-   [Composer](https://getcomposer.org/) instalado.

## 1. Configuración de Base de Datos (Docker)

La base de datos PostgreSQL se ejecuta dentro de un contenedor Docker para facilitar el desarrollo.

### Levantar la Base de Datos

En la raíz del proyecto (donde está `docker-compose.yml`), ejecuta:

```bash
docker-compose up -d
```

Esto iniciará los servicios:

-   **PostgreSQL**: Puerto `5432`.
-   **pgAdmin** (Interfaz Web): Puerto `5050`.

### Credenciales de Base de Datos

Definidas en `docker-compose.yml`:

-   **Host**: `127.0.0.1` (localhost)
-   **Puerto**: `5432`
-   **Base de Datos**: `proyecto`
-   **Usuario**: `postgres`
-   **Contraseña**: `23072003`

### Acceso a pgAdmin

Puedes administrar la base de datos visualmente en: http://localhost:5050

-   **Email**: `admin@proyecto.com`
-   **Password**: `admin123`

---

## 2. Configuración del Backend (Laravel)

### Paso 1: Variables de Entorno

Copia el archivo de ejemplo y crea tu archivo `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` y asegúrate de configurar la conexión a la base de datos para que coincida con Docker:

```ini
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=proyecto
DB_USERNAME=postgres
DB_PASSWORD=23072003
```

### Paso 2: Instalar Dependencias

Instala las dependencias de PHP con Composer:

```bash
composer install
```

### Paso 3: Generar Clave de Aplicación

```bash
php artisan key:generate
```

### Paso 4: Migraciones y Datos de Prueba

Una vez que Docker esté corriendo, ejecuta las migraciones para crear las tablas y poblar la base de datos:

```bash
php artisan migrate --seed
```

### Paso 5: Iniciar el Servidor de Desarrollo

Levanta el servidor local de Laravel:

```bash
php artisan serve
```

El API estará disponible en: http://localhost:8000

---

## Comandos Útiles

-   **Detener contenedores**: `docker-compose down`
-   **Ver logs de contenedores**: `docker-compose logs -f`
-   **Reiniciar contenedores**: `docker-compose restart`
-   **Limpiar caché de Laravel**: `php artisan optimize:clear`
