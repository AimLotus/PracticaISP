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
  Chip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BusinessIcon from '@mui/icons-material/Business';
import Icon from '../../components/Icon';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import GestionUsuarios from './GestionUsuarios';
import GestionImpuestos from './GestionImpuestos';
import ConfiguracionEmpresa from './ConfiguracionEmpresa';
import AdminRegister from './AdminRegister';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: DashboardIcon, path: '', badge: null },
  { text: 'Gestionar Usuarios', icon: PeopleIcon, path: 'usuarios', badge: null },
  { text: 'Registrar Usuario', icon: PersonAddIcon, path: 'registrar-usuario', badge: 'Nuevo' },
  { text: 'Gestionar Impuestos', icon: AttachMoneyIcon, path: 'impuestos', badge: null },
  { text: 'Configuración Empresa', icon: BusinessIcon, path: 'configuracion-empresa', badge: null },
];

export default function AdminNavigator() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigate = (path) => {
    navigate(`/admin/${path}`);
    setMobileOpen(false);
  };

  const isActive = (path) => {
    const currentPath = location.pathname;
    const targetPath = `/admin/${path}`;
    return currentPath === targetPath || (path === '' && currentPath === '/admin');
  };

  const drawer = (
    <Box sx={{ background: 'linear-gradient(180deg, #f8f9fa 0%, #f0f2f5 100%)', h: '100%' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            p: 1,
            bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DashboardIcon sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
            Admin Panel
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Control total
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
                  backgroundColor: isItemActive ? 'rgba(102, 126, 234, 0.12)' : 'transparent',
                  borderLeft: isItemActive ? '4px solid #667eea' : '4px solid transparent',
                  pl: isItemActive ? 1.5 : 2,
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.08)',
                    transform: 'translateX(4px)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(102, 126, 234, 0.12)',
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.15)',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isItemActive ? '#667eea' : '#666',
                    transition: 'color 0.3s ease',
                    minWidth: 40,
                  }}
                >
                  <IconComponent fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: '0.95rem',
                      fontWeight: isItemActive ? '600' : '500',
                      color: isItemActive ? '#667eea' : '#333',
                      transition: 'color 0.3s ease',
                    },
                  }}
                />
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
                      color: 'white',
                      marginLeft: 'auto',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="caption" sx={{ color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>
          Administración
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mt: 1, lineHeight: 1.6 }}>
          Panel de control para la gestión integral del sistema y administración de usuarios.
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppHeader onMenuClick={handleDrawerToggle} title="Panel de Administración" />

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Drawer para móvil */}
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

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#f5f7fa',
        }}
      >
        <Toolbar />
        <Routes>
          <Route path="" element={<AdminDashboard />} />
          <Route path="usuarios" element={<GestionUsuarios />} />
          <Route path="registrar-usuario" element={<AdminRegister />} />
          <Route path="impuestos" element={<GestionImpuestos />} />
          <Route path="configuracion-empresa" element={<ConfiguracionEmpresa />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}
