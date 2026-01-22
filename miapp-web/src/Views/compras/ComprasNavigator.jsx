import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import HistoryIcon from '@mui/icons-material/History';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AppHeader from '../../components/AppHeader';

import ComprasDashboard from './ComprasDashboard';
import ComprasScreen from './ComprasScreen';
import HistorialComprasScreen from './HistorialComprasScreen';
import ProveedoresScreen from './ProveedoresScreen';

const drawerWidth = 280;

const menuItems = [
  { text: 'Inicio', icon: DashboardIcon, path: '' },
  { text: 'Registrar Compra', icon: ShoppingBasketIcon, path: 'registrar' },
  { text: 'Historial', icon: HistoryIcon, path: 'historial' },
  { text: 'Proveedores', icon: LocalShippingIcon, path: 'proveedores' },
];

export default function ComprasNavigator() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigate = (path) => {
    navigate(`/compras/${path}`);
    setMobileOpen(false);
  };

  const isActive = (path) => {
    const currentPath = location.pathname;
    const targetPath = `/compras/${path}`;
    return currentPath === targetPath || (path === '' && currentPath === '/compras');
  };

  const drawer = (
    <Box sx={{ background: 'linear-gradient(180deg, #f8f9fa 0%, #f0f2f5 100%)', height: '100%' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            p: 1,
            bgcolor: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)', // Purple for Purchases
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShoppingBasketIcon sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
            Compras
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Gestión de Gastos
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ my: 1 }} />
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => {
          const isItemActive = isActive(item.path);
          const IconComponent = item.icon;
          
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => handleNavigate(item.path)}
                selected={isItemActive}
                sx={{
                  borderRadius: '10px',
                  mb: 0.5,
                  transition: 'all 0.3s ease',
                  backgroundColor: isItemActive ? 'rgba(156, 39, 176, 0.12)' : 'transparent', // Purple tint
                  borderLeft: isItemActive ? '4px solid #9c27b0' : '4px solid transparent',
                  pl: isItemActive ? 1.5 : 2,
                  '&:hover': {
                    backgroundColor: 'rgba(156, 39, 176, 0.08)',
                    transform: 'translateX(4px)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(156, 39, 176, 0.12)',
                    '&:hover': {
                      backgroundColor: 'rgba(156, 39, 176, 0.15)',
                    },
                  },
                }}
              >
                <ListItemIcon
                   sx={{
                    color: isItemActive ? '#9c27b0' : '#666',
                    transition: 'color 0.3s ease',
                    minWidth: 40,
                  }}
                >
                  <IconComponent />
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    sx: {
                      fontSize: '0.95rem',
                      fontWeight: isItemActive ? '600' : '500',
                      color: isItemActive ? '#9c27b0' : '#333',
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
      <AppHeader onMenuClick={handleDrawerToggle} title="Panel de Compras" />

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#f8f9fa'
            },
          }}
        >
          {drawer}
        </Drawer>
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

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Routes>
          <Route path="" element={<ComprasDashboard />} />
          <Route path="registrar" element={<ComprasScreen />} />
          <Route path="historial" element={<HistorialComprasScreen />} />
          <Route path="proveedores" element={<ProveedoresScreen />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}
