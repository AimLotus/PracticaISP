import axiosClient from './axiosClient';

// Servicio de autenticación
export const loginUsuario = async ({ email, password }) => {
  try {
    const response = await axiosClient.post('/login', {
      email,
      password,
    });

    if (response.data && response.data.token && response.data.user) {
      // Verificar que el usuario tenga rol cargado
      if (!response.data.user.rol) {
        console.warn('Usuario sin rol cargado, recargando...');
        // Intenta recargar el usuario con el rol
        try {
          const userResponse = await axiosClient.get('/user', {
            headers: { Authorization: `Bearer ${response.data.token}` }
          });
          response.data.user = userResponse.data;
        } catch (err) {
          console.error('Error al recargar usuario:', err);
        }
      }
      
      return {
        token: response.data.token,
        user: response.data.user,
      };
    }

    throw new Error('Respuesta inválida del servidor');
  } catch (error) {
    console.error('Error en loginUsuario:', error);
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message;
      
      if (status === 401) {
        throw new Error(message || 'Correo o contraseña incorrectos');
      } else if (status === 403) {
        throw new Error(message || 'Cuenta desactivada. Contacta al administrador');
      } else if (status === 404) {
        throw new Error('No existe una cuenta con este correo');
      } else if (status >= 500) {
        throw new Error('Error en el servidor. Intenta más tarde');
      }
      
      throw new Error(message || 'Error al iniciar sesión');
    }
    
    if (error.message.includes('Network Error')) {
      throw new Error('Error de conexión. Verifica que el servidor esté activo');
    }
    
    throw new Error(error.message || 'Error al iniciar sesión');
  }
};

export const logoutUsuario = async () => {
  try {
    await axiosClient.post('/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    // Limpiar localStorage de todas formas
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const verificarToken = async () => {
  try {
    const response = await axiosClient.get('/user');
    return response.data;
  } catch (error) {
    throw error;
  }
};
