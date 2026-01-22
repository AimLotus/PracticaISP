# 🔐 Credenciales de Acceso - miApp Web

## 👤 Usuarios de Prueba por Rol

### 👔 Usuario Administrador

- **Correo:** `admin@hotmail.com`
- **Contraseña:** `admin1`
- **Rol:** Administrador (Acceso completo al sistema)
- **Módulo:** Panel de Administración

### 🛒 Usuario de Ventas

- **Correo:** `ventas@hotmail.com`
- **Contraseña:** `ventas123`
- **Rol:** Ventas
- **Módulo:** Registro de ventas, clientes, historial

### 📦 Usuario de Dueno

- **Correo:** `dueno@hotmail.com`
- **Contraseña:** `dueno123`
- **Rol:** Dueno
- **Módulo:** Registro de compras, proveedores, historial

### 📊 Usuario de Inventario

- **Correo:** `inventario@hotmail.com`
- **Contraseña:** `inventario123`
- **Rol:** Inventario
- **Módulo:** Gestión de productos, movimientos, stock

---

## � Tabla Resumen de Usuarios

| Rol              | Email                    | Contraseña      | Acceso                  |
| ---------------- | ------------------------ | --------------- | ----------------------- |
| 👔 Administrador | `admin@hotmail.com`      | `admin1`        | Panel de Administración |
| 🛒 Ventas        | `ventas@hotmail.com`     | `ventas123`     | Módulo de Ventas        |
| 📦 Dueno         | `dueno@hotmail.com`      | `dueno123`      | Módulo de Compras       |
| 📊 Inventario    | `inventario@hotmail.com` | `inventario123` | Módulo de Inventario    |

---

## �🚀 Cómo Usar

1. **Asegúrate que el backend esté corriendo:**

   ```bash
   cd C:\Users\Lotus\Desktop\Tesis\Proyecto1
   php artisan serve
   ```

2. **La aplicación web ya está corriendo en:**
   http://localhost:3000

3. **Iniciar sesión:**
   - Abrir http://localhost:3000
   - Ingresar email: `admin@hotmail.com`
   - Ingresar contraseña: `admin1`
   - Click en "Iniciar sesión"

---

## 📋 Sistema de Roles

El sistema tiene 4 roles, cada uno con acceso a diferentes módulos:

| Rol        | ID  | Módulo                  |
| ---------- | --- | ----------------------- |
| Admin      | 1   | Panel de Administración |
| Ventas     | 2   | Módulo de Ventas        |
| Dueno      | 3   | Módulo de Dueno         |
| Inventario | 4   | Módulo de Inventario    |

El usuario se redirige automáticamente a su módulo correspondiente después de iniciar sesión.

---

## 🐳 Base de Datos PostgreSQL (Docker)

Si necesitas acceder directamente a la base de datos:

### pgAdmin Web Interface

- **URL:** http://localhost:5050
- **Email:** `admin@proyecto.com`
- **Contraseña:** `admin123`

### Conexión PostgreSQL

- **Host:** 127.0.0.1
- **Puerto:** 5432
- **Base de datos:** proyecto
- **Usuario:** postgres
- **Contraseña:** 23072003

---

## 🔒 Seguridad

⚠️ **Estas son credenciales de desarrollo**. En producción debes:

- Cambiar todas las contraseñas
- Usar variables de entorno seguras
- Implementar autenticación de dos factores
- Configurar HTTPS

---

## � Cerrar Sesión

**✨ NUEVA FUNCIONALIDAD AGREGADA:**

Todos los usuarios ahora tienen la opción de **cerrar sesión** desde cualquier pantalla:

### 📱 En Navegadores (Admin, Ventas, Compras, Inventario)

- ✅ Botón **"Cerrar Sesión"** en la esquina superior derecha del AppBar
- ✅ Click directo para cerrar sesión inmediatamente
- ✅ Icono de logout visible

### 🏠 En Dashboard Principal

- ✅ Botón **"Cerrar sesión"** en el centro de la pantalla
- ✅ Muestra diálogo de confirmación antes de cerrar
- ✅ Avatar y nombre de usuario visibles

### 🔐 Proceso de Cierre de Sesión

1. Click en el botón "Cerrar Sesión"
2. El sistema invalida el token en el servidor
3. Se eliminan los datos locales (token y usuario)
4. Redirección automática a `/login`
5. Debes volver a iniciar sesión para acceder

**Para más detalles técnicos:** Consulta `FUNCIONALIDAD-CERRAR-SESION.md`

---

## �📞 Soporte

Si tienes problemas para iniciar sesión:

1. Verifica que el backend esté corriendo
2. Verifica que Docker esté corriendo
3. Revisa la consola del navegador para errores
4. Revisa los logs de Laravel

---

**¡Listo para usar!** 🎉
