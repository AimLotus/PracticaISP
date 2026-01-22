import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  ExitToApp,
  Business,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../api/axiosClient';
import NotificationBell from './NotificationBell';

export default function AppHeader({ onMenuClick, title = 'Panel' }) {
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [companyInfo, setCompanyInfo] = useState({
    nombre_empresa: 'Mi Empresa',
    logo_url: null,
  });
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    cargarInfoEmpresa();
  }, []);

  const cargarInfoEmpresa = async () => {
    try {
      const response = await axiosClient.get('/empresa/config');
      const data = response.data.data || response.data;

      setCompanyInfo({
        nombre_empresa: data.nombre_empresa || 'Mi Empresa',
        logo_url: data.logo_url || null,
      });
      setLogoError(false);
    } catch (error) {
      console.error('Error al cargar info de empresa:', error);
    }
  };

  const handleImageError = () => {
    console.error('Error al cargar la imagen del logo');
    setLogoError(true);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await signOut();
  };

  // Obtener el rol del usuario
  const getRoleName = () => {
    if (!user) return '';
    if (typeof user.rol === 'string') return user.rol;
    if (user.rol?.nombre) return user.rol.nombre;
    if (user.role?.nombre) return user.role.nombre;
    return '';
  };

  const roleName = getRoleName();

  // Capitalizar primera letra del rol
  const formatRole = (role) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Obtener color para el chip del rol
  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      dueno: 'warning',
      dueño: 'warning',
      ventas: 'success',
      inventario: 'info',
    };
    return colors[role?.toLowerCase()] || 'default';
  };

  // Obtener gradient del header según el rol
  const getHeaderGradient = (role) => {
    const gradients = {
      admin: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      dueno: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
      ventas: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
      inventario: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
    };
    return gradients[role?.toLowerCase()] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  const roleNameLower = roleName?.toLowerCase() || 'admin';
  const headerGradient = getHeaderGradient(roleNameLower);

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: headerGradient,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ 
            mr: 2, 
            display: { sm: 'none' },
            '&:focus': { outline: 'none' },
            '& .MuiTouchRipple-child': { backgroundColor: 'white' }
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo y nombre de la empresa */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Avatar
            src={!logoError && companyInfo.logo_url ? companyInfo.logo_url : undefined}
            alt={companyInfo.nombre_empresa}
            imgProps={{ onError: handleImageError }}
            sx={{
              mr: 2,
              width: 40,
              height: 40,
              bgcolor: 'white',
              border: '2px solid white',
              color: '#1976d2',
            }}
          >
            {(!companyInfo.logo_url || logoError) && <Business />}
          </Avatar>
          <Box>
            <Typography variant="h6" noWrap component="div">
              {companyInfo.nombre_empresa}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {title}
            </Typography>
          </Box>
        </Box>

        {/* Usuario y rol */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Campana de notificaciones (solo para admin/dueño) */}
          {(roleName === 'admin' || roleName === 'dueno') && <NotificationBell />}
          
          <Box sx={{ textAlign: 'right', mr: 1, display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" fontWeight="bold">
              {user?.nombre || user?.name || 'Usuario'}
            </Typography>
            <Chip
              label={formatRole(roleName)}
              size="small"
              color={getRoleColor(roleName)}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>

          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
            sx={{
              '&:focus': { outline: 'none' },
              '& .MuiTouchRipple-child': { backgroundColor: 'white' }
            }}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {user?.nombre || user?.name || 'Usuario'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email || 'Sin email'}
              </Typography>
              <Chip
                label={formatRole(roleName)}
                size="small"
                color={getRoleColor(roleName)}
                sx={{ mt: 0.5 }}
              />
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} fontSize="small" />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
