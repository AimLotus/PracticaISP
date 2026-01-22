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
  Avatar,
  Chip,
  alpha,
  InputAdornment,
  Badge,
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveIcon from '@mui/icons-material/Save';
import RemoveIcon from '@mui/icons-material/Remove';
import ClearIcon from '@mui/icons-material/Clear';
import axiosClient from '../../api/axiosClient';

export default function ComprasScreen() {
  // Datos
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [compraProductos, setCompraProductos] = useState([]); // Carrito
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
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

  const mostrarMensaje = (msg, tipo = 'success') => {
    setMensaje(msg);
    setTipoMensaje(tipo);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Carga paralela de proveedores y productos
      const [resProveedores, resProductos] = await Promise.all([
        axiosClient.get('/proveedores', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axiosClient.get('/products', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setProveedores(resProveedores.data);

      // Formatear productos con precio_compra (no precio_venta) e impuesto_porcentaje
      const productosFormateados = resProductos.data.map((prod) => ({
        ...prod,
        precio_compra: parseFloat(prod.precio_compra),
        impuesto_porcentaje: prod.tax ? parseFloat(prod.tax.porcentaje) : 0,
      }));

      setProductos(productosFormateados);
    } catch (error) {
      mostrarMensaje('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calcularTotales = () => {
    let subtotal = 0;
    let impuesto = 0;

    compraProductos.forEach((item) => {
      const precioTotal = item.precio_compra * item.cantidad;
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

  const agregarProducto = () => {
    // Validación producto seleccionado
    if (!productoSeleccionado) {
      mostrarMensaje('Seleccione un producto', 'error');
      return;
    }

    // Validación cantidad
    const cant = parseInt(cantidadProducto);
    if (isNaN(cant) || cant <= 0) {
      mostrarMensaje('Cantidad inválida', 'error');
      return;
    }

    const producto = productos.find((p) => p.id === productoSeleccionado);
    if (!producto) return;

    // Si el producto ya existe en el carrito, aumentar cantidad
    const existe = compraProductos.find((p) => p.id === producto.id);
    if (existe) {
      setCompraProductos(
        compraProductos.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + cant } : p
        )
      );
    } else {
      // Si no existe, agregarlo
      setCompraProductos([...compraProductos, { ...producto, cantidad: cant }]);
    }

    setModalProducto(false);
    setProductoSeleccionado('');
    setCantidadProducto('1');
    mostrarMensaje('Producto agregado al carrito', 'success');
  };

  const eliminarProducto = (id) => {
    setCompraProductos(compraProductos.filter((p) => p.id !== id));
    mostrarMensaje('Producto eliminado del carrito', 'info');
  };

  const enviarCompra = async () => {
    // Validación proveedor seleccionado
    if (!proveedorSeleccionado) {
      mostrarMensaje('Seleccione un proveedor', 'error');
      return;
    }

    // Validación carrito no vacío
    if (compraProductos.length === 0) {
      mostrarMensaje('Agregue al menos un producto', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const payload = {
        provider_id: proveedorSeleccionado,
        productos: compraProductos.map((p) => ({
          product_id: p.id,
          cantidad: p.cantidad,
        })),
      };

      const res = await axiosClient.post('/compras', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      mostrarMensaje(
        res.data.mensaje || 'Compra registrada correctamente',
        'success'
      );

      // Si hay URL de reporte, abrirla en nueva pestaña
      if (res.data.url_reporte) {
        window.open(res.data.url_reporte, '_blank');
      }

      // Limpiar formulario
      setProveedorSeleccionado('');
      setCompraProductos([]);
    } catch (error) {
      const msj =
        error.response?.data?.error ||
        error.response?.data?.mensaje ||
        'Error al registrar la compra';
      mostrarMensaje(msj, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Loading inicial (solo primera carga)
  if (loading && proveedores.length === 0 && productos.length === 0) {
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
          background: 'linear-gradient(135deg, #ff9800 0%, #ce7c00 100%)',
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
                Registrar Compra
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Ingresa los productos de tu nueva compra
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={`${compraProductos.length} ${compraProductos.length === 1 ? 'Producto' : 'Productos'}`}
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

      {/* Card: Selector de Proveedor */}
      <Card 
        elevation={0}
        sx={{ 
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <Avatar sx={{ bgcolor: alpha('#ff9800', 0.1), mr: 2 }}>
              <BusinessIcon sx={{ color: '#ff9800' }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">Proveedor</Typography>
              <Typography variant="body2" color="text.secondary">
                Selecciona el proveedor de la compra
              </Typography>
            </Box>
          </Box>
          <Autocomplete
            options={proveedores}
            getOptionLabel={(option) => option.nombre}
            filterOptions={(options, { inputValue }) => {
              const search = inputValue.toLowerCase();
              return options.filter(
                (option) =>
                  option.nombre.toLowerCase().includes(search) ||
                  (option.ruc_ci && option.ruc_ci.includes(search))
              );
            }}
            value={proveedores.find((p) => p.id === proveedorSeleccionado) || null}
            onChange={(event, newValue) => {
              setProveedorSeleccionado(newValue ? newValue.id : '');
            }}
            noOptionsText="No se encontraron proveedores"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Proveedor"
                placeholder="Buscar por nombre o RUC..."
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
        </CardContent>
      </Card>

      {/* Card: Lista de Productos (Carrito) */}
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
                <InventoryIcon sx={{ color: '#ff9800' }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">Productos</Typography>
                <Typography variant="body2" color="text.secondary">
                  {compraProductos.length} {compraProductos.length === 1 ? 'producto agregado' : 'productos agregados'}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={abrirModalProducto}
              sx={{
                bgcolor: '#ff9800',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: '#f57c00'
                }
              }}
            >
              Agregar Producto
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {compraProductos.length === 0 ? (
            <Box 
              onClick={abrirModalProducto}
              sx={{ 
                p: 6, 
                textAlign: 'center',
                bgcolor: alpha('#f5f5f5', 0.5),
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '2px dashed transparent',
                '&:hover': {
                  bgcolor: alpha('#ff9800', 0.05),
                  borderColor: '#ff9800',
                  transform: 'scale(1.01)'
                }
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
                <ShoppingCartIcon sx={{ fontSize: 40, color: '#999' }} />
              </Avatar>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay productos agregados
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Comienza agregando productos a tu compra
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ 
                  borderRadius: 2,
                  bgcolor: '#ff9800',
                  '&:hover': { bgcolor: '#f57c00' }
                }}
              >
                Agregar Producto
              </Button>
            </Box>
          ) : (
            <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha('#f5f5f5', 0.8) }}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">Producto</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="subtitle2" fontWeight="bold">Cantidad</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight="bold">Precio Unit.</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight="bold">Subtotal</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="subtitle2" fontWeight="bold">Acciones</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {compraProductos.map((item) => (
                    <TableRow 
                      key={item.id} 
                      hover
                      sx={{
                        '&:hover': {
                          bgcolor: alpha('#ff9800', 0.05)
                        }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ bgcolor: alpha('#ff9800', 0.1), width: 32, height: 32 }}>
                            <InventoryIcon sx={{ fontSize: 18, color: '#ff9800' }} />
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {item.nombre}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={item.cantidad}
                          size="small"
                          sx={{ 
                            bgcolor: alpha('#ff9800', 0.1),
                            color: '#ff9800',
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium" color="text.secondary">
                          ${item.precio_compra.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          ${(item.precio_compra * item.cantidad).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Eliminar producto">
                          <IconButton
                            onClick={() => eliminarProducto(item.id)}
                            size="small"
                            sx={{
                              bgcolor: alpha('#f44336', 0.1),
                              '&:hover': {
                                bgcolor: alpha('#f44336', 0.2)
                              }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 20, color: '#f44336' }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Card: Totales */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar sx={{ bgcolor: alpha('#9c27b0', 0.1), width: 48, height: 48, margin: '0 auto', mb: 2 }}>
                <ReceiptIcon sx={{ color: '#9c27b0' }} />
              </Avatar>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Subtotal
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#9c27b0">
                ${subtotal.toFixed(2)}
              </Typography>
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
              height: '100%'
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar sx={{ bgcolor: alpha('#ff9800', 0.1), width: 48, height: 48, margin: '0 auto', mb: 2 }}>
                <AttachMoneyIcon sx={{ color: '#ff9800' }} />
              </Avatar>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Impuesto
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#ff9800">
                ${impuesto.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 3,
              border: '2px solid',
              borderColor: '#4caf50',
              bgcolor: alpha('#4caf50', 0.05),
              height: '100%'
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar sx={{ bgcolor: alpha('#4caf50', 0.1), width: 48, height: 48, margin: '0 auto', mb: 2 }}>
                <AttachMoneyIcon sx={{ color: '#4caf50' }} />
              </Avatar>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total a Pagar
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="#4caf50">
                ${total.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Botón Registrar Compra */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={enviarCompra}
        disabled={loading || compraProductos.length === 0 || !proveedorSeleccionado}
        startIcon={
          loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <SaveIcon />
          )
        }
        sx={{
          py: 2,
          borderRadius: 2,
          fontSize: '1.1rem',
          fontWeight: 'bold',
          textTransform: 'none',
          background: 'linear-gradient(135deg, #ff9800 0%, #c77700 100%)',
          boxShadow: '0 4px 12px rgba(234, 188, 102, 0.4)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(234, 194, 102, 0.5)',
          },
          '&:disabled': {
            background: '#ccc',
            color: '#666'
          }
        }}
      >
        {loading ? 'Procesando Compra...' : 'Registrar Compra'}
      </Button>

      {/* Modal: Agregar Producto */}
      <Dialog
        open={modalProducto}
        onClose={() => setModalProducto(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #ff9800 0%, #bd7200 100%)',
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
              Agregar Producto a la Compra
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
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="">
                <em>Seleccione un producto...</em>
              </MenuItem>
              {productosFiltrados.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  <Box display="flex" justifyContent="space-between" width="100%">
                    <Typography>{p.nombre}</Typography>
                    <Chip
                      label={`$${p.precio_compra.toFixed(2)}`}
                      size="small"
                      sx={{
                        bgcolor: alpha('#4caf50', 0.1),
                        color: '#4caf50',
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box display="flex" alignItems="center" justifyContent="center" mt={3} gap={2}>
            <IconButton
              onClick={() =>
                setCantidadProducto(
                  Math.max(1, (parseInt(cantidadProducto) || 1) - 1).toString()
                )
              }
              color="primary"
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <RemoveIcon />
            </IconButton>
            <TextField
              value={cantidadProducto}
              onChange={(e) => setCantidadProducto(e.target.value)}
              type="number"
              inputProps={{ min: 1, style: { textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' } }}
              sx={{ width: 100 }}
              variant="standard"
            />
            <IconButton
              onClick={() =>
                setCantidadProducto(((parseInt(cantidadProducto) || 0) + 1).toString())
              }
              color="primary"
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 2 }}>
          <Button 
            onClick={() => setModalProducto(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={agregarProducto} 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              bgcolor: '#ff9800',
              '&:hover': {
                bgcolor: '#f57c00'
              }
            }}
          >
            Agregar al Carrito
          </Button>
        </DialogActions>
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
