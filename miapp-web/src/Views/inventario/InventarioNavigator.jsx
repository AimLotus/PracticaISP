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
import InventoryIcon from '@mui/icons-material/Inventory';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CategoryIcon from '@mui/icons-material/Category';
import AppHeader from '../../components/AppHeader';
import InventarioDashboard from './InventarioDashboard';
import Inventario from './Inventario';
import MovimientosInventario from './MovimientosInventario';
import GestionProductos from './GestionProductos';

const drawerWidth = 280;

const menuItems = [
  { text: 'Inicio', icon: DashboardIcon, path: '' },
  { text: 'Ver Inventario', icon: InventoryIcon, path: 'ver' },
  { text: 'Movimientos', icon: SwapHorizIcon, path: 'movimientos' },
  { text: 'Gestión Productos', icon: CategoryIcon, path: 'productos' },
];

export default function InventarioNavigator() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigate = (path) => {
    navigate(`/inventario/${path}`);
    setMobileOpen(false);
  };

  const isActive = (path) => {
    const currentPath = location.pathname;
    const targetPath = `/inventario/${path}`;
    return currentPath === targetPath || (path === '' && currentPath === '/inventario');
  };

  const drawer = (
    <Box sx={{ background: 'linear-gradient(180deg, #f8f9fa 0%, #f0f2f5 100%)', height: '100%' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            p: 1,
            bgcolor: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)', // Celeste/Azul para inventario
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <InventoryIcon sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
            Inventario
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Gestión de Stock
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
                  backgroundColor: isItemActive ? 'rgba(33, 150, 243, 0.12)' : 'transparent', // Tono celeste
                  borderLeft: isItemActive ? '4px solid #2196f3' : '4px solid transparent',
                  pl: isItemActive ? 1.5 : 2,
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                    transform: 'translateX(4px)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(33, 150, 243, 0.12)',
                    '&:hover': {
                      backgroundColor: 'rgba(33, 150, 243, 0.15)',
                    },
                  },
                }}
              >
                <ListItemIcon
                   sx={{
                    color: isItemActive ? '#2196f3' : '#666',
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
                      color: isItemActive ? '#2196f3' : '#333',
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
      <AppHeader onMenuClick={handleDrawerToggle} title="Panel de Inventario" />

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
          <Route path="" element={<InventarioDashboard />} />
          <Route path="ver" element={<Inventario />} />
          <Route path="movimientos" element={<MovimientosInventario />} />
          <Route path="productos" element={<GestionProductos />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}
