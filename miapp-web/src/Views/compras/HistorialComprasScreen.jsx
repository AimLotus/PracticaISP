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
  alpha,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  TablePagination,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axiosClient from '../../api/axiosClient';

export default function HistorialComprasScreen() {
  // Datos
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filtros
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [busquedaProveedor, setBusquedaProveedor] = useState('');

  // Mensajes
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('success');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
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
    cargarCompras();
  }, []);

  const cargarCompras = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosClient.get('/compras', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Asegurar que total sea número
      const comprasConTotalSeguro = res.data.map((c) => ({
        ...c,
        total: Number(c.total) || 0,
      }));

      setCompras(comprasConTotalSeguro);
    } catch (error) {
      mostrarMensaje('Error al cargar compras', 'error');
    } finally {
      setLoading(false);
    }
  };

  const abrirReporte = async (compraId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axiosClient.get(`/compras/${compraId}/reporte`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const pdfUrl = response.data.url;
      if (!pdfUrl) {
        mostrarMensaje('URL de reporte no encontrada', 'warning');
        return;
      }

      // Abrir PDF en nueva pestaña
      window.open(pdfUrl, '_blank');
      mostrarMensaje('Reporte abierto en nueva pestaña', 'success');
    } catch (error) {
      mostrarMensaje('Error al abrir el reporte', 'error');
    }
  };
  
  // Función para vista previa del PDF en modal
  const abrirVistaPreviaReporte = async (compraId) => {
    setLoadingPdf(true);
    setOpenPdfModal(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axiosClient.get(`/compras/${compraId}/reporte`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const url = response.data.url;
      if (!url) {
        mostrarMensaje('URL de reporte no encontrada', 'warning');
        setOpenPdfModal(false);
        return;
      }

      setPdfUrl(url);
    } catch (error) {
      mostrarMensaje('Error al cargar el reporte', 'error');
      setOpenPdfModal(false);
    } finally {
      setLoadingPdf(false);
    }
  };

  // Filtrar compras por fecha y proveedor
  const filtrarCompras = () => {
    let resultado = [...compras];

    // Filtro por fecha
    if (fechaFiltro) {
      resultado = resultado.filter((c) => {
        const fechaCompra = new Date(c.created_at);
        const fechaFiltroDate = new Date(fechaFiltro + 'T00:00:00');
        return (
          fechaCompra.getFullYear() === fechaFiltroDate.getFullYear() &&
          fechaCompra.getMonth() === fechaFiltroDate.getMonth() &&
          fechaCompra.getDate() === fechaFiltroDate.getDate()
        );
      });
    }

    // Filtro por búsqueda de proveedor
    if (busquedaProveedor) {
      const busquedaLower = busquedaProveedor.toLowerCase();
      resultado = resultado.filter((c) => {
        const nombreProveedor = (c.provider?.nombre || '').toLowerCase();
        const numeroFactura = (c.numero_factura || '').toLowerCase();
        return nombreProveedor.includes(busquedaLower) || numeroFactura.includes(busquedaLower);
      });
    }

    return resultado;
  };

  const limpiarFiltros = () => {
    setFechaFiltro('');
    setBusquedaProveedor('');
    setPage(0);
  };

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    const total = comprasFiltradas.reduce((sum, c) => sum + Number(c.total || 0), 0);
    const cantidad = comprasFiltradas.length;
    const promedio = cantidad > 0 ? total / cantidad : 0;
    return { total, cantidad, promedio };
  };

  const comprasFiltradas = filtrarCompras();
  const estadisticas = calcularEstadisticas();

  // Paginación Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Loading inicial
  if (loading && compras.length === 0) {
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
      {/* Header mejorado con gradiente */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ff9800 0%, #e78b00 100%)',
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
              <HistoryIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Historial de Compras
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Consulta y administra tus compras realizadas
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={`${compras.length} ${compras.length === 1 ? 'Compra' : 'Compras'}`}
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
      </Paper>

      {/* Estadísticas */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 4 }}>
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
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar sx={{ bgcolor: alpha('#1976d2', 0.1), width: 56, height: 56, margin: '0 auto', mb: 2 }}>
                <ShoppingCartIcon sx={{ color: '#1976d2', fontSize: 28 }} />
              </Avatar>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Compras
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="#1976d2">
                {estadisticas.cantidad}
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50', mr: 0.5 }} />
                <Typography variant="caption" sx={{ color: '#4caf50' }}>
                  Registradas
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
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
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar sx={{ bgcolor: alpha('#4caf50', 0.1), width: 56, height: 56, margin: '0 auto', mb: 2 }}>
                <AttachMoneyIcon sx={{ color: '#4caf50', fontSize: 28 }} />
              </Avatar>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Gastado
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="#4caf50">
                ${estadisticas.total.toFixed(2)}
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                <AttachMoneyIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Inversión total
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
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
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar sx={{ bgcolor: alpha('#ff9800', 0.1), width: 56, height: 56, margin: '0 auto', mb: 2 }}>
                <ReceiptIcon sx={{ color: '#ff9800', fontSize: 28 }} />
              </Avatar>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Promedio por Compra
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="#ff9800">
                ${estadisticas.promedio.toFixed(2)}
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Valor promedio
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Card: Filtros Mejorados */}
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
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: alpha('#ff9800', 0.1), mr: 2 }}>
                <FilterListIcon sx={{ color: '#ff9800' }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">Filtros de Búsqueda</Typography>
                <Typography variant="body2" color="text.secondary">
                  Filtra las compras por fecha o proveedor
                </Typography>
              </Box>
            </Box>
            {(fechaFiltro || busquedaProveedor) && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<ClearIcon />}
                onClick={limpiarFiltros}
                sx={{ borderRadius: 2 }}
              >
                Limpiar Filtros
              </Button>
            )}
          </Box>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Buscar por proveedor o factura"
                placeholder="Ingrese nombre del proveedor o número de factura..."
                value={busquedaProveedor}
                onChange={(e) => setBusquedaProveedor(e.target.value)}
                fullWidth
                sx={{ borderRadius: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Filtrar por fecha"
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                fullWidth
                sx={{ borderRadius: 2 }}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
          {(fechaFiltro || busquedaProveedor) && (
            <Box display="flex" gap={1} mt={2} flexWrap="wrap">
              {fechaFiltro && (
                <Chip
                  label={`Fecha: ${new Date(fechaFiltro).toLocaleDateString('es-ES')}`}
                  onDelete={() => setFechaFiltro('')}
                  color="primary"
                  variant="outlined"
                />
              )}
              {busquedaProveedor && (
                <Chip
                  label={`Búsqueda: "${busquedaProveedor}"`}
                  onDelete={() => setBusquedaProveedor('')}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Card: Tabla de Compras */}
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
              <DescriptionIcon sx={{ color: '#9c27b0' }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Compras Registradas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {comprasFiltradas.length} {comprasFiltradas.length === 1 ? 'compra encontrada' : 'compras encontradas'}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : comprasFiltradas.length === 0 ? (
            <Box 
              sx={{ 
                p: 6, 
                textAlign: 'center',
                bgcolor: alpha('#f5f5f5', 0.5),
                borderRadius: 2
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: alpha('#ccc', 0.2), 
                  width: 80, 
                  height: 80,
                  margin: '0 auto',
                  mb: 2
                }}
              >
                <HistoryIcon sx={{ fontSize: 40, color: '#999' }} />
              </Avatar>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay compras registradas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {(fechaFiltro || busquedaProveedor) 
                  ? 'Intenta con otros criterios de búsqueda'
                  : 'Las compras aparecerán aquí una vez registradas'
                }
              </Typography>
            </Box>
          ) : (
            <Box>
              <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha('#f5f5f5', 0.8) }}>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">Factura</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">Proveedor</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight="bold">Total</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">Fecha</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="subtitle2" fontWeight="bold">Acciones</Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comprasFiltradas
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((compra) => (
                      <TableRow 
                        key={compra.id} 
                        hover
                        sx={{
                          '&:hover': {
                            bgcolor: alpha('#9c27b0', 0.05)
                          }
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ bgcolor: alpha('#9c27b0', 0.1), width: 32, height: 32 }}>
                              <ReceiptIcon sx={{ fontSize: 18, color: '#9c27b0' }} />
                            </Avatar>
                            <Typography variant="body2" fontWeight="bold">
                              {compra.numero_factura || `#${compra.id}`}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <BusinessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {compra.provider?.nombre || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`$${Number(compra.total || 0).toFixed(2)}`}
                            size="small"
                            sx={{ 
                              bgcolor: alpha('#4caf50', 0.1),
                              color: '#4caf50',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {new Date(compra.created_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Vista previa del reporte">
                            <IconButton
                              onClick={() => abrirVistaPreviaReporte(compra.id)}
                              size="small"
                              sx={{
                                bgcolor: alpha('#1976d2', 0.1),
                                '&:hover': {
                                  bgcolor: alpha('#1976d2', 0.2)
                                }
                              }}
                            >
                              <VisibilityIcon sx={{ fontSize: 20, color: '#1976d2' }} />
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
                count={comprasFiltradas.length}
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
            background: 'linear-gradient(135deg, #ff9800 0%, #e78b00 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Vista Previa de Reporte
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<DescriptionIcon />}
              onClick={() => {
                if (pdfUrl) {
                  window.open(pdfUrl, '_blank');
                  mostrarMensaje('Descargando reporte...', 'success');
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
              <CircularProgress size={60} sx={{ color: '#ff9800' }} />
              <Typography variant="body1" color="text.secondary">
                Cargando vista previa...
              </Typography>
            </Box>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="Vista previa de reporte"
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
