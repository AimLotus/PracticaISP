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
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Paper,
  TextField,
  TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InventoryIcon from '@mui/icons-material/Inventory';
import BarcodeIcon from '@mui/icons-material/QrCode';
import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BusinessIcon from '@mui/icons-material/Business';
import StarIcon from '@mui/icons-material/Star';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import ProductFormModal from './ProductFormModal';
import './GestionProductos.css';

export default function GestionProductos() {
  const { user } = useAuth();
  
  // Configuración de colores basada en el rol del usuario (rol_id: 3 = dueño)
  const themeColor = user?.rol_id === 3 ? '#ff9800' : '#1976d2';
  const themeColorLight = user?.rol_id === 3 ? '#ffb74d' : '#42a5f5';
  const themeColorAlpha = user?.rol_id === 3 ? 'rgba(255, 152, 0, 0.3)' : 'rgba(25, 118, 210, 0.3)';
  
  const [productos, setProductos] = useState([]);
  const [impuestos, setImpuestos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState(null);
  const [modalVer, setModalVer] = useState(false);
  const [productoVer, setProductoVer] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [productoParaEliminar, setProductoParaEliminar] = useState(null);

  // Filtros Estado
  const [filtrosEstado, setFiltrosEstado] = useState({
    disponible: false,
    bajoStock: false,
    sinStock: false,
  });

  // Mensajes
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('success');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [busqueda, filtrosEstado]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [resProductos, resImpuestos, resProveedores] = await Promise.all([
        axiosClient.get('/products', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axiosClient.get('/taxes', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axiosClient.get('/proveedores', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setProductos(resProductos.data);
      setImpuestos(resImpuestos.data.filter((t) => t.activo));
      setProveedores(resProveedores.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarMensaje('Error al cargar productos e impuestos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    setOpenSnackbar(true);
  };

  const abrirCrearProducto = () => {
    setProductoEnEdicion(null);
    setFormModalOpen(true);
  };

  const abrirEditarProducto = (producto) => {
    setProductoEnEdicion(producto);
    setFormModalOpen(true);
  };

  const manejarSubmitFormulario = async (formData) => {
    setLoadingForm(true);
    try {
      const token = localStorage.getItem('token');

      if (productoEnEdicion) {
        // Actualizar producto existente
        const res = await axiosClient.put(
          `/products/${productoEnEdicion.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setProductos(
          productos.map((p) => (p.id === productoEnEdicion.id ? res.data : p))
        );
        mostrarMensaje('Producto actualizado correctamente', 'success');
      } else {
        // Crear nuevo producto
        const res = await axiosClient.post('/products', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProductos([...productos, res.data]);
        mostrarMensaje('Producto creado correctamente', 'success');
      }

      setFormModalOpen(false);
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje(
        productoEnEdicion
          ? 'Error al actualizar el producto'
          : 'Error al crear el producto',
        'error'
      );
    } finally {
      setLoadingForm(false);
    }
  };

  const confirmarEliminar = (producto) => {
    setProductoParaEliminar(producto);
    setModalEliminar(true);
  };

  const eliminarProducto = async () => {
    try {
      const token = localStorage.getItem('token');
      await axiosClient.delete(`/products/${productoParaEliminar.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductos(productos.filter((p) => p.id !== productoParaEliminar.id));
      mostrarMensaje('Producto eliminado correctamente', 'success');
      setModalEliminar(false);
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      mostrarMensaje('Error al eliminar el producto', 'error');
    }
  };

  const abrirModalVer = (producto) => {
    setProductoVer(producto);
    setModalVer(true);
  };

  const mostrarDecimal = (valor) => {
    if (valor == null) return '-';
    const num = Number(valor);
    return isNaN(num) ? '-' : num.toFixed(2);
  };

  const obtenerImpuesto = (taxId) => {
    return impuestos.find((t) => t.id === taxId);
  };

  const toggleFiltroEstado = (estado) => {
    setFiltrosEstado(prev => ({
      ...prev,
      [estado]: !prev[estado]
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Filtrar productos
  const productosFiltrados = productos.filter(producto => {
     // Filtro Búsqueda
     const matchBusqueda = 
      producto.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.categoria?.toLowerCase().includes(busqueda.toLowerCase());

     // Filtro Estado
     const hayFiltros = Object.values(filtrosEstado).some(v => v === true);
     if (!hayFiltros) return matchBusqueda;

     const stockActual = parseInt(producto.stock_actual) || 0;
     const stockMinimo = parseInt(producto.stock_minimo) || 0;
     const sinStock = stockActual === 0;
     const bajoStock = !sinStock && stockActual < stockMinimo;
     const disponible = !sinStock && !bajoStock;

     const matchEstado =
       (filtrosEstado.disponible && disponible) ||
       (filtrosEstado.bajoStock && bajoStock) ||
       (filtrosEstado.sinStock && sinStock);

     return matchBusqueda && matchEstado;
  });

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <Box className="products-header" display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box display="flex" alignItems="center">
          <Box 
            className="header-icon-box"
            sx={{
              background: `linear-gradient(135deg, ${themeColor}15 0%, ${themeColorLight}30 100%)`,
              boxShadow: `0 4px 16px ${themeColorAlpha}`,
              '@keyframes pulse': {
                '0%': { boxShadow: `0 4px 16px ${themeColorAlpha}` },
                '50%': { boxShadow: `0 4px 24px ${themeColorAlpha}` },
                '100%': { boxShadow: `0 4px 16px ${themeColorAlpha}` },
              },
            }}
          >
            <InventoryIcon sx={{ fontSize: 40, color: themeColor }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="700" sx={{ color: '#1a237e' }}>
              Gestión de Productos
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
              Administra y controla tu catálogo de productos
            </Typography>
          </Box>
        </Box>
        <Chip
          icon={<InventoryIcon />}
          label={`${productosFiltrados.length} productos`}
          sx={{
            background: `linear-gradient(135deg, ${themeColor}15 0%, ${themeColorLight}15 100%)`,
            color: themeColor,
            fontWeight: 'bold',
            fontSize: '0.95rem',
            height: 'auto',
            padding: '8px 12px',
            border: `1px solid ${themeColorLight}`,
            boxShadow: `0 4px 12px ${themeColorAlpha}`,
            '& .MuiChip-icon': {
              color: `${themeColor} !important`,
            }
          }}
        />
      </Box>

      {/* Búsqueda y Filtros */}
      <Box className="search-container" mb={3}>
        <Grid container spacing={2}>
          {/* Barra de búsqueda */}
          {/* Barra de búsqueda */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, código o categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#1976d2', mr: 1 }} />
                  </InputAdornment>
                ),
                endAdornment: busqueda && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setBusqueda('')}
                      edge="end"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 8px 24px rgba(25, 118, 210, 0.15)',
                    '& fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                },
              }}
            />
          </Grid>

          {/* Filtros por estado */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box display="flex" gap={1} flexWrap="wrap" alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-start' }} sx={{ height: '100%' }}>
              <Button
                variant={filtrosEstado.disponible ? 'contained' : 'outlined'}
                onClick={() => toggleFiltroEstado('disponible')}
                size="small"
                sx={{
                  borderRadius: '8px',
                  fontWeight: '600',
                  textTransform: 'none',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  ...(filtrosEstado.disponible ? {
                    background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                    color: '#fff',
                    border: 'none',
                  } : {
                    borderColor: '#4caf50',
                    color: '#4caf50',
                    '&:hover': {
                      bgcolor: '#e8f5e9',
                      borderColor: '#66bb6a',
                    },
                  }),
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4caf50', display: 'inline-block', mr: 0.75 }} />
                Disponible
              </Button>
              <Button
                variant={filtrosEstado.bajoStock ? 'contained' : 'outlined'}
                onClick={() => toggleFiltroEstado('bajoStock')}
                size="small"
                sx={{
                  borderRadius: '8px',
                  fontWeight: '600',
                  textTransform: 'none',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  ...(filtrosEstado.bajoStock ? {
                    background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
                    color: '#fff',
                    border: 'none',
                  } : {
                    borderColor: '#ff9800',
                    color: '#ff9800',
                    '&:hover': {
                      bgcolor: '#fff3e0',
                      borderColor: '#ffb74d',
                    },
                  }),
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ff9800', display: 'inline-block', mr: 0.75 }} />
                Bajo Stock
              </Button>
              <Button
                variant={filtrosEstado.sinStock ? 'contained' : 'outlined'}
                onClick={() => toggleFiltroEstado('sinStock')}
                size="small"
                sx={{
                  borderRadius: '8px',
                  fontWeight: '600',
                  textTransform: 'none',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  ...(filtrosEstado.sinStock ? {
                    background: 'linear-gradient(135deg, #f44336, #ef5350)',
                    color: '#fff',
                    border: 'none',
                  } : {
                    borderColor: '#f44336',
                    color: '#f44336',
                    '&:hover': {
                      bgcolor: '#ffebee',
                      borderColor: '#ef5350',
                    },
                  }),
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f44336', display: 'inline-block', mr: 0.75 }} />
                Sin Stock
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setBusqueda('');
                  setFiltrosEstado({ disponible: false, bajoStock: false, sinStock: false });
                }}
                size="small"
                sx={{
                  fontWeight: '600',
                  textTransform: 'none',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  color: '#666',
                  minWidth: 'auto',
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                    color: '#333',
                  },
                }}
              >
                ✕ Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Tabla de Productos */}
      <Card className="products-card">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: '700', color: '#1a237e', fontSize: '0.9rem' }}>
                  Código
                </TableCell>
                <TableCell sx={{ fontWeight: '700', color: '#1a237e', fontSize: '0.9rem' }}>
                  Nombre
                </TableCell>
                <TableCell sx={{ fontWeight: '700', color: '#1a237e', fontSize: '0.9rem' }}>
                  Categoría
                </TableCell>
                <TableCell sx={{ fontWeight: '700', color: '#1a237e', fontSize: '0.9rem' }}>
                  P. Compra
                </TableCell>
                <TableCell sx={{ fontWeight: '700', color: '#1a237e', fontSize: '0.9rem' }}>
                  P. Venta
                </TableCell>
                <TableCell sx={{ fontWeight: '700', color: '#1a237e', fontSize: '0.9rem' }}>
                  Margen
                </TableCell>
                <TableCell sx={{ fontWeight: '700', color: '#1a237e', fontSize: '0.9rem' }}>
                  Stock Mín.
                </TableCell>
                <TableCell sx={{ fontWeight: '700', color: '#1a237e', fontSize: '0.9rem' }}>
                  Impuesto
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: '700', color: '#1a237e', fontSize: '0.9rem' }}>
                  Proveedores
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: '700', color: '#1a237e', fontSize: '0.9rem' }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productosFiltrados
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((producto) => {
                const impuesto = obtenerImpuesto(producto.tax_id);
                const numProveedores = producto.providers?.length || 0;
                const precioCompra = parseFloat(producto.precio_compra || 0);
                const precioVenta = parseFloat(producto.precio_venta || 0);
                const margen = precioCompra > 0 ? ((precioVenta - precioCompra) / precioCompra * 100) : 0;

                return (
                  <TableRow
                    key={producto.id}
                    className="product-row"
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: '#f9f9f9',
                      }
                    }}
                  >
                    <TableCell sx={{ fontWeight: '600', color: '#1976d2' }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <BarcodeIcon sx={{ fontSize: 18, color: '#999' }} />
                        {producto.codigo || '-'}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: '500', color: '#1a237e' }}>
                      {producto.nombre}
                    </TableCell>
                    <TableCell sx={{ color: '#666' }}>
                      <Chip
                        label={producto.categoria || '-'}
                        size="small"
                        variant="outlined"
                        sx={{ color: '#1976d2' }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#4caf50', fontWeight: '600' }}>
                      ${mostrarDecimal(producto.precio_compra)}
                    </TableCell>
                    <TableCell sx={{ color: '#2196f3', fontWeight: '600' }}>
                      ${mostrarDecimal(producto.precio_venta)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={margen.toFixed(1) + '%'}
                        size="small"
                        sx={{
                          bgcolor: margen >= 20 ? '#c8e6c9' : margen >= 10 ? '#e3f2fd' : '#fff3e0',
                          color: margen >= 20 ? '#2e7d32' : margen >= 10 ? '#1565c0' : '#e65100',
                          fontWeight: '600',
                          fontSize: '0.75rem',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#666', fontWeight: '500' }}>
                      {producto.stock_minimo || 0}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {impuesto?.nombre || <em>Sin impuesto</em>}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {numProveedores > 0 ? (
                        <Chip
                          icon={<BusinessIcon />}
                          label={numProveedores}
                          size="small"
                          sx={{
                            bgcolor: numProveedores > 1 ? '#e3f2fd' : '#f5f5f5',
                            color: numProveedores > 1 ? '#1565c0' : '#666',
                            fontWeight: '600',
                          }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: '#999' }}>-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={0.5} justifyContent="flex-end">
                        <Tooltip title="Ver detalles">
                          <IconButton
                            color="info"
                            onClick={() => abrirModalVer(producto)}
                            size="small"
                            sx={{
                              '&:hover': {
                                backgroundColor: '#e3f2fd',
                              }
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            color="primary"
                            onClick={() => abrirEditarProducto(producto)}
                            size="small"
                            sx={{
                              '&:hover': {
                                backgroundColor: '#e3f2fd',
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            color="error"
                            onClick={() => confirmarEliminar(producto)}
                            size="small"
                            sx={{
                              '&:hover': {
                                backgroundColor: '#ffebee',
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={productosFiltrados.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={"Filas por página"}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Card>

      {productosFiltrados.length === 0 && (
        <Box className="empty-state-products" textAlign="center" py={6}>
          <InventoryIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" fontWeight="600" sx={{ color: '#1a237e', mb: 1 }}>
            {busqueda ? 'No se encontraron productos' : 'No hay productos registrados'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {busqueda ? 'Intenta con términos de búsqueda diferentes' : 'Comienza creando tu primer producto'}
          </Typography>
        </Box>
      )}

      {/* Botón flotante crear */}
      <Tooltip title="Crear nuevo producto">
        <Fab
          color="primary"
          aria-label="add"
          onClick={abrirCrearProducto}
          className="fab-button"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: `linear-gradient(135deg, ${themeColor}, ${themeColorLight})`,
            boxShadow: `0 8px 24px ${themeColorAlpha}`,
            '&:hover': {
              boxShadow: `0 12px 32px ${themeColorAlpha}`,
            }
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Modal de Crear/Editar Producto */}
      <ProductFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setProductoEnEdicion(null);
        }}
        onSubmit={manejarSubmitFormulario}
        product={productoEnEdicion}
        taxes={impuestos}
        suppliers={proveedores}
        isLoading={loadingForm}
      />

      {/* Modal Ver Detalles */}
      <Dialog open={modalVer} onClose={() => setModalVer(false)} maxWidth="md" fullWidth className="details-modal">
        <DialogTitle sx={{
          fontWeight: '700',
          color: '#1a237e',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
        }}>
          <Box display="flex" alignItems="center">
            <VisibilityIcon sx={{ mr: 1, color: '#1976d2' }} />
            Detalles del Producto
          </Box>
          <IconButton onClick={() => setModalVer(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {productoVer && (
            <Box>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Información Básica
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <BarcodeIcon sx={{ mr: 1, color: '#666' }} />
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Código
                          </Typography>
                          <Typography variant="body1">
                            {productoVer.codigo || '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <InventoryIcon sx={{ mr: 1, color: '#666' }} />
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Nombre
                          </Typography>
                          <Typography variant="body1">{productoVer.nombre}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Box display="flex" alignItems="flex-start" mb={1}>
                        <DescriptionIcon sx={{ mr: 1, color: '#666' }} />
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Descripción
                          </Typography>
                          <Typography variant="body1">
                            {productoVer.descripcion || 'Sin descripción'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <InventoryIcon sx={{ mr: 1, color: '#666' }} />
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Categoría
                          </Typography>
                          <Typography variant="body1">
                            {productoVer.categoria || 'Sin categoría'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Precios y Stock
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper sx={{ p: 2, bgcolor: '#ffebee' }}>
                        <Box display="flex" alignItems="center">
                          <TrendingDownIcon sx={{ mr: 1, color: '#d32f2f' }} />
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              Precio Compra
                            </Typography>
                            <Typography variant="h6" color="#d32f2f">
                              ${mostrarDecimal(productoVer.precio_compra)}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                        <Box display="flex" alignItems="center">
                          <TrendingUpIcon sx={{ mr: 1, color: '#4caf50' }} />
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              Precio Venta
                            </Typography>
                            <Typography variant="h6" color="#4caf50">
                              ${mostrarDecimal(productoVer.precio_venta)}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <WarningIcon sx={{ mr: 1, color: '#666' }} />
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Stock Mínimo
                          </Typography>
                          <Typography variant="body1">
                            {productoVer.stock_minimo != null &&
                            !isNaN(Number(productoVer.stock_minimo))
                              ? Number(productoVer.stock_minimo)
                              : '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Impuestos
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <ReceiptIcon sx={{ mr: 1, color: '#666' }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Impuesto Aplicado
                      </Typography>
                      <Typography variant="body1">
                        {obtenerImpuesto(productoVer.tax_id)?.nombre ||
                          'Sin impuesto'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {productoVer.providers && productoVer.providers.length > 0 && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <BusinessIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'middle' }} />
                      Proveedores
                    </Typography>
                    <List dense>
                      {productoVer.providers.map((prov) => (
                        <ListItem key={prov.id}>
                          {prov.pivot?.is_primary && <StarIcon sx={{ color: 'gold', mr: 1 }} />}
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center">
                                <Typography variant="body1" sx={{ fontWeight: prov.pivot?.is_primary ? 'bold' : 'normal' }}>
                                  {prov.nombre}
                                </Typography>
                                {prov.pivot?.is_primary && (
                                  <Chip label="Principal" size="small" color="primary" sx={{ ml: 1 }} />
                                )}
                              </Box>
                            }
                            secondary={prov.pivot?.precio_proveedor ? `Precio: $${prov.pivot.precio_proveedor}` : 'Sin precio definido'}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalVer(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>



      {/* Modal Eliminar */}
      <Dialog open={modalEliminar} onClose={() => setModalEliminar(false)} className="delete-modal">
        <DialogTitle sx={{
          fontWeight: '700',
          color: '#1a237e',
        }}>
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar el producto "
            {productoParaEliminar?.nombre}"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0', gap: 1 }}>
          <Button onClick={() => setModalEliminar(false)} sx={{ textTransform: 'none', color: '#666' }}>
            Cancelar
          </Button>
          <Button onClick={eliminarProducto} variant="contained" sx={{
            background: '#f44336',
            textTransform: 'none',
            fontWeight: '600',
          }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>



      {/* Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={tipoMensaje}
          sx={{ width: '100%' }}
        >
          {mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
}
