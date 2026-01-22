import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory,
  ShoppingCart,
  People,
  Assessment,
  Settings,
  Business
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

const drawerWidth = 280;

const DashboardLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    {
      text: 'Inicio',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['admin', 'dueno', 'ventas', 'inventario']
    },
    {
      text: 'Inventario',
      icon: <Inventory />,
      path: '/dashboard/inventario',
      roles: ['admin', 'dueno', 'inventario']
    },
    {
      text: 'Ventas',
      icon: <ShoppingCart />,
      path: '/dashboard/ventas',
      roles: ['admin', 'dueno', 'ventas']
    },
    {
      text: 'Clientes',
      icon: <People />,
      path: '/dashboard/clientes',
      roles: ['admin', 'dueno', 'ventas']
    },
    {
      text: 'Finanzas',
      icon: <Assessment />,
      path: '/dashboard/finanzas',
      roles: ['admin', 'dueno']
    },
    {
      text: 'Configuración Empresa',
      icon: <Business />,
      path: '/dashboard/configuracion-empresa',
      roles: ['admin', 'dueno']
    },
    {
      text: 'Administración',
      icon: <Settings />,
      path: '/dashboard/admin',
      roles: ['admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    const userRole = user?.rol?.nombre;
    return userRole && item.roles.includes(userRole);
  });

  const drawer = (
    <Box sx={{ background: 'linear-gradient(180deg, #f8f9fa 0%, #f0f2f5 100%)', height: '100%' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            p: 1,
            bgcolor: 'linear-gradient(135deg, #1976d2 0%, #21CBF3 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Inventory sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
            Mi Sistema
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            {user?.rol?.nombre || 'Gestión'}
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ my: 1 }} />
      <List sx={{ px: 1 }}>
        {filteredMenuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: '10px',
                  mb: 0.5,
                  transition: 'all 0.3s ease',
                  backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                  borderLeft: isSelected ? '4px solid #1976d2' : '4px solid transparent',
                  pl: isSelected ? 1.5 : 2,
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    transform: 'translateX(4px)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(25, 118, 210, 0.12)',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.15)',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isSelected ? '#1976d2' : '#666',
                    transition: 'color 0.3s ease',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    sx: {
                      fontSize: '0.95rem',
                      fontWeight: isSelected ? '600' : '500',
                      color: isSelected ? '#1976d2' : '#333',
                      transition: 'color 0.3s ease',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onMenuClick={handleDrawerToggle} />
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Drawer para móvil */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#f8f9fa',
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Drawer para desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#f8f9fa',
              borderRight: '1px solid #e0e0e0',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#f5f5f5'
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
