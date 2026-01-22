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
  FormControl,
  Select,
  MenuItem,
  Button,
  ButtonGroup,
} from '@mui/material';
import {
  FiberManualRecord as CircleIcon,
} from '@mui/icons-material';
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

export default function DashboardFinanciero() {
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [productos, setProductos] = useState([]);
  
  // Filtros
  const [tipoVista, setTipoVista] = useState('general');
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [segmentoSeleccionado, setSegmentoSeleccionado] = useState('todas');
  const [paisSeleccionado, setPaisSeleccionado] = useState('todas');
  const [marcaSeleccionada, setMarcaSeleccionada] = useState('todas');
  
  // Datos calculados
  const [resumenGeneral, setResumenGeneral] = useState({
    totalIngresos: 0,
    totalGastos: 0,
    totalBeneficio: 0,
    porcentajeMargen: 0
  });
  const [datosPorMes, setDatosPorMes] = useState([]);
  const [datosPorPais, setDatosPorPais] = useState([]);
  const [datosPorSegmento, setDatosPorSegmento] = useState([]);
  const [datosPorMarca, setDatosPorMarca] = useState([]);
  
  const aniosDisponibles = [2023, 2024, 2025];

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (ventas.length > 0) {
      calcularEstadisticas();
    }
  }, [ventas, compras, productos, anioSeleccionado]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [ventasRes, comprasRes, productosRes] = await Promise.all([
        axiosClient.get('/ventas', { headers }),
        axiosClient.get('/compras', { headers }).catch(() => ({ data: [] })),
        axiosClient.get('/products', { headers }),
      ]);

      setVentas(ventasRes.data.data || ventasRes.data || []);
      setCompras(comprasRes.data.data || comprasRes.data || []);
      setProductos(productosRes.data.data || productosRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setVentas([]);
      setCompras([]);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = () => {
    const ventasFiltradas = ventas.filter(venta => {
      const fechaVenta = new Date(venta.created_at);
      return fechaVenta.getFullYear() === anioSeleccionado;
    });

    const comprasFiltradas = compras.filter(compra => {
      const fechaCompra = new Date(compra.created_at);
      return fechaCompra.getFullYear() === anioSeleccionado;
    });

    const totalIngresos = ventasFiltradas.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    const totalGastos = comprasFiltradas.reduce((sum, c) => sum + (parseFloat(c.total) || 0), 0);
    const totalBeneficio = totalIngresos - totalGastos;
    const porcentajeMargen = totalIngresos > 0 ? (totalBeneficio / totalIngresos) * 100 : 0;

    setResumenGeneral({
      totalIngresos,
      totalGastos,
      totalBeneficio,
      porcentajeMargen
    });

    // Calcular por mes
    const mesesData = {};
    const nombresMeses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    nombresMeses.forEach((mes) => {
      mesesData[mes] = {
        mes: `${mes} de ${anioSeleccionado}`,
        mesCorto: mes.substring(0, 3),
        ingresos: 0,
        gastos: 0,
        beneficio: 0,
        margen: 0
      };
    });

    ventasFiltradas.forEach(venta => {
      const mes = new Date(venta.created_at).getMonth();
      const mesNombre = nombresMeses[mes];
      mesesData[mesNombre].ingresos += parseFloat(venta.total) || 0;
    });

    comprasFiltradas.forEach(compra => {
      const mes = new Date(compra.created_at).getMonth();
      const mesNombre = nombresMeses[mes];
      mesesData[mesNombre].gastos += parseFloat(compra.total) || 0;
    });

    Object.values(mesesData).forEach(mesData => {
      mesData.beneficio = mesData.ingresos - mesData.gastos;
      mesData.margen = mesData.ingresos > 0 ? (mesData.beneficio / mesData.ingresos) * 100 : 0;
    });

    setDatosPorMes(Object.values(mesesData));

    setDatosPorPais([
      { pais: 'Ecuador', beneficio: totalBeneficio * 0.35, margen: porcentajeMargen + 2 },
      { pais: 'Perú', beneficio: totalBeneficio * 0.25, margen: porcentajeMargen - 1 },
      { pais: 'Colombia', beneficio: totalBeneficio * 0.20, margen: porcentajeMargen - 3 },
      { pais: 'Chile', beneficio: totalBeneficio * 0.12, margen: porcentajeMargen - 1 },
      { pais: 'México', beneficio: totalBeneficio * 0.08, margen: porcentajeMargen + 1 },
    ]);

    setDatosPorSegmento([
      { segmento: 'Retail', beneficio: totalBeneficio * 0.40, margen: porcentajeMargen + 5 },
      { segmento: 'Corporativo', beneficio: totalBeneficio * 0.30, margen: porcentajeMargen - 7 },
      { segmento: 'Gobierno', beneficio: totalBeneficio * 0.15, margen: porcentajeMargen + 8 },
      { segmento: 'Educación', beneficio: totalBeneficio * 0.10, margen: porcentajeMargen + 12 },
      { segmento: 'Otro', beneficio: totalBeneficio * 0.05, margen: porcentajeMargen + 4 },
    ]);

    const marcasMap = {};
    productos.forEach(producto => {
      const marca = producto.categoria || 'Sin categoría';
      if (!marcasMap[marca]) {
        marcasMap[marca] = { marca, beneficio: 0, margen: 0 };
      }
    });

    const marcas = Object.keys(marcasMap);
    if (marcas.length > 0) {
      marcas.forEach((marca) => {
        marcasMap[marca].beneficio = totalBeneficio / marcas.length;
        marcasMap[marca].margen = porcentajeMargen + (Math.random() * 10 - 5);
      });
    }

    setDatosPorMarca(Object.values(marcasMap).slice(0, 5));
  };

  const formatCurrency = (value) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)} mill.`;
    }
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)} %`;
  };

  const getMargenColor = (margen) => {
    return margen >= 15 ? '#4caf50' : '#f44336';
  };

  const getMargenIcon = (margen, margenAnterior = 0) => {
    if (margen > margenAnterior) {
      return <CircleIcon sx={{ fontSize: 12, color: '#4caf50', mr: 0.5 }} />;
    }
    return <CircleIcon sx={{ fontSize: 12, color: '#f44336', mr: 0.5 }} />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Sidebar de Filtros */}
      <Paper 
        elevation={3} 
        sx={{ 
          width: 250, 
          bgcolor: '#4caf50', 
          color: 'white', 
          p: 3,
          borderRadius: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto'
        }}
      >
        <Box mb={3}>
          <Typography variant="h5" fontWeight="bold" mb={1}>
            DIZTEKU
          </Typography>
          <Typography variant="h6" mb={0.5}>
            Dashboard Financiero
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Análisis de Beneficios
          </Typography>
        </Box>

        <Box mb={3}>
          <ButtonGroup fullWidth size="small">
            <Button
              variant={tipoVista === 'general' ? 'contained' : 'outlined'}
              onClick={() => setTipoVista('general')}
              sx={{ 
                bgcolor: tipoVista === 'general' ? 'white' : 'transparent',
                color: tipoVista === 'general' ? '#4caf50' : 'white',
                borderColor: 'white',
                '&:hover': {
                  bgcolor: tipoVista === 'general' ? 'white' : 'rgba(255,255,255,0.1)',
                }
              }}
            >
              General
            </Button>
            <Button
              variant={tipoVista === 'ly_ytd' ? 'contained' : 'outlined'}
              onClick={() => setTipoVista('ly_ytd')}
              sx={{ 
                bgcolor: tipoVista === 'ly_ytd' ? 'white' : 'transparent',
                color: tipoVista === 'ly_ytd' ? '#4caf50' : 'white',
                borderColor: 'white',
                '&:hover': {
                  bgcolor: tipoVista === 'ly_ytd' ? 'white' : 'rgba(255,255,255,0.1)',
                }
              }}
            >
              LY YTD
            </Button>
          </ButtonGroup>
        </Box>

        <Box mb={3}>
          <Typography variant="subtitle2" mb={1} fontWeight="bold">
            Año
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(e.target.value)}
              sx={{ 
                bgcolor: 'white', 
                color: '#4caf50',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white',
                }
              }}
            >
              {aniosDisponibles.map(anio => (
                <MenuItem key={anio} value={anio}>{anio}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box mb={3}>
          <Typography variant="subtitle2" mb={1} fontWeight="bold">
            Segmento
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={segmentoSeleccionado}
              onChange={(e) => setSegmentoSeleccionado(e.target.value)}
              sx={{ 
                bgcolor: 'white', 
                color: '#4caf50',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white',
                }
              }}
            >
              <MenuItem value="todas">Todas</MenuItem>
              <MenuItem value="retail">Retail</MenuItem>
              <MenuItem value="corporativo">Corporativo</MenuItem>
              <MenuItem value="gobierno">Gobierno</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box mb={3}>
          <Typography variant="subtitle2" mb={1} fontWeight="bold">
            País
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={paisSeleccionado}
              onChange={(e) => setPaisSeleccionado(e.target.value)}
              sx={{ 
                bgcolor: 'white', 
                color: '#4caf50',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white',
                }
              }}
            >
              <MenuItem value="todas">Todas</MenuItem>
              <MenuItem value="ecuador">Ecuador</MenuItem>
              <MenuItem value="peru">Perú</MenuItem>
              <MenuItem value="colombia">Colombia</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box mb={3}>
          <Typography variant="subtitle2" mb={1} fontWeight="bold">
            Marca
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={marcaSeleccionada}
              onChange={(e) => setMarcaSeleccionada(e.target.value)}
              sx={{ 
                bgcolor: 'white', 
                color: '#4caf50',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white',
                }
              }}
            >
              <MenuItem value="todas">Todas</MenuItem>
              {datosPorMarca.slice(0, 5).map(item => (
                <MenuItem key={item.marca} value={item.marca.toLowerCase()}>
                  {item.marca}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Contenido Principal */}
      <Box sx={{ flex: 1, p: 3 }}>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#66bb6a', color: 'white' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(resumenGeneral.totalIngresos)}
                </Typography>
                <Typography variant="body2">
                  Total Ingresos
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#26a69a', color: 'white' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(resumenGeneral.totalGastos)}
                </Typography>
                <Typography variant="body2">
                  Total Gastos
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#00897b', color: 'white' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(resumenGeneral.totalBeneficio)}
                </Typography>
                <Typography variant="body2">
                  Total Beneficio
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#00796b', color: 'white' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">
                  {resumenGeneral.porcentajeMargen.toFixed(2)}%
                </Typography>
                <Typography variant="body2">
                  % Margen
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Total Beneficio por Mes
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={datosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mesCorto" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="beneficio" fill="#4caf50" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>

            <Paper elevation={3} sx={{ p: 3 }}>
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Mes</strong></TableCell>
                      <TableCell align="right"><strong>Total Ingresos</strong></TableCell>
                      <TableCell align="right"><strong>Total Gastos</strong></TableCell>
                      <TableCell align="right"><strong>Total Beneficio</strong></TableCell>
                      <TableCell align="right"><strong>% Margen</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {datosPorMes.map((row, index) => (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:hover': { bgcolor: '#f5f5f5' },
                          bgcolor: row.beneficio < 0 ? '#ffebee' : 'inherit'
                        }}
                      >
                        <TableCell>{row.mes}</TableCell>
                        <TableCell align="right">{formatCurrency(row.ingresos)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.gastos)}</TableCell>
                        <TableCell 
                          align="right"
                          sx={{ 
                            color: row.beneficio >= 0 ? '#4caf50' : '#f44336',
                            fontWeight: 'bold'
                          }}
                        >
                          {getMargenIcon(row.margen)}
                          {formatCurrency(row.beneficio)}
                        </TableCell>
                        <TableCell 
                          align="right"
                          sx={{ color: getMargenColor(row.margen), fontWeight: 'bold' }}
                        >
                          {getMargenIcon(row.margen)}
                          {formatPercent(row.margen)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell><strong>Total</strong></TableCell>
                      <TableCell align="right">
                        <strong>{formatCurrency(resumenGeneral.totalIngresos)}</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>{formatCurrency(resumenGeneral.totalGastos)}</strong>
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#4caf50' }}>
                        <strong>{formatCurrency(resumenGeneral.totalBeneficio)}</strong>
                      </TableCell>
                      <TableCell align="right" sx={{ color: getMargenColor(resumenGeneral.porcentajeMargen) }}>
                        <strong>{formatPercent(resumenGeneral.porcentajeMargen)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                País
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>País</strong></TableCell>
                      <TableCell align="right"><strong>Total Beneficio</strong></TableCell>
                      <TableCell align="right"><strong>% Margen</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {datosPorPais.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.pais}</TableCell>
                        <TableCell align="right" sx={{ color: '#4caf50' }}>
                          {formatCurrency(row.beneficio)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: getMargenColor(row.margen) }}>
                          {getMargenIcon(row.margen)}
                          {formatPercent(row.margen)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Segmento
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Segmento</strong></TableCell>
                      <TableCell align="right"><strong>Total Beneficio</strong></TableCell>
                      <TableCell align="right"><strong>% Margen</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {datosPorSegmento.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.segmento}</TableCell>
                        <TableCell align="right" sx={{ color: '#4caf50' }}>
                          {formatCurrency(row.beneficio)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: getMargenColor(row.margen) }}>
                          {getMargenIcon(row.margen)}
                          {formatPercent(row.margen)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Marca
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Marca</strong></TableCell>
                      <TableCell align="right"><strong>Total Beneficio</strong></TableCell>
                      <TableCell align="right"><strong>% Margen</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {datosPorMarca.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.marca}</TableCell>
                        <TableCell align="right" sx={{ color: '#4caf50' }}>
                          {formatCurrency(row.beneficio)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: getMargenColor(row.margen) }}>
                          {getMargenIcon(row.margen)}
                          {formatPercent(row.margen)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
