import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Chip,
  Avatar,
  Paper,
  Divider,
  Button,
  Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StoreIcon from '@mui/icons-material/Store';
import InventoryIcon from '@mui/icons-material/Inventory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as ChartTooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    usuariosPorRol: {
      administrador: 0,
      ventas: 0,
      dueno: 0,
      inventario: 0,
    },
    usuariosActivos: 0,
    usuariosInactivos: 0,
  });

  const [userName, setUserName] = useState('Usuario');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const userDataRaw = localStorage.getItem('user');
      if (userDataRaw) {
        const user = JSON.parse(userDataRaw);
        setUserName(user.name || 'Usuario');
      }

      const resUsuarios = await axiosClient.get('/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const usuarios = resUsuarios.data;

      const totalUsuarios = usuarios.length;
      const usuariosActivos = usuarios.filter((u) => u.activo).length;
      const usuariosInactivos = usuarios.filter((u) => !u.activo).length;

      const usuariosPorRol = {
        administrador: usuarios.filter((u) => u.rol?.nombre === 'admin').length,
        ventas: usuarios.filter((u) => u.rol?.nombre === 'ventas').length,
        dueno: usuarios.filter((u) => u.rol?.nombre === 'dueno').length,
        inventario: usuarios.filter((u) => u.rol?.nombre === 'inventario').length,
      };

      setStats({
        totalUsuarios,
        usuariosPorRol,
        usuariosActivos,
        usuariosInactivos,
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const obtenerIniciales = (nombreCompleto) => {
    if (!nombreCompleto) return '';
    const palabras = nombreCompleto.trim().split(' ').filter((p) => p.length > 0);
    if (palabras.length === 0) return '';
    if (palabras.length === 1) return palabras[0][0].toUpperCase();
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  };

  const dataGraficoRoles = [
    { name: 'Administrador', value: stats.usuariosPorRol.administrador, color: '#9c27b0' },
    { name: 'Ventas', value: stats.usuariosPorRol.ventas, color: '#4caf50' },
    { name: 'Dueño', value: stats.usuariosPorRol.dueno, color: '#ff9800' },
    { name: 'Inventario', value: stats.usuariosPorRol.inventario, color: '#2196f3' },
  ].filter(item => item.value > 0);

  const dataGraficoEstado = [
    { name: 'Activos', value: stats.usuariosActivos, color: '#4caf50' },
    { name: 'Inactivos', value: stats.usuariosInactivos, color: '#f44336' },
  ].filter(item => item.value > 0);

  const tasaPorcentajeActivos = stats.totalUsuarios > 0 
    ? ((stats.usuariosActivos / stats.totalUsuarios) * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between"
        mb={4}
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'flex-start', sm: 'center' },
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'linear-gradient(135deg, #1976d2 0%, #21CBF3 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DashboardIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#1a1a1a' }}>
              Panel de Administración
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
              Gestión integral del sistema
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Actualizar datos">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ 
              textTransform: 'none',
              borderRadius: '8px',
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          >
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </Tooltip>
      </Box>

      {/* Tarjeta de Bienvenida */}
      <Card 
        sx={{ 
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
          borderRadius: '16px',
          overflow: 'hidden',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={3}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'white',
                color: '#667eea',
                fontSize: '2rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                flexShrink: 0,
              }}
            >
              {obtenerIniciales(userName)}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" color="white" fontWeight="bold" sx={{ mb: 0.5 }}>
                ¡Bienvenido, {userName}!
              </Typography>
              <Typography variant="body1" color="white" sx={{ opacity: 0.9 }}>
                Tienes acceso completo al sistema de administración
              </Typography>
              <Box display="flex" gap={1} mt={1.5}>
                <Chip
                  label="Administrador"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: '600',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
                <Chip
                  icon={<TrendingUpIcon sx={{ color: 'white !important' }} />}
                  label={`${tasaPorcentajeActivos}% Activos`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(76, 175, 80, 0.3)',
                    color: 'white',
                    fontWeight: '600',
                    border: '1px solid rgba(76, 175, 80, 0.5)',
                  }}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Estadísticas Principales */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card 
            sx={{
              h: '100%',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              },
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #1976d2, #21CBF3)',
              },
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box flex={1}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                    Total Usuarios
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="primary" sx={{ lineHeight: 1 }}>
                    {stats.totalUsuarios}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666', mt: 1, display: 'block' }}>
                    En el sistema
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    bgcolor: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                    width: 56,
                    height: 56,
                  }}
                >
                  <PeopleIcon sx={{ color: '#1976d2', fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card 
            sx={{
              h: '100%',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              },
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #4caf50, #81c784)',
              },
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box flex={1}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                    Usuarios Activos
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" sx={{ color: '#4caf50', lineHeight: 1 }}>
                    {stats.usuariosActivos}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666', mt: 1, display: 'block' }}>
                    {tasaPorcentajeActivos}% del total
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    bgcolor: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                    width: 56,
                    height: 56,
                  }}
                >
                  <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card 
            sx={{
              h: '100%',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              },
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #f44336, #ef5350)',
              },
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box flex={1}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                    Usuarios Inactivos
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" sx={{ color: '#f44336', lineHeight: 1 }}>
                    {stats.usuariosInactivos}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666', mt: 1, display: 'block' }}>
                    {stats.totalUsuarios > 0 ? ((stats.usuariosInactivos / stats.totalUsuarios) * 100).toFixed(1) : 0}% del total
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    bgcolor: 'linear-gradient(135deg, #ffebee, #ffcdd2)',
                    width: 56,
                    height: 56,
                  }}
                >
                  <CancelIcon sx={{ color: '#f44336', fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card 
            sx={{
              h: '100%',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              },
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #9c27b0, #ba68c8)',
              },
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box flex={1}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                    Administradores
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" sx={{ color: '#9c27b0', lineHeight: 1 }}>
                    {stats.usuariosPorRol.administrador}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666', mt: 1, display: 'block' }}>
                    {stats.totalUsuarios > 0 ? ((stats.usuariosPorRol.administrador / stats.totalUsuarios) * 100).toFixed(1) : 0}% del total
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    bgcolor: 'linear-gradient(135deg, #f3e5f5, #e1bee7)',
                    width: 56,
                    height: 56,
                  }}
                >
                  <AdminPanelSettingsIcon sx={{ color: '#9c27b0', fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sección de Gráficos */}
      <Grid container spacing={3} mb={4}>
        {/* Gráfico de Distribución por Rol */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: '12px', h: '100%' }}>
            <CardContent>
              <Typography variant="h6" mb={3} fontWeight="bold">
                Distribución por Rol
              </Typography>
              <Divider sx={{ mb: 3 }} />
              {dataGraficoRoles.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dataGraficoRoles}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dataGraficoRoles.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                  <Typography color="text.secondary">Sin datos disponibles</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Estado de Usuarios */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: '12px', h: '100%' }}>
            <CardContent>
              <Typography variant="h6" mb={3} fontWeight="bold">
                Estado de Usuarios
              </Typography>
              <Divider sx={{ mb: 3 }} />
              {dataGraficoEstado.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dataGraficoEstado}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dataGraficoEstado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                  <Typography color="text.secondary">Sin datos disponibles</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sección Detalles de Usuarios (Horizontal) */}
      <Card sx={{ borderRadius: '12px', mb: 4 }}>
        <CardContent>
          <Typography variant="h6" mb={3} fontWeight="bold">
            Detalles de Usuarios por Rol
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            {/* Administrador */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2.5,
                  bgcolor: '#f3e5f5',
                  borderRadius: '12px',
                  textAlign: 'center',
                  borderTop: '4px solid #9c27b0',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(156, 39, 176, 0.15)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <AdminPanelSettingsIcon sx={{ color: '#9c27b0', fontSize: 40, mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: '500', mb: 1 }}>
                  Administrador
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="#9c27b0" sx={{ mb: 1 }}>
                  {stats.usuariosPorRol.administrador}
                </Typography>
                <Chip
                  label={`${stats.totalUsuarios > 0 ? ((stats.usuariosPorRol.administrador / stats.totalUsuarios) * 100).toFixed(1) : 0}%`}
                  size="small"
                  sx={{ bgcolor: '#9c27b0', color: 'white', fontWeight: '600' }}
                />
              </Paper>
            </Grid>

            {/* Ventas */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2.5,
                  bgcolor: '#e8f5e9',
                  borderRadius: '12px',
                  textAlign: 'center',
                  borderTop: '4px solid #4caf50',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <ShoppingCartIcon sx={{ color: '#4caf50', fontSize: 40, mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: '500', mb: 1 }}>
                  Ventas
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="#4caf50" sx={{ mb: 1 }}>
                  {stats.usuariosPorRol.ventas}
                </Typography>
                <Chip
                  label={`${stats.totalUsuarios > 0 ? ((stats.usuariosPorRol.ventas / stats.totalUsuarios) * 100).toFixed(1) : 0}%`}
                  size="small"
                  sx={{ bgcolor: '#4caf50', color: 'white', fontWeight: '600' }}
                />
              </Paper>
            </Grid>

            {/* Dueño de Negocio */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2.5,
                  bgcolor: '#fff3e0',
                  borderRadius: '12px',
                  textAlign: 'center',
                  borderTop: '4px solid #ff9800',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <StoreIcon sx={{ color: '#ff9800', fontSize: 40, mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: '500', mb: 1 }}>
                  Dueño de Negocio
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="#ff9800" sx={{ mb: 1 }}>
                  {stats.usuariosPorRol.dueno}
                </Typography>
                <Chip
                  label={`${stats.totalUsuarios > 0 ? ((stats.usuariosPorRol.dueno / stats.totalUsuarios) * 100).toFixed(1) : 0}%`}
                  size="small"
                  sx={{ bgcolor: '#ff9800', color: 'white', fontWeight: '600' }}
                />
              </Paper>
            </Grid>

            {/* Inventario */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2.5,
                  bgcolor: '#e3f2fd',
                  borderRadius: '12px',
                  textAlign: 'center',
                  borderTop: '4px solid #2196f3',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <InventoryIcon sx={{ color: '#2196f3', fontSize: 40, mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: '500', mb: 1 }}>
                  Inventario
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="#2196f3" sx={{ mb: 1 }}>
                  {stats.usuariosPorRol.inventario}
                </Typography>
                <Chip
                  label={`${stats.totalUsuarios > 0 ? ((stats.usuariosPorRol.inventario / stats.totalUsuarios) * 100).toFixed(1) : 0}%`}
                  size="small"
                  sx={{ bgcolor: '#2196f3', color: 'white', fontWeight: '600' }}
                />
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Acciones Rápidas */}
      <Card sx={{ borderRadius: '12px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <CardContent>
          <Typography variant="h6" mb={2} fontWeight="bold">
            Acciones Rápidas
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => navigate('/admin/registrar-usuario')}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                px: 3,
              }}
            >
              Registrar Usuario
            </Button>
            <Button
              variant="contained"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/admin/usuarios')}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1976d2 0%, #21CBF3 100%)',
                px: 3,
              }}
            >
              Gestionar Usuarios
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/configuracion-empresa')}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                px: 3,
              }}
            >
              Configuración
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
