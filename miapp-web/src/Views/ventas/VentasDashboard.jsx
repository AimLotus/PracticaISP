import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Paper,
  alpha,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';

export default function VentasDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Configuración de colores basada en el rol del usuario (rol_id: 3 = dueño)
  const themeColor = user?.rol_id === 3 ? '#ff9800' : '#4caf50';
  const themeColorLight = user?.rol_id === 3 ? '#ffb74d' : '#66bb6a';
  const themeColorAlpha = user?.rol_id === 3 ? 'rgba(255, 152, 0, 0.3)' : 'rgba(76, 175, 80, 0.3)';

  const [loading, setLoading] = useState(true);
  const [rangoTiempo, setRangoTiempo] = useState('semana'); // Default: última semana
  const [stats, setStats] = useState({
    clientesCount: 0,
    ingresosMes: 0,
    ingresosHoy: 0,
    ventasTotales: 0,
    ingresosMesAnterior: 0,
  });
  const [ventasPorDia, setVentasPorDia] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [ultimasVentas, setUltimasVentas] = useState([]);
  const [distribucionIngresos, setDistribucionIngresos] = useState([]);

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangoTiempo]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Calcular fechas para filtro
      let startDate = null;
      const endDate = new Date(); // Hoy
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Inicio del día para cálculos precisos

      if (rangoTiempo === 'semana') {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
      } else if (rangoTiempo === 'mes') {
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
      } else if (rangoTiempo === 'anio') {
         startDate = new Date(today);
         startDate.setFullYear(today.getFullYear() - 1);
      }
      // 'todo' => startDate permanece null

      // Cargar estadísticas básicas (globales)
      const [resClientes, resVentas] = await Promise.all([
        axiosClient.get('/clientes/count', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axiosClient.get('/ventas/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats({
        clientesCount: resClientes.data.totalClientes ?? 0,
        ingresosMes: resVentas.data.ingresosMes ?? 0,
        ingresosHoy: resVentas.data.ingresosHoy ?? 0,
        ventasTotales: resVentas.data.totalVentas ?? 0,
        ingresosMesAnterior: resVentas.data.ingresosMesAnterior ?? 0,
      });

      // Preparar parámetros para la consulta de ventas
      const params = {};
      if (startDate) {
        params.start_date = startDate.toISOString().split('T')[0];
        params.end_date = endDate.toISOString().split('T')[0];
      }

      // Cargar ventas filtradas para gráficos
      const resVentasCompletas = await axiosClient.get('/ventas', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      // Procesar ventas por día (últimos 7 días o rango seleccionado)
      // Nota: procesarVentasPorDia asume 7 días por defecto, habría que ajustarlo si se quiere gráfico dinámico mayor a 7 días,
      // pero por ahora mantendremos la lógica visual, solo que los datos serán limitados.
      // Si el rango es mayor a semana, el gráfico de "últimos 7 días" podría mostrar solo los últimos 7 de ese rango o necesitar adaptación.
      // Vamos a dejar que procese lo que llegue, pero `procesarVentasPorDia` actualmente genera los últimos 7 días fijos.
      // Para optimizar, si el rango es 'todo' o 'anio', procesarVentasPorDia solo mostrará 7 días recientes si la función lo fuerza.
      
      procesarVentasPorDia(resVentasCompletas.data);

      // Procesar productos más vendidos
      procesarTopProductos(resVentasCompletas.data);

      // Procesar últimas ventas
      procesarUltimasVentas(resVentasCompletas.data);

      // Procesar distribución de ingresos
      procesarDistribucionIngresos(resVentasCompletas.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const procesarVentasPorDia = (ventas) => {
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

    // Sumar ventas por día
    ventas.forEach((venta) => {
      const fechaVenta = venta.fecha.split('T')[0];
      const diaEncontrado = ultimos7Dias.find((d) => d.fecha === fechaVenta);
      if (diaEncontrado) {
        diaEncontrado.total += parseFloat(venta.total || 0);
        diaEncontrado.cantidad += 1;
      }
    });

    setVentasPorDia(ultimos7Dias);
  };

  const procesarTopProductos = (ventas) => {
    const productosMap = new Map();

    ventas.forEach((venta) => {
      const items = venta.items || venta.detalles || [];
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

    // Convertir a array y ordenar por cantidad vendida
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

  const procesarUltimasVentas = (ventas) => {
    // Ordenar por fecha descendente y tomar las últimas 5
    const ultimas = ventas
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 5)
      .map((venta) => ({
        id: venta.id,
        cliente: venta.client?.nombre || 'Cliente desconocido',
        monto: parseFloat(venta.total || 0),
        fecha: new Date(venta.fecha).toLocaleDateString('es-ES'),
        estado: venta.estado || 'Completado',
      }));

    setUltimasVentas(ultimas);
  };

  const procesarDistribucionIngresos = (ventas) => {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anio = hoy.getFullYear();

    let ventasHoy = 0;
    let ventasEstaSemana = 0;
    let ventasEsteMes = 0;

    const haceSiete = new Date(hoy);
    haceSiete.setDate(haceSiete.getDate() - 7);

    ventas.forEach((venta) => {
      const fechaVenta = new Date(venta.fecha);
      const monto = parseFloat(venta.total || 0);

      if (
        fechaVenta.toDateString() === hoy.toDateString()
      ) {
        ventasHoy += monto;
      }

      if (fechaVenta >= haceSiete) {
        ventasEstaSemana += monto;
      }

      if (fechaVenta.getMonth() === mesActual && fechaVenta.getFullYear() === anio) {
        ventasEsteMes += monto;
      }
    });

    const distribucion = [
      { name: 'Hoy', value: parseFloat(ventasHoy.toFixed(2)) },
      { name: 'Esta Semana', value: parseFloat((ventasEstaSemana - ventasHoy).toFixed(2)) },
      { name: 'Este Mes', value: parseFloat((ventasEsteMes - ventasEstaSemana).toFixed(2)) },
    ];

    setDistribucionIngresos(distribucion.filter((d) => d.value > 0));
  };

  const formatearMonto = (monto) => {
    return typeof monto === 'number' ? `$${monto.toFixed(2)}` : '$0.00';
  };

  const calcularTendencia = (actual, anterior) => {
    if (anterior === 0) return { cambio: 0, esPositivo: true };
    const cambio = ((actual - anterior) / anterior) * 100;
    return { cambio: cambio.toFixed(1), esPositivo: cambio >= 0 };
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

  const tendenciaIngresos = calcularTendencia(stats.ingresosMes, stats.ingresosMesAnterior);
  const COLORES_DISTRIBUCION = [themeColor, '#1976d2', '#ff9800'];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header mejorado con gradiente consistente */}
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
          <Box display="flex" alignItems="center">
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                width: 56, 
                height: 56,
                mr: 2
              }}
            >
              <TrendingUpIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Dashboard de Ventas
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Resumen y análisis de tus ventas
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel 
                id="rango-tiempo-label" 
                sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  '&.Mui-focused': { color: 'white' }
                }}
              >
                Periodo
              </InputLabel>
              <Select
                labelId="rango-tiempo-label"
                value={rangoTiempo}
                label="Periodo"
                onChange={(e) => setRangoTiempo(e.target.value)}
                sx={{
                  color: 'white',
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                  '.MuiSvgIcon-root': {
                    color: 'white',
                  },
                }}
              >
                <MenuItem value="semana">Últimos 7 días</MenuItem>
                <MenuItem value="mes">Último Mes</MenuItem>
                <MenuItem value="anio">Último Año</MenuItem>
                <MenuItem value="todo">Todo el historial</MenuItem>
              </Select>
            </FormControl>
            <Chip 
              label={`${stats.ventasTotales} Ventas`}
              icon={<ShoppingCartIcon sx={{ color: 'white !important' }} />}
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
        </Box>
      </Paper>

      {/* Estadísticas Principales Mejoradas */}
      <Grid container spacing={3} mb={4}>
        {/* Clientes Registrados */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                    bgcolor: alpha('#1976d2', 0.1),
                    width: 56, 
                    height: 56 
                  }}
                >
                  <PeopleIcon sx={{ color: '#1976d2', fontSize: 28 }} />
                </Avatar>
                <Chip 
                  label="Activos" 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha(themeColor, 0.1),
                    color: themeColor,
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Clientes Registrados
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="#1976d2">
                {stats.clientesCount}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUpIcon sx={{ fontSize: 16, color: themeColor, mr: 0.5 }} />
                <Typography variant="caption" sx={{ color: themeColor }}>
                  Total de clientes
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Ingresos del Mes */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                    bgcolor: alpha('#ff9800', 0.1),
                    width: 56, 
                    height: 56 
                  }}
                >
                  <CalendarMonthIcon sx={{ color: '#ff9800', fontSize: 28 }} />
                </Avatar>
                <Chip 
                  label="Mes" 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha('#ff9800', 0.1),
                    color: '#ff9800',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Ingresos del Mes
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#ff9800' }}>
                {formatearMonto(stats.ingresosMes)}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                {tendenciaIngresos.esPositivo ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50', mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: '#f44336', mr: 0.5 }} />
                )}
                <Typography 
                  variant="caption" 
                  sx={{ color: tendenciaIngresos.esPositivo ? '#4caf50' : '#f44336' }}
                >
                  {tendenciaIngresos.cambio}% vs. mes anterior
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Ingresos de Hoy */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                    bgcolor: alpha('#2196f3', 0.1),
                    width: 56, 
                    height: 56 
                  }}
                >
                  <CalendarTodayIcon sx={{ color: '#2196f3', fontSize: 28 }} />
                </Avatar>
                <Chip 
                  label="Hoy" 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha('#2196f3', 0.1),
                    color: '#2196f3',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Ingresos de Hoy
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#2196f3' }}>
                {formatearMonto(stats.ingresosHoy)}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Día actual
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Ventas Totales */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                  <ShoppingCartIcon sx={{ color: themeColor, fontSize: 28 }} />
                </Avatar>
                <Chip 
                  label="Total" 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha(themeColor, 0.15),
                    color: themeColor,
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Ventas Totales
              </Typography>
              <Typography variant="h3" fontWeight="bold" sx={{ color: themeColor }}>
                {Math.floor(stats.ventasTotales)}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50', mr: 0.5 }} />
                <Typography variant="caption" sx={{ color: themeColor, fontWeight: 'bold' }}>
                  Transacciones realizadas
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos Principales */}
      <Grid container spacing={3} mb={4}>
        {/* Gráfico de Ventas por Día */}
        <Grid size={{ xs: 12, lg: 8 }}>
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
                  <Avatar sx={{ bgcolor: alpha('#667eea', 0.1), mr: 2 }}>
                    <TrendingUpIcon sx={{ color: '#667eea' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Ventas de los Últimos 7 Días
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tendencia de ventas diarias
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={ventasPorDia}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#13a100ff" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#13a100ff" stopOpacity={0.1} />
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
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Ventas"
                    stroke="#13a100ff"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Distribución de Ingresos */}
        <Grid size={{ xs: 12, lg: 4 }}>
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
                <Avatar sx={{ bgcolor: alpha('#ff9800', 0.1), mr: 2 }}>
                  <AttachMoneyIcon sx={{ color: '#ff9800' }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Distribución de Ingresos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ingresos por periodo
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 3 }} />
              {distribucionIngresos.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={distribucionIngresos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distribucionIngresos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORES_DISTRIBUCION[index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatearMonto(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay datos disponibles
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Productos y Últimas Ventas */}
      <Grid container spacing={3} mb={4}>
        {/* Top 5 Productos Más Vendidos */}
        <Grid size={{ xs: 12, md: 6 }}>
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
                <Avatar sx={{ bgcolor: alpha('#9c27b0', 0.1), mr: 2 }}>
                  <ShoppingCartIcon sx={{ color: '#9c27b0' }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Top 5 Productos Más Vendidos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Productos con mayor demanda
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 3 }} />
              {topProductos.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={topProductos} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      type="number"
                      stroke="#999"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      dataKey="nombre" 
                      type="category" 
                      width={100}
                      stroke="#999"
                      style={{ fontSize: '11px' }}
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
                      name="Cantidad" 
                      fill="#9c27b0" 
                      radius={[0, 8, 8, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay datos de productos
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Últimas Ventas */}
        <Grid size={{ xs: 12, md: 6 }}>
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
                  <Avatar sx={{ bgcolor: alpha('#1976d2', 0.1), mr: 2 }}>
                    <CalendarTodayIcon sx={{ color: '#1976d2' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Últimas Ventas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Transacciones recientes
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="text"
                  color="primary"
                  size="small"
                  onClick={() => navigate('/ventas/historial')}
                  sx={{ fontWeight: 'bold' }}
                >
                  Ver Historial
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <TableContainer sx={{ maxHeight: 340, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha('#f5f5f5', 0.8) }}>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">Cliente</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight="bold">Monto</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">Fecha</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">Estado</Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ultimasVentas.length > 0 ? (
                      ultimasVentas.map((venta) => (
                        <TableRow
                          key={venta.id}
                          sx={{
                            '&:hover': {
                              bgcolor: alpha('#1976d2', 0.05),
                            },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2">{venta.cliente}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={formatearMonto(venta.monto)}
                              size="small"
                              sx={{
                                bgcolor: alpha(themeColor, 0.1),
                                color: themeColor,
                                fontWeight: 'bold'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{venta.fecha}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={venta.estado}
                              size="small"
                              sx={{
                                bgcolor:
                                  venta.estado === 'Completado'
                                    ? alpha(themeColor, 0.1)
                                    : venta.estado === 'Pendiente'
                                      ? alpha('#ff9800', 0.1)
                                      : alpha('#f44336', 0.1),
                                color:
                                  venta.estado === 'Completado'
                                    ? themeColor
                                    : venta.estado === 'Pendiente'
                                      ? '#ff9800'
                                      : '#f44336',
                                fontWeight: 'bold',
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No hay ventas registradas
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
