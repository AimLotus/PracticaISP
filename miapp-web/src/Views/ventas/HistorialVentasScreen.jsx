import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Avatar,
  Divider,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  TablePagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';

export default function HistorialVentasScreen() {
  const { user } = useAuth();
  
  // Configuración de colores basada en el rol del usuario (rol_id: 3 = dueño)
  const themeColor = user?.rol_id === 3 ? '#ff9800' : '#4caf50';
  const themeColorLight = user?.rol_id === 3 ? '#ffb74d' : '#66bb6a';
  const themeColorAlpha = user?.rol_id === 3 ? 'rgba(255, 152, 0, 0.3)' : 'rgba(76, 175, 80, 0.3)';

  // Datos
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filtros
  const [rangoTiempo, setRangoTiempo] = useState('semana');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Mensajes
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('success');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Modal de detalles
  const [ventaSeleccionada] = useState(null);
  const [openDetalles, setOpenDetalles] = useState(false);
  
  // Modal de PDF Preview
  const [pdfUrl, setPdfUrl] = useState('');
  const [openPdfModal, setOpenPdfModal] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const mostrarMensaje = (msg, tipo = 'success') => {
    setMensaje(msg);
    setTipoMensaje(tipo);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  useEffect(() => {
    cargarVentas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangoTiempo]);

  const cargarVentas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      let params = {};
      
      // Calcular fechas si no es "todo" y no hay fecha filtro manual (la fecha filtro manual se maneja en frontend sobre los datos ya traídos o podría enviarse aquí, 
      // pero para optimizar carga inicial usaremos el rango. Si el usuario filtra por fecha específica debería estar dentro del rango o cambiar rango a "todo" implícitamente?
      // Mejor: el rango define qué datos traemos del servidor. El filtro manual filtra sobre eso.)
      
      const today = new Date();
      today.setHours(0,0,0,0);
      const endDate = new Date();
      endDate.setHours(23,59,59,999);
      
      let startDate = null;
      
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
      
      if (startDate) {
          params.start_date = startDate.toISOString().split('T')[0];
          params.end_date = endDate.toISOString().split('T')[0];
      }

      const res = await axiosClient.get('/ventas', {
        headers: { Authorization: `Bearer ${token}` },
        params: params
      });

      // Asegurar que total sea número
      const ventasConTotalSeguro = res.data.map((v) => ({
        ...v,
        total: Number(v.total) || 0,
      }));

      setVentas(ventasConTotalSeguro);
    } catch (error) {
      mostrarMensaje('Error al cargar ventas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const abrirFactura = async (ventaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axiosClient.get(`/ventas/${ventaId}/factura`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const pdfUrl = response.data.url;
      if (!pdfUrl) {
        mostrarMensaje('URL de factura no encontrada', 'warning');
        return;
      }

      // Abrir PDF en nueva pestaña
      window.open(pdfUrl, '_blank');
      mostrarMensaje('Factura abierta en nueva pestaña', 'success');
    } catch (error) {
      mostrarMensaje('Error al abrir la factura', 'error');
    }
  };
  
  // Función para vista previa del PDF en modal
  const abrirVistaPreviaFactura = async (ventaId) => {
    setLoadingPdf(true);
    setOpenPdfModal(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axiosClient.get(`/ventas/${ventaId}/factura`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const url = response.data.url;
      if (!url) {
        mostrarMensaje('URL de factura no encontrada', 'warning');
        setOpenPdfModal(false);
        return;
      }

      setPdfUrl(url);
    } catch (error) {
      mostrarMensaje('Error al cargar la factura', 'error');
      setOpenPdfModal(false);
    } finally {
      setLoadingPdf(false);
    }
  };

  // Filtrar ventas por fecha exacta
  const filtrarVentas = () => {
    let resultado = ventas;

    // Filtro por fecha
    if (fechaFiltro) {
      resultado = resultado.filter((v) => {
        const fechaVenta = new Date(v.created_at);
        const fechaFiltroDate = new Date(fechaFiltro + 'T00:00:00');
        return (
          fechaVenta.getFullYear() === fechaFiltroDate.getFullYear() &&
          fechaVenta.getMonth() === fechaFiltroDate.getMonth() &&
          fechaVenta.getDate() === fechaFiltroDate.getDate()
        );
      });
    }

    // Filtro por búsqueda (cliente, factura)
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(
        (v) =>
          (v.client?.nombre || '').toLowerCase().includes(termino) ||
          (v.numero_factura || '').toLowerCase().includes(termino)
      );
    }

    return resultado;
  };

  const limpiarFiltros = () => {
    setFechaFiltro('');
    setBusqueda('');
    setPage(0);
  };

  const calcularEstadisticas = (ventasArray) => {
    if (ventasArray.length === 0) {
      return { total: 0, promedio: 0, minimo: 0, maximo: 0 };
    }

    const montos = ventasArray.map((v) => Number(v.total || 0));
    const total = montos.reduce((a, b) => a + b, 0);
    const promedio = total / montos.length;
    const minimo = Math.min(...montos);
    const maximo = Math.max(...montos);

    return { total, promedio, minimo, maximo };
  };

  const ventasFiltradas = filtrarVentas();
  const estadisticas = calcularEstadisticas(ventasFiltradas);

  // Paginación
  const ventasPaginadas = ventasFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };



  // Loading inicial
  if (loading && ventas.length === 0) {
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
    <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header con gradiente */}
      <Paper
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorLight} 100%)`,
          borderRadius: 3,
          p: 3,
          mb: 3,
          color: 'white',
          boxShadow: `0 8px 24px ${themeColorAlpha}`,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                width: 56,
                height: 56,
              }}
            >
              <HistoryIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Historial de Ventas
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Consulta y gestiona todas tus ventas registradas
              </Typography>
            </Box>
          </Box>
          <Chip
            label={`${ventas.length} Venta${ventas.length !== 1 ? 's' : ''}`}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.9rem',
            }}
          />
        </Box>
      </Paper>

      {/* Estadísticas */}
      <Grid container spacing={3} mb={3}>
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
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              },
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Ventas
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                    {ventasFiltradas.length}
                  </Typography>
                  <Chip label="Registradas" size="small" sx={{ mt: 1, bgcolor: alpha(themeColor, 0.1), color: themeColor }} />
                </Box>
                <Avatar
                  sx={{
                    bgcolor: (theme) => alpha('#f5576c', 0.1),
                    color: '#f5576c',
                    width: 56,
                    height: 56,
                  }}
                >
                  <ReceiptIcon sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

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
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              },
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ingresos Totales
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                    ${estadisticas.total.toFixed(2)}
                  </Typography>
                  <Chip label="Acumulado" size="small" sx={{ mt: 1 }} color="primary" />
                </Box>
                <Avatar
                  sx={{
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    width: 56,
                    height: 56,
                  }}
                >
                  <AttachMoneyIcon sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

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
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              },
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Promedio
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                    ${estadisticas.promedio.toFixed(2)}
                  </Typography>
                  <Chip label="Por venta" size="small" sx={{ mt: 1, bgcolor: alpha(themeColor, 0.1), color: themeColor }} />
                </Box>
                <Avatar
                  sx={{
                    bgcolor: (theme) => alpha('#4caf50', 0.1),
                    color: '#4caf50',
                    width: 56,
                    height: 56,
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

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
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              },
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Monto Mayor
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                    ${estadisticas.maximo.toFixed(2)}
                  </Typography>
                  <Chip label="Máximo" size="small" sx={{ mt: 1 }} color="warning" />
                </Box>
                <Avatar
                  sx={{
                    bgcolor: (theme) => alpha('#ff9800', 0.1),
                    color: '#ff9800',
                    width: 56,
                    height: 56,
                  }}
                >
                  <ReceiptIcon sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Card: Filtros */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          },
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar
              sx={{
                mr: 1.5,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
              }}
            >
              <FilterListIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Filtros y Búsqueda
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Utiliza los filtros para encontrar ventas específicas
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                 <InputLabel id="periodo-select-label">Periodo</InputLabel>
                 <Select
                   labelId="periodo-select-label"
                   value={rangoTiempo}
                   label="Periodo"
                   onChange={(e) => {
                     setRangoTiempo(e.target.value);
                     setFechaFiltro(''); // Limpiar fecha específica al cambiar rango general
                     setPage(0);
                   }}
                 >
                   <MenuItem value="semana">Últimos 7 días</MenuItem>
                   <MenuItem value="mes">Último Mes</MenuItem>
                   <MenuItem value="anio">Último Año</MenuItem>
                   <MenuItem value="todo">Todo el historial</MenuItem>
                 </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                placeholder="Buscar por cliente o factura..."
                variant="outlined"
                size="small"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPage(1);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#999' }} />
                    </InputAdornment>
                  ),
                  endAdornment: busqueda && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setBusqueda('');
                          setPage(1);
                        }}
                        sx={{ cursor: 'pointer' }}
                      >
                        <ClearIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label="Filtrar por fecha"
                type="date"
                value={fechaFiltro}
                onChange={(e) => {
                  setFechaFiltro(e.target.value);
                  setPage(1);
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              {(busqueda || fechaFiltro) && (
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={limpiarFiltros}
                  fullWidth
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                  }}
                >
                  Limpiar Filtros
                </Button>
              )}
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              {(busqueda || fechaFiltro) && (
                <Chip
                  icon={<FilterListIcon />}
                  label={`${ventasFiltradas.length} resultado${ventasFiltradas.length !== 1 ? 's' : ''}`}
                  color="primary"
                  variant="outlined"
                  sx={{ width: '100%' }}
                />
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Card: Tabla de Ventas */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          },
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <Avatar
                sx={{
                  mr: 1.5,
                  bgcolor: (theme) => alpha('#f5576c', 0.1),
                  color: '#f5576c',
                }}
              >
                <ReceiptIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Ventas Registradas
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {ventasFiltradas.length} de {ventas.length} total
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`${ventasFiltradas.length} venta${ventasFiltradas.length !== 1 ? 's' : ''}`}
              sx={{ fontSize: '0.9rem', bgcolor: alpha(themeColor, 0.1), color: themeColor, fontWeight: 'bold' }}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : ventasFiltradas.length === 0 ? (
            <Box
              sx={{
                py: 4,
                textAlign: 'center',
                bgcolor: '#f9f9f9',
                borderRadius: '8px',
                border: '2px dashed #ddd',
              }}
            >
              <ReceiptIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
              <Typography color="textSecondary" mb={1}>
                No hay ventas registradas
              </Typography>
              {(busqueda || fechaFiltro) && (
                <Typography variant="caption" color="textSecondary">
                  Intenta con otros filtros
                </Typography>
              )}
            </Box>
          ) : (
            <Box>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>
                        Factura
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>
                        Cliente
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: '#333' }}>
                        Total
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>
                        Fecha
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#333' }}>
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ventasPaginadas.map((venta) => (
                      <TableRow
                        key={venta.id}
                        sx={{
                          '&:hover': { bgcolor: '#f9f9f9' },
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: '0.75rem',
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main',
                              }}
                            >
                              {(venta.numero_factura || `FAC-${venta.id}`).charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight="bold">
                              {venta.numero_factura || `FAC-${venta.id}`}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: '0.75rem',
                              }}
                            >
                              {(venta.client?.nombre || 'N/A').charAt(0)}
                            </Avatar>
                            <Typography variant="body2" sx={{ color: '#333' }}>
                              {venta.client?.nombre || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{ color: '#667eea' }}
                          >
                            ${Number(venta.total || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <DateRangeIcon sx={{ fontSize: 16, color: '#999' }} />
                            <Typography variant="body2" color="textSecondary">
                              {new Date(venta.created_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Vista previa de factura">
                            <IconButton
                              color="primary"
                              onClick={() => abrirVistaPreviaFactura(venta.id)}
                              size="small"
                              sx={{
                                '&:hover': { bgcolor: '#e3f2fd' },
                              }}
                            >
                              <VisibilityIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={ventasFiltradas.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage={"Filas por página"}
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      <Dialog
        open={openDetalles}
        onClose={() => setOpenDetalles(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        {ventaSeleccionada && (
          <>
            <Box
              sx={{
                background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorLight} 100%)`,
                color: 'white',
                p: 2.5,
              }}
            >
              <DialogTitle sx={{ p: 0, color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>
                Detalles de la Venta
              </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 2.5 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">
                    Número de Factura
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {ventaSeleccionada.numero_factura || `FAC-${ventaSeleccionada.id}`}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">
                    Cliente
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {ventaSeleccionada.client?.nombre || 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary">
                    Total
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#667eea' }}>
                    ${Number(ventaSeleccionada.total || 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="textSecondary">
                    Fecha
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {new Date(ventaSeleccionada.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button
                onClick={() => setOpenDetalles(false)}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                }}
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  abrirFactura(ventaSeleccionada.id);
                  setOpenDetalles(false);
                }}
                variant="contained"
                startIcon={<DownloadIcon />}
                sx={{
                  background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorLight} 100%)`,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                }}
              >
                Descargar PDF
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal de Vista Previa PDF */}
      <Dialog
        open={openPdfModal}
        onClose={() => {
          setOpenPdfModal(false);
          setPdfUrl('');
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorLight} 100%)`,
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Vista Previa de Factura
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                if (pdfUrl) {
                  window.open(pdfUrl, '_blank');
                  mostrarMensaje('Descargando factura...', 'success');
                }
              }}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              Descargar
            </Button>
            <IconButton
              onClick={() => {
                setOpenPdfModal(false);
                setPdfUrl('');
              }}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {loadingPdf ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="400px"
              flexDirection="column"
              gap={2}
            >
              <CircularProgress size={60} sx={{ color: themeColor }} />
              <Typography variant="body1" color="text.secondary">
                Cargando vista previa...
              </Typography>
            </Box>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="Vista previa de factura"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                flex: 1,
              }}
            />
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="400px"
            >
              <Typography variant="body1" color="text.secondary">
                No se pudo cargar el PDF
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={tipoMensaje}
          sx={{ width: '100%' }}
        >
          {mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
}
