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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CategoryIcon from '@mui/icons-material/Category';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import axiosClient from '../../api/axiosClient';
import './InventarioDashboard.css';

const COLORS = ['#f44336', '#ff9800', '#ffc107', '#4caf50', '#2196f3'];

export default function InventarioDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProductos: 0,
    productosBajoStock: 0,
    valorInventario: 0,
    totalMovimientos: 0,
  });
  const [productosBajoStock, setProductosBajoStock] = useState([]);
  const [ultimosMovimientos, setUltimosMovimientos] = useState([]);
  const [topProductosMovidos, setTopProductosMovidos] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Cargar productos
      const resProductos = await axiosClient.get('/products', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const productos = resProductos.data;

      // Calcular estadísticas
      const totalProductos = productos.length;
      const productosBajoStock = productos.filter((p) => p.stock_actual < p.stock_minimo);
      const valorInventario = productos.reduce(
        (sum, p) => sum + p.stock_actual * parseFloat(p.precio_venta || 0),
        0
      );

      setStats({
        totalProductos,
        productosBajoStock: productosBajoStock.length,
        valorInventario,
        totalMovimientos: 0, // Se actualizará con movimientos
      });

      setProductosBajoStock(productosBajoStock.slice(0, 5)); // Top 5

      // Cargar movimientos de inventario
      // Cargar movimientos de inventario (pedimos 50 para tener datos suficientes para estadísticas recientes)
      const resMovimientos = await axiosClient.get('/inventory-movements?per_page=50', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // La respuesta ahora es paginada, los datos están en resMovimientos.data.data
      const listaMovimientos = resMovimientos.data.data || [];
      const totalMovimientosRegistrados = resMovimientos.data.total || 0;

      setStats((prev) => ({ ...prev, totalMovimientos: totalMovimientosRegistrados }));

      // Últimos 5 movimientos (ya vienen ordenados por fecha desc del backend, tomamos los primeros 5)
      const ultimos = listaMovimientos.slice(0, 5);
      setUltimosMovimientos(ultimos);

      // Procesar productos más movidos (con la muestra de los últimos 50)
      procesarTopProductosMovidos(listaMovimientos);

    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const procesarTopProductosMovidos = (movimientos) => {
    const productosMap = new Map();

    movimientos.forEach((mov) => {
      const nombreProducto = mov.producto?.nombre || 'Producto desconocido';
      const cantidad = parseInt(mov.cantidad || 0);

      if (productosMap.has(nombreProducto)) {
        productosMap.set(nombreProducto, productosMap.get(nombreProducto) + cantidad);
      } else {
        productosMap.set(nombreProducto, cantidad);
      }
    });

    // Convertir a array y ordenar
    const productosArray = Array.from(productosMap.entries())
      .map(([nombre, cantidad]) => ({
        nombre: nombre.length > 15 ? nombre.substring(0, 15) + '...' : nombre,
        cantidad,
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5); // Top 5

    setTopProductosMovidos(productosArray);
  };

  const formatearMonto = (monto) => {
    return typeof monto === 'number' ? `$${monto.toFixed(2)}` : '$0.00';
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'N/A';
    }
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
    <Box sx={{ p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <Box className="dashboard-header" display="flex" alignItems="center" mb={4}>
        <Box className="header-icon-wrapper">
          <InventoryIcon sx={{ fontSize: 40, color: '#2196f3' }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight="700" sx={{ color: '#1a237e' }}>
            Dashboard de Inventario
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
            Gestión y análisis de tu inventario en tiempo real
          </Typography>
        </Box>
      </Box>

      {/* Estadísticas Principales */}
      <Grid container spacing={3} mb={4}>
        {/* Total Productos */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="stat-card stat-card-primary">
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography className="stat-label">
                    Total Productos
                  </Typography>
                  <Typography variant="h3" fontWeight="700" sx={{ color: '#2196f3', mt: 1 }}>
                    {stats.totalProductos}
                  </Typography>
                </Box>
                <Avatar className="stat-avatar stat-avatar-blue">
                  <CategoryIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Productos Bajo Stock */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className={`stat-card stat-card-danger ${stats.productosBajoStock > 0 ? 'stat-card-alert' : ''}`}>
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography className="stat-label">
                    Bajo Stock
                  </Typography>
                  <Typography variant="h3" fontWeight="700" sx={{ color: '#f44336', mt: 1 }}>
                    {stats.productosBajoStock}
                  </Typography>
                  {stats.productosBajoStock > 0 && (
                    <Typography variant="caption" sx={{ color: '#f44336', mt: 1, display: 'block' }}>
                      Requiere atención
                    </Typography>
                  )}
                </Box>
                <Avatar className="stat-avatar stat-avatar-red">
                  <WarningIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Valor Total Inventario */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="stat-card stat-card-success">
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography className="stat-label">
                    Valor Inventario
                  </Typography>
                  <Typography variant="h4" fontWeight="700" sx={{ color: '#4caf50', mt: 1 }}>
                    {formatearMonto(stats.valorInventario)}
                  </Typography>
                </Box>
                <Avatar className="stat-avatar stat-avatar-green">
                  <AttachMoneyIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Movimientos */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="stat-card stat-card-secondary">
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography className="stat-label">
                    Total Movimientos
                  </Typography>
                  <Typography variant="h3" fontWeight="700" sx={{ color: '#9c27b0', mt: 1 }}>
                    {stats.totalMovimientos}
                  </Typography>
                </Box>
                <Avatar className="stat-avatar stat-avatar-purple">
                  <MoveToInboxIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos y Tablas */}
      <Grid container spacing={3}>
        {/* Top 5 Productos Más Movidos */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="content-card">
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUpIcon sx={{ color: '#2196f3', mr: 1 }} />
                <Typography variant="h6" fontWeight="700" sx={{ color: '#1a237e' }}>
                  Top 5 Productos Más Movidos
                </Typography>
              </Box>
              <Divider sx={{ mb: 3, bgcolor: '#e0e0e0' }} />
              {topProductosMovidos.length === 0 ? (
                <Box className="empty-state" textAlign="center" py={4}>
                  <InventoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography color="text.secondary">
                    Sin datos de movimientos aún
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Ranking</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Cantidad</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topProductosMovidos.map((p, i) => (
                        <TableRow 
                          key={i}
                          sx={{
                            '&:hover': { bgcolor: '#e3f2fd' }
                          }}
                        >
                          <TableCell>
                            <Avatar 
                              sx={{ 
                                bgcolor: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(0,0,0,0.1)',
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
                          <TableCell sx={{ fontWeight: '500' }}>
                            {p.nombre}
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={p.cantidad}
                              size="small"
                              sx={{ 
                                bgcolor: '#e3f2fd',
                                color: '#1976d2',
                                fontWeight: 'bold'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Productos con Bajo Stock */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="content-card">
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <WarningIcon sx={{ color: '#f44336', mr: 1 }} />
                <Typography variant="h6" fontWeight="700" sx={{ color: '#1a237e' }}>
                  Productos con Bajo Stock
                </Typography>
                {stats.productosBajoStock > 0 && (
                  <Chip
                    label={stats.productosBajoStock}
                    size="small"
                    sx={{ ml: 'auto', bgcolor: '#ffcdd2', color: '#c62828', fontWeight: 'bold' }}
                  />
                )}
              </Box>
              <Divider sx={{ mb: 3, bgcolor: '#e0e0e0' }} />
              {productosBajoStock.length === 0 ? (
                <Box className="empty-state empty-state-success" textAlign="center" py={4}>
                  <CheckCircleIcon sx={{ fontSize: 48, color: '#4caf50', mb: 1 }} />
                  <Typography fontWeight="600" sx={{ color: '#2e7d32' }}>
                    ¡Excelente!
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    No hay productos con bajo stock
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: '700', color: '#1a237e' }}>Producto</TableCell>
                        <TableCell align="right" sx={{ fontWeight: '700', color: '#1a237e' }}>Stock</TableCell>
                        <TableCell align="right" sx={{ fontWeight: '700', color: '#1a237e' }}>Mínimo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productosBajoStock.map((producto) => (
                        <TableRow key={producto.id} className="stock-alert-row">
                          <TableCell sx={{ fontWeight: '500' }}>{producto.nombre}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={producto.stock_actual}
                              size="small"
                              icon={<ArrowDownwardIcon />}
                              sx={{
                                bgcolor: '#ffcdd2',
                                color: '#c62828',
                                fontWeight: '600'
                              }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: '600', color: '#f44336' }}>
                            {producto.stock_minimo}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Últimos Movimientos */}
        <Grid size={{ xs: 12 }}>
          <Card className="content-card">
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <MoveToInboxIcon sx={{ color: '#9c27b0', mr: 1 }} />
                <Typography variant="h6" fontWeight="700" sx={{ color: '#1a237e' }}>
                  Últimos Movimientos de Inventario
                </Typography>
              </Box>
              <Divider sx={{ mb: 3, bgcolor: '#e0e0e0' }} />
              {ultimosMovimientos.length === 0 ? (
                <Box className="empty-state" textAlign="center" py={4}>
                  <MoveToInboxIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography color="text.secondary">
                    No hay movimientos registrados aún
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: '700', color: '#1a237e' }}>Fecha</TableCell>
                        <TableCell sx={{ fontWeight: '700', color: '#1a237e' }}>Producto</TableCell>
                        <TableCell sx={{ fontWeight: '700', color: '#1a237e' }}>Tipo</TableCell>
                        <TableCell align="right" sx={{ fontWeight: '700', color: '#1a237e' }}>Cantidad</TableCell>
                        <TableCell sx={{ fontWeight: '700', color: '#1a237e' }}>Motivo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ultimosMovimientos.map((mov) => (
                        <TableRow key={mov.id} className="movement-row" sx={{
                          '&:hover': { bgcolor: '#f9f9f9' },
                          borderLeft: `4px solid ${mov.tipo_movimiento === 'entrada' ? '#4caf50' : '#ff9800'}`
                        }}>
                          <TableCell sx={{ fontWeight: '500' }}>{formatearFecha(mov.fecha)}</TableCell>
                          <TableCell sx={{ fontWeight: '500' }}>{mov.producto?.nombre || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              icon={mov.tipo_movimiento === 'entrada' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                              label={mov.tipo_movimiento}
                              size="small"
                              sx={{
                                bgcolor: mov.tipo_movimiento === 'entrada' ? '#c8e6c9' : '#ffe0b2',
                                color: mov.tipo_movimiento === 'entrada' ? '#2e7d32' : '#e65100',
                                fontWeight: '600'
                              }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{
                            fontWeight: 'bold',
                            color: mov.tipo_movimiento === 'entrada' ? '#4caf50' : '#ff9800',
                            fontSize: '1.1rem'
                          }}>
                            {mov.tipo_movimiento === 'entrada' ? '+' : '-'}
                            {mov.cantidad}
                          </TableCell>
                          <TableCell sx={{ color: '#666' }}>{mov.motivo || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
