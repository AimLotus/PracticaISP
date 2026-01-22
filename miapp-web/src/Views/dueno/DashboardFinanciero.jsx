import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Divider,
  alpha,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShowChart as ChartIcon,
  EmojiEvents as TrophyIcon,
  Category as CategoryIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  Assessment as AssessmentIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  PictureAsPdf as PdfIcon,
  CalendarMonth as CalendarIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardFinanciero() {
  const { user } = useAuth();
  
  // Configuración de colores basada en el rol del usuario (rol_id: 3 = dueño)
  const themeColor = user?.rol_id === 3 ? '#ff9800' : '#667eea';
  const themeColorLight = user?.rol_id === 3 ? '#ffb74d' : '#764ba2';
  const themeColorAlpha = user?.rol_id === 3 ? 'rgba(255, 152, 0, 0.2)' : 'rgba(102, 126, 234, 0.2)';
  
  const [loading, setLoading] = useState(true);
  // Eliminados estados de datos crudos (ventas, compras, productos) para optimización
  
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [aniosDisponibles, setAniosDisponibles] = useState([new Date().getFullYear()]);
  
  // Estados para reportes
  const [dialogReporte, setDialogReporte] = useState(false);
  const [tipoReporte, setTipoReporte] = useState('anual');
  const [mesReporte, setMesReporte] = useState(new Date().getMonth() + 1);
  const [trimestreReporte, setTrimestreReporte] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [anioReporte, setAnioReporte] = useState(new Date().getFullYear());
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Datos calculados
  const [resumenCards, setResumenCards] = useState({
    ventasTotales: 0,
    costos: 0,
    ganancias: 0
  });
  const [ventasPorMes, setVentasPorMes] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [productosSolicitados, setProductosSolicitados] = useState([]);
  const [ventasPorCategoria, setVentasPorCategoria] = useState([]);

  useEffect(() => {
    cargarAniosDisponibles();
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [anioSeleccionado]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Configurar fechas filtro
      const fechaInicio = `${anioSeleccionado}-01-01`;
      const fechaFin = `${anioSeleccionado}-12-31`;
      const queryParams = `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;

      // ENDPOINTS OPTIMIZADOS: Traen totales calculados, no data cruda
      const [resumenRes, ventasPeriodoRes, topProductosRes, categoriasRes] = await Promise.all([
        axiosClient.get(`/finanzas/resumen${queryParams}`, { headers }).catch(() => ({ data: { success: false } })),
        axiosClient.get(`/finanzas/ventas-periodo${queryParams}&periodo=mes`, { headers }).catch(() => ({ data: { success: false } })),
        axiosClient.get(`/finanzas/productos-mas-vendidos${queryParams}&limit=10`, { headers }).catch(() => ({ data: { success: false } })),
        axiosClient.get(`/finanzas/ventas-categoria${queryParams}`, { headers }).catch(() => ({ data: { success: false } })),
      ]);

      // Procesar Resumen
      if (resumenRes.data.success) {
        setResumenCards({
          ventasTotales: parseFloat(resumenRes.data.data.total_ventas),
          costos: parseFloat(resumenRes.data.data.total_compras),
          ganancias: parseFloat(resumenRes.data.data.ganancia)
        });
      }

      // Procesar Ventas Mes
      if (ventasPeriodoRes.data.success) {
        const mesesAbrev = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const datosMes = ventasPeriodoRes.data.data;
        
        const chartData = mesesAbrev.map((mes, index) => {
          // Buscar dato del mes (formato YYYY-MM en backend para periodo=mes)
          // Asumiento que backend devuelve fecha como '2025-01'
          const mesNum = (index + 1).toString().padStart(2, '0');
          const fechaBuscar = `${anioSeleccionado}-${mesNum}`;
          const dato = datosMes.find(d => d.fecha && d.fecha.substring(0, 7) === fechaBuscar);
          return {
            mes,
            ventas: dato ? parseFloat(dato.total) : 0
          };
        });
        setVentasPorMes(chartData);
      }

      // Procesar Top Productos
      if (topProductosRes.data.success) {
        const data = topProductosRes.data.data;
        const top5 = data.slice(0, 5).map(p => ({
          ...p,
          cantidad: parseInt(p.cantidad_vendida)
        }));
        
        const top10 = data.map(p => ({
            ...p,
            cantidad: parseInt(p.cantidad_vendida),
            // Asegurar propiedad nombre para gráfico
            nombre: p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre
        }));

        setTopProductos(top5);
        setProductosSolicitados(top10);
      }

      // Procesar Categorías
      if (categoriasRes.data.success) {
        setVentasPorCategoria(categoriasRes.data.data);
      }

    } catch (error) {
      console.error('Error al cargar datos financieros:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarAniosDisponibles = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axiosClient.get('/finanzas/anios-con-movimientos', { headers });
      
      if (response.data.success && response.data.data.length > 0) {
        setAniosDisponibles(response.data.data);
        // Si el año actual no está en la lista, seleccionar el más reciente
        if (!response.data.data.includes(anioSeleccionado)) {
          setAnioSeleccionado(response.data.data[response.data.data.length - 1]);
        }
      } else {
        // Si no hay años con movimientos, usar el año actual
        setAniosDisponibles([new Date().getFullYear()]);
      }
    } catch (error) {
      // Error silencioso, se usa fallback
      // console.error('Error al cargar años disponibles:', error);
      setAniosDisponibles([new Date().getFullYear()]);
    }
  };

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handleGenerarReporte = async () => {
    setGenerandoReporte(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const payload = {
        tipo: tipoReporte,
        anio: anioReporte,
      };
      
      if (tipoReporte === 'mensual') {
        payload.mes = mesReporte;
      } else if (tipoReporte === 'trimestral') {
        payload.trimestre = trimestreReporte;
      }
      
      const response = await axiosClient.post('/finanzas/generar-reporte', payload, { headers });
      
      if (response.data.success) {
        // Abrir el PDF en una nueva pestaña
        const pdfUrl = response.data.url;
        window.open(pdfUrl, '_blank');
        
        setSnackbar({
          open: true,
          message: 'Reporte PDF generado exitosamente',
          severity: 'success'
        });
        setDialogReporte(false);
      }
    } catch (error) {
      console.error('Error al generar reporte:', error);
      setSnackbar({
        open: true,
        message: 'Error al generar el reporte',
        severity: 'error'
      });
    } finally {
      setGenerandoReporte(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('es-EC').format(Math.round(value));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: { xs: 2, md: 4 } }}>
      {/* Header mejorado con gradiente */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorLight} 100%)`,
          color: 'white'
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={3}>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                width: 56, 
                height: 56
              }}
            >
              <AssessmentIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Panel Financiero
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Análisis financiero detallado
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            {/* Selector de año dinámico */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(e.target.value)}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                {aniosDisponibles.map(anio => (
                  <MenuItem key={anio} value={anio}>Año {anio}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Botón generar reporte */}
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => setDialogReporte(true)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)'
                }
              }}
            >
              Generar Reporte
            </Button>
          </Box>
        </Box>
      </Paper>

        {/* Cards Superiores Mejoradas */}
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
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
                      bgcolor: alpha('#4caf50', 0.1),
                      width: 56, 
                      height: 56 
                    }}
                  >
                    <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 28 }} />
                  </Avatar>
                  <Chip 
                    label="Total" 
                    size="small" 
                    sx={{ 
                      bgcolor: alpha('#4caf50', 0.1),
                      color: '#4caf50',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                <Typography color="text.secondary" variant="body2" gutterBottom>
                  Ventas Totales
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#4caf50' }}>
                  {formatCurrency(resumenCards.ventasTotales)}
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50', mr: 0.5 }} />
                  <Typography variant="caption" sx={{ color: '#4caf50' }}>
                    Ingresos del periodo
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
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
                    <TrendingDownIcon sx={{ color: '#f44336', fontSize: 28 }} />
                  </Avatar>
                  <Chip 
                    label="Egresos" 
                    size="small" 
                    sx={{ 
                      bgcolor: alpha('#f44336', 0.1),
                      color: '#f44336',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                <Typography color="text.secondary" variant="body2" gutterBottom>
                  Costos
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#f44336' }}>
                  {formatCurrency(resumenCards.costos)}
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <ShoppingCartIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    Compras realizadas
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 3,
                border: '2px solid',
                borderColor: themeColor,
                bgcolor: alpha(themeColor, 0.05),
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 24px ${themeColorAlpha}`
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha(themeColor, 0.15),
                      width: 56, 
                      height: 56 
                    }}
                  >
                    <MoneyIcon sx={{ color: themeColor, fontSize: 28 }} />
                  </Avatar>
                  <Chip 
                    label="Utilidad" 
                    size="small" 
                    sx={{ 
                    bgcolor: alpha(themeColor, 0.15),
                    color: themeColor,
                    fontWeight: 'bold'
                  }}
                  />
                </Box>
                <Typography color="text.secondary" variant="body2" gutterBottom>
                  Ganancias
                </Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ color: themeColor }}>
                  {formatCurrency(resumenCards.ganancias)}
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <AccountBalanceIcon sx={{ fontSize: 16, color: themeColor, mr: 0.5 }} />
                  <Typography variant="caption" sx={{ color: themeColor, fontWeight: 'bold' }}>
                    Rentabilidad del periodo
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Gráfico de Línea */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Card 
              elevation={0}
              sx={{ 
                mb: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ bgcolor: alpha('#673ab7', 0.1), mr: 2 }}>
                      <ChartIcon sx={{ color: '#673ab7' }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        Ventas durante el Periodo
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Evolución mensual de ventas
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={ventasPorMes}>
                    <defs>
                      <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#673ab7" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#673ab7" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="mes" 
                      stroke="#999"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#999"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ 
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ventas"
                      stroke="#673ab7"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorVentas)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Productos Solicitados */}
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ bgcolor: alpha('#ff9800', 0.1), mr: 2 }}>
                      <TrophyIcon sx={{ color: '#ff9800' }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        Productos más Solicitados
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Top 10 productos por cantidad
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={productosSolicitados}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="nombre" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      stroke="#999"
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis 
                      stroke="#999"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="cantidad" 
                      fill="#ff9800"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Columna Derecha */}
          <Grid size={{ xs: 12, lg: 5 }}>
            {/* Top 5 */}
            <Card 
              elevation={0}
              sx={{ 
                mb: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar sx={{ bgcolor: alpha('#4caf50', 0.1), mr: 2 }}>
                    <TrophyIcon sx={{ color: '#4caf50' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Top 5 Productos más Vendidos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ranking de ventas
                    </Typography>
                  </Box>
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
                            <Typography variant="subtitle2" fontWeight="bold">Cantidad</Typography>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topProductos.map((p, i) => (
                          <TableRow 
                            key={i}
                            sx={{
                              '&:hover': {
                                bgcolor: alpha('#4caf50', 0.05)
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
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={formatNumber(p.cantidad)}
                                size="small"
                                sx={{ 
                                  bgcolor: alpha('#4caf50', 0.1),
                                  color: '#4caf50',
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
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay datos disponibles
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Categorías */}
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar sx={{ bgcolor: alpha('#e91e63', 0.1), mr: 2 }}>
                    <CategoryIcon sx={{ color: '#e91e63' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Ventas por Categoría
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Distribución de ventas
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />
                {ventasPorCategoria.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={ventasPorCategoria} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        type="number"
                        stroke="#999"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="categoria" 
                        width={120}
                        stroke="#999"
                        style={{ fontSize: '11px' }}
                      />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ 
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="ventas" 
                        fill="#e91e63"
                        radius={[0, 8, 8, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay datos de categorías disponibles
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Dialog para generar reporte */}
        <Dialog 
          open={dialogReporte} 
          onClose={() => !generandoReporte && setDialogReporte(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <PdfIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Generar Reporte Financiero
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Tipo de Reporte</InputLabel>
                <Select
                  value={tipoReporte}
                  label="Tipo de Reporte"
                  onChange={(e) => setTipoReporte(e.target.value)}
                >
                  <MenuItem value="anual">Reporte Anual</MenuItem>
                  <MenuItem value="trimestral">Reporte Trimestral</MenuItem>
                  <MenuItem value="mensual">Reporte Mensual</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Año</InputLabel>
                <Select
                  value={anioReporte}
                  label="Año"
                  onChange={(e) => setAnioReporte(e.target.value)}
                >
                  {aniosDisponibles.map(anio => (
                    <MenuItem key={anio} value={anio}>{anio}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {tipoReporte === 'trimestral' && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Trimestre</InputLabel>
                  <Select
                    value={trimestreReporte}
                    label="Trimestre"
                    onChange={(e) => setTrimestreReporte(e.target.value)}
                  >
                    <MenuItem value={1}>Trimestre 1 (Ene - Mar)</MenuItem>
                    <MenuItem value={2}>Trimestre 2 (Abr - Jun)</MenuItem>
                    <MenuItem value={3}>Trimestre 3 (Jul - Sep)</MenuItem>
                    <MenuItem value={4}>Trimestre 4 (Oct - Dic)</MenuItem>
                  </Select>
                </FormControl>
              )}

              {tipoReporte === 'mensual' && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Mes</InputLabel>
                  <Select
                    value={mesReporte}
                    label="Mes"
                    onChange={(e) => setMesReporte(e.target.value)}
                  >
                    {mesesNombres.map((mes, index) => (
                      <MenuItem key={index + 1} value={index + 1}>{mes}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Alert severity="info" sx={{ mt: 2 }}>
                {tipoReporte === 'anual' 
                  ? `Se generará un reporte completo del año ${anioReporte} con estadísticas mensuales.`
                  : tipoReporte === 'trimestral'
                  ? `Se generará un cierre financiero del Trimestre ${trimestreReporte} del año ${anioReporte}.`
                  : `Se generará un reporte del mes de ${mesesNombres[mesReporte - 1]} ${anioReporte} con estadísticas diarias.`
                }
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button 
              onClick={() => setDialogReporte(false)}
              disabled={generandoReporte}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleGenerarReporte}
              variant="contained"
              startIcon={generandoReporte ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
              disabled={generandoReporte}
            >
              {generandoReporte ? 'Generando...' : 'Generar Reporte'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para notificaciones */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
  );
}
