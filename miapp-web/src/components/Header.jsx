import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  Settings,
  Notifications,
  Business
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { company, getLogoUrl } = useCompany();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleCompanySettings = () => {
    handleMenuClose();
    navigate('/dashboard/configuracion-empresa');
  };

  const getRoleName = (rol) => {
    const roles = {
      admin: 'Administrador',
      dueno: 'Dueño de Negocio',
      ventas: 'Vendedor',
      inventario: 'Inventario'
    };
    return roles[rol] || rol;
  };

  const getRoleColor = (rol) => {
    const colors = {
      admin: '#f44336',
      dueno: '#9c27b0',
      ventas: '#2196f3',
      inventario: '#4caf50'
    };
    return colors[rol] || '#757575';
  };

  const logoUrl = getLogoUrl();

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#1976d2'
      }}
    >
      <Toolbar>
        {/* Botón de menú para móvil */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo y Nombre de la Empresa */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={company.nombre_empresa}
              style={{
                height: '40px',
                marginRight: '12px',
                objectFit: 'contain'
              }}
            />
          ) : (
            <Business sx={{ fontSize: 40, mr: 1.5, color: '#fff' }} />
          )}
          <Box>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}
            >
              {company.nombre_empresa || 'Mi Empresa'}
            </Typography>
            {company.ruc && (
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.8,
                  fontSize: '0.7rem'
                }}
              >
                RUC: {company.ruc}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Notificaciones (placeholder) */}
        <IconButton color="inherit" sx={{ mr: 1 }}>
          <Badge badgeContent={0} color="error">
            <Notifications />
          </Badge>
        </IconButton>

        {/* Perfil de Usuario */}
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <IconButton
            onClick={handleMenuOpen}
            size="small"
            sx={{ ml: 1 }}
            aria-controls={anchorEl ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={anchorEl ? 'true' : undefined}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: getRoleColor(user?.rol?.nombre),
                border: '2px solid white'
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          <Box sx={{ ml: 1.5, display: { xs: 'none', md: 'block' } }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {user?.name || 'Usuario'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.75rem',
                display: 'block'
              }}
            >
              {getRoleName(user?.rol?.nombre)}
            </Typography>
          </Box>
        </Box>

        {/* Menú de Usuario */}
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
              mt: 1.5,
              minWidth: 200,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* Info del usuario */}
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {user?.email}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'inline-block',
                mt: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                bgcolor: getRoleColor(user?.rol?.nombre),
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 500
              }}
            >
              {getRoleName(user?.rol?.nombre)}
            </Typography>
          </Box>
          
          <Divider />

          {(user?.rol?.nombre === 'admin' || user?.rol?.nombre === 'dueno') && (
            <MenuItem onClick={handleCompanySettings}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Configuración Empresa</ListItemText>
            </MenuItem>
          )}

          <Divider />

          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Cerrar Sesión</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
