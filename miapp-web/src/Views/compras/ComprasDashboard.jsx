import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Avatar,
  Divider,
  Paper,
  Chip,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axiosClient from '../../api/axiosClient';

export default function ComprasDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    proveedoresCount: 0,
    gastosMes: 0,
    gastosHoy: 0,
    comprasTotales: 0,
  });
  const [comprasPorDia, setComprasPorDia] = useState([]);
  const [topProductos, setTopProductos] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Cargar estadísticas básicas
      const [resProveedores, resCompras] = await Promise.all([
        axiosClient.get('/proveedores/count', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axiosClient.get('/compras/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats({
        proveedoresCount: resProveedores.data.totalProveedores ?? 0,
        gastosMes: parseFloat(resCompras.data.mes) || 0,
        gastosHoy: parseFloat(resCompras.data.hoy) || 0,
        comprasTotales: resCompras.data.total ?? 0,
      });

      // Cargar compras para gráficos
      const resComprasCompletas = await axiosClient.get('/compras', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Procesar compras por día (últimos 7 días)
      procesarComprasPorDia(resComprasCompletas.data);

      // Procesar productos más comprados
      procesarTopProductos(resComprasCompletas.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const procesarComprasPorDia = (compras) => {
    const hoy = new Date();
    const ultimos7Dias = [];

    // Crear array con los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];

      ultimos7Dias.push({
        fecha: fechaStr,
        dia: fecha.toLocaleDateString('es-ES', { weekday: 'short' }),
        total: 0,
        cantidad: 0,
      });
    }

    // Sumar compras por día
    compras.forEach((compra) => {
      const fechaCompra = compra.fecha.split('T')[0];
      const diaEncontrado = ultimos7Dias.find((d) => d.fecha === fechaCompra);
      if (diaEncontrado) {
        diaEncontrado.total += parseFloat(compra.total || 0);
        diaEncontrado.cantidad += 1;
      }
    });

    setComprasPorDia(ultimos7Dias);
  };

  const procesarTopProductos = (compras) => {
    const productosMap = new Map();

    compras.forEach((compra) => {
      const items = compra.items || compra.detalles || [];
      if (Array.isArray(items)) {
        items.forEach((detalle) => {
          const nombreProducto = detalle.producto?.nombre || detalle.product?.nombre || 'Producto desconocido';
          const cantidad = parseInt(detalle.cantidad || 0);
          const subtotal = parseFloat(detalle.subtotal || 0);

          if (productosMap.has(nombreProducto)) {
            const actual = productosMap.get(nombreProducto);
            productosMap.set(nombreProducto, {
              cantidad: actual.cantidad + cantidad,
              subtotal: actual.subtotal + subtotal,
            });
          } else {
            productosMap.set(nombreProducto, { cantidad, subtotal });
          }
        });
      }
    });

    // Convertir a array y ordenar por cantidad comprada
    const productosArray = Array.from(productosMap.entries())
      .map(([nombre, datos]) => ({
        nombre: nombre.length > 20 ? nombre.substring(0, 20) + '...' : nombre,
        cantidad: datos.cantidad,
        subtotal: datos.subtotal,
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5); // Top 5


    setTopProductos(productosArray);
  };

  const formatearMonto = (monto) => {
    return typeof monto === 'number' ? `$${monto.toFixed(2)}` : '$0.00';
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header mejorado */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ff9800 0%, #da8300 100%)',
          color: 'white'
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center">
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                width: 56, 
                height: 56,
                mr: 2
              }}
            >
              <LocalShippingIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Dashboard de Compras
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Resumen y análisis de compras
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={`Total: ${formatearMonto(stats.gastosMes)}`}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1rem',
              px: 1,
              py: 2.5
            }}
          />
        </Box>
      </Paper>

      {/* Estadísticas Principales Mejoradas */}
      <Grid container spacing={3} mb={4}>
        {/* Proveedores Registrados */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              borderRadius: 3,
              transition: 'all 0.3s ease',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                <Avatar 
                  sx={{ 
                    bgcolor: alpha('#1976d2', 0.1),
                    width: 56, 
                    height: 56 
                  }}
                >
                  <BusinessIcon sx={{ color: '#1976d2', fontSize: 28 }} />
                </Avatar>
                <Chip 
                  label="Activos" 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha('#4caf50', 0.1),
                    color: '#4caf50',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Proveedores
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="primary">
                {stats.proveedoresCount}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50', mr: 0.5 }} />
                <Typography variant="caption" sx={{ color: '#4caf50' }}>
                  Registrados
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Gastos del Mes */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              borderRadius: 3,
              transition: 'all 0.3s ease',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                <Avatar 
                  sx={{ 
                    bgcolor: alpha('#ff9800', 0.1),
                    width: 56, 
                    height: 56 
                  }}
                >
                  <CalendarMonthIcon sx={{ color: '#ff9800', fontSize: 28 }} />
                </Avatar>
                <Chip 
                  label="Mes Actual" 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha('#ff9800', 0.1),
                    color: '#ff9800',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Gastos del Mes
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#ff9800' }}>
                {formatearMonto(stats.gastosMes)}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <CalendarMonthIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Total acumulado
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Gastos del Día */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              borderRadius: 3,
              transition: 'all 0.3s ease',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                <Avatar 
                  sx={{ 
                    bgcolor: alpha('#f44336', 0.1),
                    width: 56, 
                    height: 56 
                  }}
                >
                  <CalendarTodayIcon sx={{ color: '#f44336', fontSize: 28 }} />
                </Avatar>
                <Chip 
                  label="Hoy" 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha('#f44336', 0.1),
                    color: '#f44336',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Gastos de Hoy
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#f44336' }}>
                {formatearMonto(stats.gastosHoy)}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingDownIcon sx={{ fontSize: 16, color: '#f44336', mr: 0.5 }} />
                <Typography variant="caption" sx={{ color: '#f44336' }}>
                  Día actual
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Compras Totales */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              borderRadius: 3,
              transition: 'all 0.3s ease',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                <Avatar 
                  sx={{ 
                    bgcolor: alpha('#9c27b0', 0.1),
                    width: 56, 
                    height: 56 
                  }}
                >
                  <ShoppingBasketIcon sx={{ color: '#9c27b0', fontSize: 28 }} />
                </Avatar>
                <Chip 
                  label="Total" 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha('#9c27b0', 0.1),
                    color: '#9c27b0',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Compras Totales
              </Typography>
              <Typography variant="h3" fontWeight="bold" sx={{ color: '#9c27b0' }}>
                {Math.floor(stats.comprasTotales)}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <InventoryIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Transacciones
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos Mejorados */}
      <Grid container spacing={3}>
        {/* Gráfico de Compras por Día */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Compras de los Últimos 7 Días
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tendencia de gastos diarios
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#ff9800', 0.1) }}>
                  <TrendingDownIcon sx={{ color: '#ff9800' }} />
                </Avatar>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={comprasPorDia}>
                  <defs>
                    <linearGradient id="colorTotalCompras" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff9800" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ff9800" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="dia" 
                    stroke="#999"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#999"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    formatter={(value) => formatearMonto(value)}
                    contentStyle={{ 
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Compras"
                    stroke="#ff9800"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotalCompras)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top 5 Productos Más Comprados */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Top 5 Productos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Más comprados
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#ff9800', 0.1) }}>
                  <InventoryIcon sx={{ color: '#ff9800' }} />
                </Avatar>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {topProductos.length > 0 ? (
                <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha('#f5f5f5', 0.8) }}>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">Ranking</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">Producto</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight="bold">Cant.</Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topProductos.map((p, i) => (
                        <TableRow 
                          key={i}
                          sx={{
                            '&:hover': {
                              bgcolor: alpha('#ff9800', 0.05)
                            }
                          }}
                        >
                          <TableCell>
                            <Avatar 
                              sx={{ 
                                bgcolor: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : alpha('#999', 0.2),
                                width: 32,
                                height: 32,
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: i < 3 ? 'white' : '#666'
                              }}
                            >
                              {i + 1}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {p.nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatearMonto(p.subtotal)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={p.cantidad}
                              size="small"
                              sx={{ 
                                bgcolor: alpha('#ff9800', 0.1),
                                color: '#ff9800',
                                fontWeight: 'bold'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center" 
                  height={320}
                  flexDirection="column"
                  sx={{ bgcolor: alpha('#f5f5f5', 0.5), borderRadius: 2 }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha('#ccc', 0.2), 
                      width: 80, 
                      height: 80,
                      mb: 2
                    }}
                  >
                    <MoneyOffIcon sx={{ fontSize: 40, color: '#999' }} />
                  </Avatar>
                  <Typography color="text.secondary" variant="body2" fontWeight="medium">
                    No hay datos de compras
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    Los productos aparecerán aquí
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
