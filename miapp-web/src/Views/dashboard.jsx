import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirigirSegunRol = () => {
      try {
        const userDataRaw = localStorage.getItem('user');

        
        if (userDataRaw) {
          const user = JSON.parse(userDataRaw);

          
          // Obtener el nombre del rol correctamente
          let rolNombre = null;
          
          // Opción 1: usuario.rol (string directo)
          if (typeof user.rol === 'string') {
            rolNombre = user.rol;
          } 
          // Opción 2: usuario.rol.nombre (objeto rol en español)
          else if (user.rol && user.rol.nombre) {
            rolNombre = user.rol.nombre;
          } 
          // Opción 3: usuario.role.nombre (objeto role en inglés)
          else if (user.role && user.role.nombre) {
            rolNombre = user.role.nombre;
          }
          // Opción 4: FALLBACK - mapear rol_id a nombre
          else if (user.rol_id) {
            const rolMap = {
              1: 'admin',
              2: 'ventas',
              3: 'compras',
              4: 'inventario',
              5: 'dueno'
            };
            rolNombre = rolMap[user.rol_id];

          }
          

          
          // Redirección automática según el rol
          switch(rolNombre) {
            case 'admin':

              navigate('/admin', { replace: true });
              break;
            case 'dueno':

              navigate('/dueno', { replace: true });
              break;
            case 'ventas':

              navigate('/ventas', { replace: true });
              break;
            case 'inventario':

              navigate('/inventario', { replace: true });
              break;
            case 'compras':

              navigate('/compras', { replace: true });
              break;
            default:

              alert('Rol no reconocido: ' + rolNombre + '. Por favor contacte al administrador.');
          }
        } else {

          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Error al redirigir según rol:', error);
        navigate('/login', { replace: true });
      }
    };

    redirigirSegunRol();
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#d0e9f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: 3,
      }}
    >
      <CircularProgress size={60} sx={{ color: '#0288d1', mb: 2 }} />
      <Typography variant="h6" color="textSecondary">
        Redirigiendo...
      </Typography>
    </Box>
  );
}
