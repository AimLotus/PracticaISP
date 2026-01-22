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
import AssessmentIcon from '@mui/icons-material/Assessment';
import BusinessIcon from '@mui/icons-material/Business';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import HomeIcon from '@mui/icons-material/Home';
import StoreIcon from '@mui/icons-material/Store';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AppHeader from '../../components/AppHeader';

import DashboardFinanciero from './DashboardFinanciero';
import ConfiguracionEmpresa from '../admin/ConfiguracionEmpresa';
// Importar vistas de otros módulos
import Inventario from '../inventario/Inventario';
import GestionProductos from '../inventario/GestionProductos';
import MovimientosInventario from '../inventario/MovimientosInventario';
import ClientesScreen from '../ventas/ClientesScreen';
import VentasScreen from '../ventas/VentasScreen';
import HistorialVentasScreen from '../ventas/HistorialVentasScreen';
import ComprasDashboard from '../compras/ComprasDashboard';
import ProveedoresScreen from '../compras/ProveedoresScreen';
import ComprasScreen from '../compras/ComprasScreen';
import HistorialComprasScreen from '../compras/HistorialComprasScreen';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard Financiero', icon: AssessmentIcon, path: '' },
  { text: 'Configuración Empresa', icon: BusinessIcon, path: 'configuracion-empresa' },
  { section: 'Inventario' },
  { text: 'Ver Inventario', icon: InventoryIcon, path: 'inventario' },
  { text: 'Gestión Productos', icon: CategoryIcon, path: 'productos' },
  { text: 'Movimientos', icon: SwapHorizIcon, path: 'movimientos' },
  { section: 'Ventas' },
  { text: 'Clientes', icon: PeopleIcon, path: 'clientes' },
  { text: 'Nueva Venta', icon: ShoppingCartIcon, path: 'nueva-venta' },
  { text: 'Historial Ventas', icon: ReceiptIcon, path: 'historial-ventas' },
  { section: 'Compras' },
  { text: 'Inicio Compras', icon: HomeIcon, path: 'compras-inicio' },
  { text: 'Proveedores', icon: StoreIcon, path: 'proveedores' },
  { text: 'Nueva Compra', icon: AddShoppingCartIcon, path: 'nueva-compra' },
  { text: 'Historial Compras', icon: ListAltIcon, path: 'historial-compras' },
];

export default function DuenoNavigator() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigate = (path) => {
    navigate(`/dueno/${path}`);
    setMobileOpen(false);
  };

  const isActive = (path) => {
    const currentPath = location.pathname;
    // Handle root path separately
    if (path === '') {
      return currentPath === '/dueno' || currentPath === '/dueno/';
    }
    return currentPath.startsWith(`/dueno/${path}`);
  };

  const drawer = (
    <Box sx={{ background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 100%)', height: '100%' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            p: 1,
            bgcolor: 'linear-gradient(135deg, #ef6c00 0%, #ff9800 100%)', // Orange for Owner
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StoreIcon sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
            Panel Dueño
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Gestión Total
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ my: 1 }} />
      <List sx={{ px: 1, pb: 2 }}>
        {menuItems.map((item, index) => {
          if (item.section) {
            return (
              <React.Fragment key={`section-${index}`}>
                <Divider sx={{ my: 1.5, opacity: 0.6 }} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    px: 2,
                    pb: 0.5,
                    display: 'block',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: '0.5px'
                  }}
                >
                  {item.section}
                </Typography>
              </React.Fragment>
            );
          }
          
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
                  backgroundColor: isItemActive ? 'rgba(239, 108, 0, 0.12)' : 'transparent', // Orange tint
                  borderLeft: isItemActive ? '4px solid #ef6c00' : '4px solid transparent',
                  pl: isItemActive ? 1.5 : 2,
                  '&:hover': {
                    backgroundColor: 'rgba(239, 108, 0, 0.08)',
                    transform: 'translateX(4px)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(239, 108, 0, 0.12)',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 108, 0, 0.15)',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isItemActive ? '#ef6c00' : '#666',
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
                      fontSize: '0.9rem',
                      fontWeight: isItemActive ? '600' : '500',
                      color: isItemActive ? '#ef6c00' : '#333',
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
      <AppHeader onMenuClick={handleDrawerToggle} title="Panel de Dueño de Negocio" />

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
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
              backgroundColor: '#ffffff' 
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
              backgroundColor: '#ffffff',
              borderRight: '1px solid #ffffff',
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
          <Route path="" element={<DashboardFinanciero />} />
          <Route path="configuracion-empresa" element={<ConfiguracionEmpresa />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="productos" element={<GestionProductos />} />
          <Route path="movimientos" element={<MovimientosInventario />} />
          <Route path="clientes" element={<ClientesScreen />} />
          <Route path="nueva-venta" element={<VentasScreen />} />
          <Route path="historial-ventas" element={<HistorialVentasScreen />} />
          <Route path="compras-inicio" element={<ComprasDashboard />} />
          <Route path="proveedores" element={<ProveedoresScreen />} />
          <Route path="nueva-compra" element={<ComprasScreen />} />
          <Route path="historial-compras" element={<HistorialComprasScreen />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}
