import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import InventoryIcon from '@mui/icons-material/Inventory';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import './Inventario.css';

export default function Inventario() {
  const { user } = useAuth();
  
  // Configuración de colores basada en el rol del usuario (rol_id: 3 = dueño)
  const themeColor = user?.rol_id === 3 ? '#ff9800' : '#2196f3';
  const themeColorLight = user?.rol_id === 3 ? '#ffb74d' : '#64b5f6';
  const themeColorAlpha = user?.rol_id === 3 ? 'rgba(255, 152, 0, 0.15)' : 'rgba(33, 150, 243, 0.15)';
  
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtrosEstado, setFiltrosEstado] = useState({
    disponible: false,
    bajoStock: false,
    sinStock: false,
  });
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Ordenamiento
  const [orden, setOrden] = useState({ campo: null, direccion: 'asc' }); // campo: 'stock' | 'minimo'
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  useEffect(() => {
    cargarInventario();
  }, []);

  useEffect(() => {
    filtrarProductos();
  }, [busqueda, filtrosEstado, productos, orden]);

  const cargarInventario = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axiosClient.get('/inventario', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(response.data)) {
        setProductos(response.data);
      } else {
        setProductos([]);
      }
    } catch (error) {
      console.error('Error al obtener inventario:', error);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const filtrarProductos = () => {
    let filtered = productos;

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(termino) ||
          p.codigo?.toLowerCase().includes(termino) ||
          p.descripcion?.toLowerCase().includes(termino)
      );
    }

    // Filtrar por estado (múltiples selecciones)
    const hayFiltros = Object.values(filtrosEstado).some(v => v === true);
    if (hayFiltros) {
      filtered = filtered.filter((p) => {
        const stockActual = parseInt(p.stock_actual) || 0;
        const stockMinimo = parseInt(p.stock_minimo) || 0;
        const sinStock = stockActual === 0;
        const bajoStock = !sinStock && stockActual < stockMinimo;
        const disponible = !sinStock && !bajoStock;

        return (
          (filtrosEstado.disponible && disponible) ||
          (filtrosEstado.bajoStock && bajoStock) ||
          (filtrosEstado.sinStock && sinStock)
        );
      });
    }

    // Ordenar si hay criterio
    if (orden.campo) {
      filtered = filtered.sort((a, b) => {
        let valA = 0;
        let valB = 0;

        if (orden.campo === 'stock') {
          valA = parseInt(a.stock_actual) || 0;
          valB = parseInt(b.stock_actual) || 0;
        } else if (orden.campo === 'minimo') {
          valA = parseInt(a.stock_minimo) || 0;
          valB = parseInt(b.stock_minimo) || 0;
        }

        if (valA < valB) return orden.direccion === 'asc' ? -1 : 1;
        if (valA > valB) return orden.direccion === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredProductos(filtered);
  };

  const handleMenuOrdenClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuOrdenClose = () => {
    setMenuAnchorEl(null);
  };

  const handleOrdenar = (campo) => {
      // Si ya ordenamos por este campo, invertimos dirección
      // Si no, establecemos campo y dirección ascendente
      if (orden.campo === campo) {
          if (orden.direccion === 'asc') {
              setOrden({ campo, direccion: 'desc' });
          } else {
              setOrden({ campo: null, direccion: 'asc' });
          }
      } else {
          setOrden({ campo, direccion: 'asc' });
      }
      handleMenuOrdenClose();
  };

  const toggleFiltroEstado = (estado) => {
    setFiltrosEstado(prev => ({
      ...prev,
      [estado]: !prev[estado]
    }));
  };

  const handleVerDetalles = (producto) => {
    setSelectedProducto(producto);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProducto(null);
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

  const precioVenta = selectedProducto?.precio_venta
    ? parseFloat(selectedProducto.precio_venta)
    : 0;
  const porcentajeImpuesto = selectedProducto?.impuesto?.porcentaje ?? 0;
  const valorImpuesto = (precioVenta * porcentajeImpuesto) / 100;
  const precioConImpuesto = precioVenta + valorImpuesto;

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <Box className="inventory-header" display="flex" alignItems="center" justifyContent="space-between" mb={4}>
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
              Inventario
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
              Gestión y visualización de productos
            </Typography>
          </Box>
        </Box>
        <Chip
          icon={<LocalOfferIcon />}
          label={`${filteredProductos.length} productos`}
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
      <Box className="search-container" mb={4}>
        <Grid container spacing={2}>
          {/* Barra de búsqueda */}
          <Grid size={{ xs: 12, sm: 12, md: 6 }}>
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                fullWidth
                placeholder="Buscar por nombre, código o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="search-input"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: themeColor, mr: 1 }} />
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
                      boxShadow: `0 8px 24px ${themeColorAlpha}`,
                      '& fieldset': {
                        borderColor: themeColor,
                      },
                    },
                  },
                }}
              />
              <Tooltip title="Ordenar productos">
                <IconButton 
                    onClick={handleMenuOrdenClick}
                    sx={{ 
                        bgcolor: 'white', 
                        height: 56,
                        width: 56,
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                >
                    <SortIcon color={orden.campo ? "primary" : "action"} />
                </IconButton>
              </Tooltip>
              <Menu
                  anchorEl={menuAnchorEl}
                  open={Boolean(menuAnchorEl)}
                  onClose={handleMenuOrdenClose}
                  PaperProps={{
                      sx: { borderRadius: 2, mt: 1, minWidth: 180 }
                  }}
              >
                  <MenuItem onClick={() => handleOrdenar('stock')} selected={orden.campo === 'stock'}>
                      <Box display="flex" justifyContent="space-between" width="100%">
                          Stock Actual
                          {orden.campo === 'stock' && (
                              <Typography variant="caption" color="primary" ml={1}>
                                  {orden.direccion === 'asc' ? '↑ Menor a Mayor' : '↓ Mayor a Menor'}
                              </Typography>
                          )}
                      </Box>
                  </MenuItem>
                  <MenuItem onClick={() => handleOrdenar('minimo')} selected={orden.campo === 'minimo'}>
                       <Box display="flex" justifyContent="space-between" width="100%">
                          Stock Mínimo
                          {orden.campo === 'minimo' && (
                              <Typography variant="caption" color="primary" ml={1}>
                                  {orden.direccion === 'asc' ? '↑ Menor a Mayor' : '↓ Mayor a Menor'}
                              </Typography>
                          )}
                      </Box>
                  </MenuItem>
              </Menu>
            </Box>
          </Grid>

          {/* Filtros por estado */}
          <Grid size={{ xs: 12, sm: 12, md: 6 }}>
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

      {/* Grid de Productos */}
      {filteredProductos.length === 0 ? (
        <Box className="empty-state-container" textAlign="center" py={6}>
          <Box className="empty-state-icon">
            <InventoryIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          </Box>
          <Typography variant="h6" fontWeight="600" sx={{ color: '#1a237e', mb: 1 }}>
            No hay productos encontrados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {busqueda ? 'Intenta con términos de búsqueda diferentes' : 'Crea tu primer producto para empezar'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredProductos.map((producto) => {
            const precioCompra = parseFloat(producto.precio_compra || 0);
            const precioVenta = parseFloat(producto.precio_venta || 0);
            const stockActual = parseInt(producto.stock_actual) || 0;
            const stockMinimo = parseInt(producto.stock_minimo) || 0;
            const margenGanancia = precioCompra > 0 ? ((precioVenta - precioCompra) / precioCompra * 100) : 0;

            // Determinar el estado del stock
            const sinStock = stockActual === 0;
            const bajoStock = !sinStock && stockActual < stockMinimo;

            // Color scheme según estado
            let statusColor = '#4caf50'; // Verde - Stock adecuado
            let statusLabel = 'Disponible';
            let statusIcon = <CheckCircleIcon sx={{ color: '#4caf50 !important' }} />;
            let statusBg = '#c8e6c9';
            let borderTopColor = '#4caf50';

            if (sinStock) {
              statusColor = '#f44336'; // Rojo
              statusLabel = 'Sin Stock';
              statusIcon = <WarningIcon sx={{ color: '#f44336 !important' }} />;
              statusBg = '#ffcdd2';
              borderTopColor = '#f44336';
            } else if (bajoStock) {
              statusColor = '#ff9800'; // Naranja/Amarillo oscuro
              statusLabel = 'Bajo Stock';
              statusIcon = <WarningIcon sx={{ color: '#ff9800 !important' }} />;
              statusBg = '#ffe0b2';
              borderTopColor = '#ff9800';
            }

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={producto.id}>
                <Card className="product-card" sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#fff',
                  borderTop: `4px solid ${borderTopColor}`,
                }}>
                  {/* Header con código y estado */}
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    p: 2,
                    borderBottom: '1px solid #f0f0f0',
                  }}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 'bold',
                          color: themeColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontSize: '0.75rem',
                        }}
                      >
                        {producto.codigo}
                      </Typography>
                    </Box>
                    <Chip
                      icon={statusIcon}
                      label={statusLabel}
                      size="small"
                      sx={{
                        bgcolor: statusBg,
                        color: statusColor,
                        fontWeight: '600',
                        fontSize: '0.75rem',
                      }}
                    />
                  </Box>

                  <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                    {/* Nombre */}
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 1.5,
                        fontWeight: '700',
                        color: '#1a237e',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={producto.nombre}
                    >
                      {producto.nombre}
                    </Typography>

                    {/* Descripción */}
                    {producto.descripcion && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: '#666',
                          mb: 1.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={producto.descripcion}
                      >
                        {producto.descripcion}
                      </Typography>
                    )}

                    {/* Precios */}
                    <Box className="prices-section" display="flex" justifyContent="space-between" mb={2.5}>
                      <Box className="price-box price-compra">
                        <Typography variant="caption" sx={{ color: '#666', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                          Compra
                        </Typography>
                        <Typography variant="body2" fontWeight="700" sx={{ color: '#4caf50', mt: 0.5 }}>
                          {formatearMonto(precioCompra)}
                        </Typography>
                      </Box>
                      <Box className="price-box price-venta">
                        <Typography variant="caption" sx={{ color: '#666', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                          Venta
                        </Typography>
                        <Typography variant="body2" fontWeight="700" sx={{ color: '#2196f3', mt: 0.5 }}>
                          {formatearMonto(precioVenta)}
                        </Typography>
                      </Box>
                      <Box className="price-box price-margen" sx={{
                        bgcolor: margenGanancia >= 20 ? '#e8f5e9' : margenGanancia >= 10 ? '#e3f2fd' : '#fff3e0',
                        p: 1,
                        borderRadius: '8px',
                        textAlign: 'center',
                      }}>
                        <Typography variant="caption" sx={{ color: '#666', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                          Margen
                        </Typography>
                        <Typography variant="body2" fontWeight="700" sx={{
                          color: margenGanancia >= 20 ? '#4caf50' : margenGanancia >= 10 ? themeColor : '#ff9800',
                          mt: 0.5,
                        }}>
                          {margenGanancia.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>

                    {/* Stock Info */}
                    <Box className="stock-section" sx={{
                      bgcolor: statusBg,
                      p: 1.5,
                      borderRadius: '8px',
                      mb: 2,
                      textAlign: 'center',
                    }}>
                      <Typography variant="caption" sx={{ color: '#666', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        Stock Actual / Mínimo
                      </Typography>
                      <Box display="flex" justifyContent="center" alignItems="center" mt={0.5} gap={1}>
                        <Typography variant="h5" sx={{ fontWeight: '700', color: statusColor }}>
                          {stockActual}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          / {stockMinimo}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Margen Ganancia Indicator */}
                    {margenGanancia > 0 && (
                      <Box display="flex" alignItems="center" gap={0.5} mb={2}>
                        <TrendingUpIcon sx={{ fontSize: 16, color: margenGanancia >= 20 ? '#4caf50' : '#ff9800' }} />
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Margen atractivo
                        </Typography>
                      </Box>
                    )}
                  </CardContent>

                  {/* Action Button */}
                  <Box sx={{ p: 2, borderTop: '1px solid #f0f0f0' }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleVerDetalles(producto)}
                      sx={{
                        borderColor: themeColor,
                        color: themeColor,
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: `${themeColor}15`,
                          borderColor: themeColorLight,
                        },
                      }}
                    >
                      Ver Detalles
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Modal de Detalles */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth className="product-modal">
        <DialogTitle sx={{
          fontWeight: '700',
          color: '#1a237e',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
        }}>
          <Box>Detalles del Producto</Box>
          <IconButton onClick={handleCloseModal} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedProducto && (
            <Box>
              {/* Header del Producto */}
              <Box className="modal-product-header" sx={{
                p: 2,
                bgcolor: `${themeColor}15`,
                borderRadius: '12px',
                mb: 3,
                borderLeft: `4px solid ${themeColor}`,
              }}>
                <Typography variant="h6" fontWeight="700" sx={{ color: '#1a237e', mb: 0.5 }}>
                  {selectedProducto.nombre}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Código: <strong>{selectedProducto.codigo}</strong>
                </Typography>
                {selectedProducto.descripcion && (
                  <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                    {selectedProducto.descripcion}
                  </Typography>
                )}
              </Box>

              {/* Sección de Precios */}
              <Typography variant="subtitle1" fontWeight="700" sx={{ color: '#1a237e', mb: 2 }}>
                💰 Información de Precios
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{
                    p: 2,
                    bgcolor: '#e8f5e9',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #c8e6c9',
                  }}>
                    <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      Precio Compra
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: '700', mt: 1 }}>
                      {formatearMonto(parseFloat(selectedProducto.precio_compra || 0))}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{
                    p: 2,
                    bgcolor: '#e3f2fd',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #bbdefb',
                  }}>
                    <Typography variant="caption" sx={{ color: '#1565c0', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      Precio Venta
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#2196f3', fontWeight: '700', mt: 1 }}>
                      {formatearMonto(precioVenta)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Margen de Ganancia */}
              {precioVenta > 0 && (
                <Box sx={{
                  p: 2.5,
                  bgcolor: '#f5f5f5',
                  borderRadius: '12px',
                  mb: 3,
                  border: '1px solid #e0e0e0',
                }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" sx={{ color: '#666', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        Margen de Ganancia
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: '700', color: '#1a237e', mt: 0.5 }}>
                        {((precioVenta - parseFloat(selectedProducto.precio_compra || 0)) / parseFloat(selectedProducto.precio_compra || 1) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                  </Box>
                </Box>
              )}

              {/* Impuesto */}
              {porcentajeImpuesto > 0 && (
                <Box sx={{
                  p: 2,
                  bgcolor: '#fff3e0',
                  borderRadius: '12px',
                  mb: 3,
                  border: '1px solid #ffe0b2',
                }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" sx={{ color: '#e65100' }}>
                      Impuesto ({porcentajeImpuesto}%)
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: '600', color: '#e65100' }}>
                      +{formatearMonto(valorImpuesto)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#1a237e' }}>
                      Precio Final
                    </Typography>
                    <Typography variant="h6" fontWeight="700" sx={{ color: '#ff9800' }}>
                      {formatearMonto(precioConImpuesto)}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Divider sx={{ mb: 3 }} />

              {/* Stock Info */}
              <Typography variant="subtitle1" fontWeight="700" sx={{ color: '#1a237e', mb: 2 }}>
                📦 Stock e Inventario
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{
                    p: 2,
                    bgcolor: '#f5f5f5',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #e0e0e0',
                  }}>
                    <Typography variant="caption" sx={{ color: '#666', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      Stock Actual
                    </Typography>
                    <Typography variant="h4" fontWeight="700" sx={{ color: '#1a237e', mt: 1 }}>
                      {selectedProducto.stock_actual}
                    </Typography>
                  </Box>
                </Grid>
                {selectedProducto.stock_minimo && (
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{
                      p: 2,
                      bgcolor: selectedProducto.stock_actual < selectedProducto.stock_minimo ? '#ffebee' : '#e8f5e9',
                      borderRadius: '12px',
                      textAlign: 'center',
                      border: `1px solid ${selectedProducto.stock_actual < selectedProducto.stock_minimo ? '#ffcdd2' : '#c8e6c9'}`,
                    }}>
                      <Typography variant="caption" sx={{ color: '#666', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        Mínimo Requerido
                      </Typography>
                      <Typography variant="h4" fontWeight="700" sx={{
                        color: selectedProducto.stock_actual < selectedProducto.stock_minimo ? '#f44336' : '#4caf50',
                        mt: 1,
                      }}>
                        {selectedProducto.stock_minimo}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {/* Proveedor */}
              {selectedProducto.proveedor && (
                <>
                  <Divider sx={{ mb: 3 }} />
                  <Typography variant="subtitle1" fontWeight="700" sx={{ color: '#1a237e', mb: 2 }}>
                    🤝 Información del Proveedor
                  </Typography>
                  <Box sx={{
                    p: 2,
                    bgcolor: '#f3e5f5',
                    borderRadius: '12px',
                    border: '1px solid #e1bee7',
                  }}>
                    <Typography variant="body1" fontWeight="700" sx={{ color: '#1a237e' }}>
                      {selectedProducto.proveedor.nombre}
                    </Typography>
                    {selectedProducto.proveedor.contacto && (
                      <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                        📞 {selectedProducto.proveedor.contacto}
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button
            onClick={handleCloseModal}
            variant="contained"
            fullWidth
            sx={{
              background: `linear-gradient(135deg, ${themeColor}, ${themeColorLight})`,
              fontWeight: '600',
              padding: '10px',
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
