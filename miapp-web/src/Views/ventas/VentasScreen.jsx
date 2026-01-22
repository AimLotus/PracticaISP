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
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Divider,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  alpha,
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveIcon from '@mui/icons-material/Remove';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';

export default function VentasScreen() {
  const { user } = useAuth();
  
  // Configuración de colores basada en el rol del usuario (rol_id: 3 = dueño)
  const themeColor = user?.rol_id === 3 ? '#ff9800' : '#4caf50';
  const themeColorLight = user?.rol_id === 3 ? '#ffb74d' : '#66bb6a';
  const themeColorAlpha = user?.rol_id === 3 ? 'rgba(255, 152, 0, 0.3)' : 'rgba(76, 175, 80, 0.3)';

  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ventaProductos, setVentaProductos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal agregar producto
  const [modalProducto, setModalProducto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState('1');
  const [busquedaProducto, setBusquedaProducto] = useState('');

  // Mensajes
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('success');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [resClientes, resProductos] = await Promise.all([
        axiosClient.get('/clientes', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axiosClient.get('/products', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setClientes(resClientes.data);

      // Formatear productos con precio_venta e impuesto_porcentaje
      const productosFormateados = resProductos.data.map((prod) => ({
        ...prod,
        precio_venta: parseFloat(prod.precio_venta),
        impuesto_porcentaje: prod.tax ? parseFloat(prod.tax.porcentaje) : 0,
      }));

      setProductos(productosFormateados);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarMensaje('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    setOpenSnackbar(true);
  };

  // Calcular totales
  const calcularTotales = () => {
    let subtotal = 0;
    let impuesto = 0;

    ventaProductos.forEach((item) => {
      const precioTotal = item.precio_venta * item.cantidad;
      subtotal += precioTotal;
      impuesto += (precioTotal * (item.impuesto_porcentaje || 0)) / 100;
    });

    const total = subtotal + impuesto;
    return { subtotal, impuesto, total };
  };

  const { subtotal, impuesto, total } = calcularTotales();

  const abrirModalProducto = () => {
    setProductoSeleccionado('');
    setCantidadProducto('1');
    setBusquedaProducto('');
    setModalProducto(true);
  };

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  const obtenerClienteNombre = () => {
    const cliente = clientes.find((c) => c.id === clienteSeleccionado);
    return cliente?.nombre || '';
  };

  const actualizarCantidadProducto = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarProducto(id);
      return;
    }
    setVentaProductos(
      ventaProductos.map((p) =>
        p.id === id ? { ...p, cantidad: nuevaCantidad } : p
      )
    );
  };

  const agregarProducto = () => {
    if (!productoSeleccionado) {
      mostrarMensaje('Seleccione un producto', 'error');
      return;
    }

    const cant = parseInt(cantidadProducto);
    if (isNaN(cant) || cant <= 0) {
      mostrarMensaje('Cantidad inválida', 'error');
      return;
    }

    const producto = productos.find((p) => p.id === productoSeleccionado);
    if (!producto) return;

    const existe = ventaProductos.find((p) => p.id === producto.id);
    if (existe) {
      setVentaProductos(
        ventaProductos.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + cant } : p
        )
      );
    } else {
      setVentaProductos([...ventaProductos, { ...producto, cantidad: cant }]);
    }

    setModalProducto(false);
    mostrarMensaje('Producto agregado al carrito', 'success');
  };

  const eliminarProducto = (id) => {
    setVentaProductos(ventaProductos.filter((p) => p.id !== id));
    mostrarMensaje('Producto eliminado del carrito', 'info');
  };

  const enviarVenta = async () => {
    if (!clienteSeleccionado) {
      mostrarMensaje('Seleccione un cliente', 'error');
      return;
    }
    if (ventaProductos.length === 0) {
      mostrarMensaje('Agregue al menos un producto', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const payload = {
        client_id: clienteSeleccionado,
        productos: ventaProductos.map((p) => ({
          product_id: p.id,
          cantidad: p.cantidad,
        })),
      };

      const res = await axiosClient.post('/ventas', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      mostrarMensaje(
        res.data.mensaje || 'Venta registrada correctamente',
        'success'
      );

      // Si hay URL de factura, abrirla en nueva pestaña
      if (res.data.factura_url) {
        window.open(res.data.factura_url, '_blank');
      }

      // Limpiar formulario
      setClienteSeleccionado('');
      setVentaProductos([]);
    } catch (error) {
      console.error('Error al registrar venta:', error);
      const msj =
        error.response?.data?.error ||
        error.response?.data?.mensaje ||
        'Error al registrar la venta';
      mostrarMensaje(msj, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && clientes.length === 0 && productos.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
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
              <ShoppingCartIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Registrar Venta
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Crea una nueva transacción de ventas
              </Typography>
            </Box>
          </Box>
          {ventaProductos.length > 0 && (
            <Chip
              icon={<ShoppingCartIcon />}
              label={`${ventaProductos.length} Producto${ventaProductos.length > 1 ? 's' : ''}`}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                height: 'auto',
                padding: '8px 12px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                '& .MuiChip-icon': {
                  color: 'white !important',
                }
              }}
            />
          )}
        </Box>
      </Paper>

      {/* Selector de Cliente */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: clienteSeleccionado ? themeColor : 'divider',
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
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Selecciona un Cliente
              </Typography>
              <Typography variant="caption" color="text.secondary">
                El cliente es requerido para registrar la venta
              </Typography>
            </Box>
          </Box>
          <Autocomplete
            options={clientes}
            getOptionLabel={(option) => option.nombre}
            filterOptions={(options, { inputValue }) => {
              const search = inputValue.toLowerCase();
              return options.filter(
                (option) =>
                  option.nombre.toLowerCase().includes(search) ||
                  (option.ruc_ci && option.ruc_ci.includes(search))
              );
            }}
            value={clientes.find((c) => c.id === clienteSeleccionado) || null}
            onChange={(event, newValue) => {
              setClienteSeleccionado(newValue ? newValue.id : '');
            }}
            noOptionsText="No se encontraron clientes"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cliente"
                placeholder="Buscar por nombre o cédula..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <SearchIcon color="action" sx={{ mr: 1 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <li key={key} {...otherProps}>
                  <Box>
                    <Typography variant="body1">{option.nombre}</Typography>
                    {option.ruc_ci && (
                      <Typography variant="caption" color="text.secondary">
                        {option.ruc_ci}
                      </Typography>
                    )}
                  </Box>
                </li>
              );
            }}
          />
          {clienteSeleccionado && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: '#f0f9ff',
                borderRadius: '8px',
                borderLeft: '4px solid #0288d1',
              }}
            >
              <Typography variant="body2" color="primary">
                ✓ Cliente seleccionado: <strong>{obtenerClienteNombre()}</strong>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Lista de Productos en el Carrito */}
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
            transform: 'translateY(-2px)',
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
                  Carrito de Compras
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {ventaProductos.length} producto(s) agregado(s)
                </Typography>
              </Box>
            </Box>
            {ventaProductos.length > 0 && (
              <Chip
                label={`${ventaProductos.length} item${ventaProductos.length > 1 ? 's' : ''}`}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>

          {ventaProductos.length === 0 ? (
            <Box
              onClick={abrirModalProducto}
              sx={{
                py: 4,
                textAlign: 'center',
                bgcolor: '#f9f9f9',
                borderRadius: '8px',
                border: '2px dashed #ddd',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: '#f0f0f0',
                  borderColor: themeColor,
                  transform: 'scale(1.02)',
                },
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
              <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>
                No hay productos en el carrito
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddCircleIcon />}
                sx={{
                  mt: 1,
                  borderColor: themeColor,
                  color: themeColor,
                  '&:hover': {
                    borderColor: themeColor,
                    bgcolor: alpha(themeColor, 0.1),
                  },
                }}
              >
                Agregar Productos
              </Button>
            </Box>
          ) : (
            <Box>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>
                        Producto
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#333' }}>
                        Cantidad
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: '#333' }}>
                        Precio Unit.
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: '#333' }}>
                        Subtotal
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: '#333' }}>
                        Acción
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ventaProductos.map((item) => (
                      <TableRow
                        key={item.id}
                        sx={{
                          '&:hover': { bgcolor: '#f9f9f9' },
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <TableCell sx={{ color: '#333' }}>
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
                              {item.nombre.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">{item.nombre}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                            <IconButton
                              size="small"
                              onClick={() =>
                                actualizarCantidadProducto(item.id, item.cantidad - 1)
                              }
                              sx={{
                                '&:hover': { bgcolor: '#f0f0f0' },
                              }}
                            >
                              <RemoveIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <TextField
                              size="small"
                              type="number"
                              value={item.cantidad}
                              onChange={(e) =>
                                actualizarCantidadProducto(
                                  item.id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              inputProps={{ min: 1, style: { textAlign: 'center' } }}
                              sx={{ width: 60 }}
                            />
                            <IconButton
                              size="small"
                              onClick={() =>
                                actualizarCantidadProducto(item.id, item.cantidad + 1)
                              }
                              sx={{
                                '&:hover': { bgcolor: '#f0f0f0' },
                              }}
                            >
                              <AddCircleIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#667eea', fontWeight: '600' }}>
                          ${item.precio_venta.toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#333', fontWeight: '600' }}>
                          ${(item.precio_venta * item.cantidad).toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Eliminar del carrito">
                            <IconButton
                              color="error"
                              onClick={() => eliminarProducto(item.id)}
                              size="small"
                              sx={{
                                '&:hover': { bgcolor: '#ffebee' },
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Totales */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorLight} 100%)`,
          color: 'white',
          boxShadow: `0 8px 24px ${themeColorAlpha}`,
        }}
      >
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Subtotal
                </Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                  ${subtotal.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Impuesto
                </Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                  ${impuesto.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                  textAlign: 'center',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.95, fontWeight: '600' }}>
                  TOTAL
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                  ${total.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          {ventaProductos.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <LinearProgress
                variant="determinate"
                value={100}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: themeColor,
                  },
                  borderRadius: '4px',
                }}
              />
              <Typography
                variant="caption"
                sx={{ display: 'block', mt: 1, opacity: 0.9, textAlign: 'center' }}
              >
                ✓ Listo para registrar
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Botón Registrar Venta */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={enviarVenta}
        disabled={loading || ventaProductos.length === 0 || !clienteSeleccionado}
        sx={{
          background: ventaProductos.length > 0 && !loading ? `linear-gradient(135deg, ${themeColor} 0%, ${themeColorLight} 100%)` : undefined,
          color: 'white',
          py: 2,
          fontSize: '1.1rem',
          fontWeight: 'bold',
          borderRadius: 3,
          boxShadow: ventaProductos.length > 0 && !loading ? `0 8px 24px ${themeColorAlpha}` : undefined,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: ventaProductos.length > 0 && !loading ? 'translateY(-4px)' : undefined,
            boxShadow: ventaProductos.length > 0 && !loading ? `0 12px 32px ${themeColorAlpha}` : undefined,
          },
          '&:disabled': {
            background: '#ccc',
            boxShadow: 'none',
          },
        }}
        startIcon={
          loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <ShoppingCartIcon />
          )
        }
      >
        {loading ? 'Procesando...' : 'Registrar Venta'}
      </Button>

      {/* Botón flotante agregar producto */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={abrirModalProducto}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorLight} 100%)`,
          color: 'white',
          boxShadow: `0 8px 24px ${themeColorAlpha}`,
          '&:hover': {
            transform: 'scale(1.1)',
            background: `linear-gradient(135deg, ${themeColorLight} 0%, ${themeColor} 100%)`,
          },
          transition: 'all 0.3s ease',
        }}
      >
        <AddIcon />
      </Fab>

      {/* Modal Agregar Producto Mejorado */}
      <Dialog
        open={modalProducto}
        onClose={() => setModalProducto(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorLight} 100%)`,
            color: 'white',
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <AddIcon sx={{ fontSize: 32 }} />
          <Box>
            <DialogTitle sx={{ p: 0, color: 'white', fontSize: '1.25rem' }}>
              Agregar Producto al Carrito
            </DialogTitle>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Selecciona el producto y la cantidad
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            placeholder="Buscar producto..."
            variant="outlined"
            size="small"
            margin="dense"
            value={busquedaProducto}
            onChange={(e) => setBusquedaProducto(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: '#999' }} />,
              endAdornment: busquedaProducto && (
                <IconButton
                  size="small"
                  onClick={() => setBusquedaProducto('')}
                  sx={{ cursor: 'pointer' }}
                >
                  <ClearIcon sx={{ fontSize: 18 }} />
                </IconButton>
              ),
            }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Producto</InputLabel>
            <Select
              value={productoSeleccionado}
              onChange={(e) => setProductoSeleccionado(e.target.value)}
              label="Producto"
              sx={{
                borderRadius: '8px',
              }}
            >
              <MenuItem value="">
                <em>Seleccione un producto...</em>
              </MenuItem>
              {productosFiltrados.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  <Box display="flex" alignItems="center" gap={1.5} width="100%">
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.75rem',
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                      }}
                    >
                      {p.nombre.charAt(0)}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight="600">
                        {p.nombre}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ${p.precio_venta.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {productoSeleccionado && (
            <Card
              sx={{
                mt: 2,
                bgcolor: '#f5f7fa',
                border: '2px solid #667eea',
                borderRadius: '8px',
              }}
            >
              <CardContent>
                {(() => {
                  const prod = productos.find((p) => p.id === productoSeleccionado);
                  return prod ? (
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                        {prod.nombre}
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 0 }}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="textSecondary">
                            Precio Unit.
                          </Typography>
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            sx={{ color: '#667eea' }}
                          >
                            ${prod.precio_venta.toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="textSecondary">
                            Impuesto
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: '#f5576c' }}>
                            {prod.impuesto_porcentaje.toFixed(1)}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  ) : null;
                })()}
              </CardContent>
            </Card>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Cantidad
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton
                onClick={() =>
                  setCantidadProducto(Math.max(1, parseInt(cantidadProducto) - 1).toString())
                }
                sx={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  '&:hover': { bgcolor: '#f0f0f0' },
                }}
              >
                <RemoveIcon />
              </IconButton>
              <TextField
                type="number"
                value={cantidadProducto}
                onChange={(e) => setCantidadProducto(e.target.value)}
                inputProps={{ min: 1, max: 999, style: { textAlign: 'center', fontSize: '1.2rem' } }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
              <IconButton
                onClick={() =>
                  setCantidadProducto((parseInt(cantidadProducto) + 1).toString())
                }
                sx={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  '&:hover': { bgcolor: '#f0f0f0' },
                }}
              >
                <AddCircleIcon />
              </IconButton>
            </Box>
          </Box>

          {productoSeleccionado && (
            <Box
              sx={{
                mt: 2.5,
                p: 1.5,
                bgcolor: user?.rol_id === 3 ? '#fff3e0' : '#e8f5e9',
                borderRadius: '8px',
                borderLeft: `4px solid ${themeColor}`,
              }}
            >
              {(() => {
                const prod = productos.find((p) => p.id === productoSeleccionado);
                const qty = parseInt(cantidadProducto) || 0;
                const subtot = prod ? prod.precio_venta * qty : 0;
                const imp = (subtot * (prod?.impuesto_porcentaje || 0)) / 100;
                const tot = subtot + imp;
                return (
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="textSecondary">
                        Subtotal:
                      </Typography>
                      <Typography variant="body2" fontWeight="600">
                        ${subtot.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="textSecondary">
                        Total c/ Impuesto:
                      </Typography>
                      <Typography variant="body2" fontWeight="600" color="primary">
                        ${tot.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                );
              })()}
            </Box>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setModalProducto(false)}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={agregarProducto}
            variant="contained"
            disabled={!productoSeleccionado || !cantidadProducto}
            sx={{
              background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorLight} 100%)`,
              borderRadius: '8px',
              textTransform: 'none',
              px: 3,
              fontWeight: 'bold',
              '&:disabled': {
                background: '#ccc',
              },
            }}
            startIcon={<AddIcon />}
          >
            Agregar al Carrito
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
