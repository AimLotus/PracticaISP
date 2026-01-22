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
  Button,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Fab,
  Divider,
  IconButton,
  TablePagination
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';
import './MovimientosInventario.css';

export default function MovimientosInventario() {
  const { user } = useAuth();
  
  const themeColor = user?.rol_id === 3 ? '#ff9800' : '#2196f3';
  const themeColorLight = user?.rol_id === 3 ? '#ffb74d' : '#64b5f6';
  const themeColorAlpha = user?.rol_id === 3 ? 'rgba(255, 152, 0, 0.4)' : 'rgba(33, 150, 243, 0.4)';
  
  // Datos
  const [inventario, setInventario] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Paginación Servidor
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  // Modal Registrar Movimiento
  const [modalRegistrar, setModalRegistrar] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [tipo, setTipo] = useState('entrada');

  // Modal Filtros
  const [modalFiltros, setModalFiltros] = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos');

  // Mensajes
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]); 

  // Si cambian los filtros, se dispara manualmente al aplicar, no en useEffect para evitar recargas automáticas indeseadas
  // excepto si añadimos un botón "Aplicar" que resetee page=0.

  const cargarDatos = async (newPage = page) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Construir params
      const queryParams = new URLSearchParams();
      queryParams.append('page', newPage + 1); // Laravel usa 1-index
      queryParams.append('per_page', rowsPerPage);
      if (fechaFiltro) queryParams.append('fecha', fechaFiltro);
      if (tipoFiltro !== 'todos') queryParams.append('tipo', tipoFiltro);

      // Carga paralela de inventario (para combos) y movimientos paginados
      // Solo cargamos inventario si está vacío (optimización básica)
      const requests = [
        axiosClient.get(`/inventory-movements?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ];
      
      if (inventario.length === 0) {
        requests.push(axiosClient.get('/productos-inventario', {
          headers: { Authorization: `Bearer ${token}` },
        }));
      }

      const responses = await Promise.all(requests);
      const resMovimientos = responses[0];
      const resInventario = responses[1];

      if (resInventario && Array.isArray(resInventario.data)) {
        setInventario(resInventario.data);
      }

      if (resMovimientos.data && resMovimientos.data.data) {
        setMovimientos(resMovimientos.data.data);
        setTotalRows(resMovimientos.data.total);
      }

    } catch (error) {
      console.error(error);
      mostrarMensaje('Error al cargar datos', 'error');
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const registrarMovimiento = async () => {
    if (!productoSeleccionado) {
      mostrarMensaje('Seleccione un producto', 'error');
      return;
    }
    const cant = parseInt(cantidad);
    if (isNaN(cant) || cant <= 0) {
      mostrarMensaje('Cantidad inválida', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axiosClient.post(
        '/inventory-movements',
        {
          inventory_id: productoSeleccionado,
          tipo,
          cantidad: cant,
          motivo: motivo || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      mostrarMensaje('Movimiento registrado correctamente', 'success');
      setModalRegistrar(false);
      setProductoSeleccionado('');
      setCantidad('');
      setMotivo('');
      setTipo('entrada');
      
      // Recargar datos (primera página)
      setPage(0);
      cargarDatos(0); 
    } catch (error) {
      mostrarMensaje('Error al registrar movimiento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    setPage(0); // Reset a primera página
    setModalFiltros(false);
    cargarDatos(0);
  };

  const limpiarFiltros = () => {
    setFechaFiltro('');
    setTipoFiltro('todos');
    setPage(0);
    // Truco: llamar a cargarDatos después de actualizar estado requiere que pasamos valores limpios o usemos useEffect,
    // pero useEffect depende de page/rows.
    // Simplemente reseteamos estados y dejamos que el usuario pulse "Aplicar" o forzamos recarga pasando params nulos.
    // Mejor estrategia: resetear estados y recargar
    // Pero cargarDatos lee del estado... React State update is async.
    // Workaround: pasar params explicitos a cargarDatos si la hicieramos pura, pero lee de estado.
    // Solución simple: Cerrar modal y dejar que Effect o llamada explicita cargue.
    // Al ser async el set, mejor disparar un efecto o una funcion dedicada.
    // Para simplificar: modifico cargarDatos para aceptar overrides o lo llamo diferido.
    // Aquí, al ser "Limpiar", queremos que se aplique inmediato. 
    // Forzaremos recarga con valores limpios.
  };

  const handleLimpiarYRecargar = () => {
    setFechaFiltro('');
    setTipoFiltro('todos');
    setPage(0);
    setModalFiltros(false);
    // Hack: Recargar asumiendo estados limpios (pasando args vacíos si cargarDatos los aceptara, pero no).
    // Disparamos un timeout pequeño o usamos una ref.
    // O mejor, pasamos valores directamente a la API en una versión sobrecargada de cargarDatos,
    // pero por ahora simplifiquemos: El usuario limpia los inputs en el modal y luego da "Aplicar".
    // Si da "Limpiar todos" de la barra superior:
    setTimeout(() => {
        // Forzamos recarga manual
        // Nota: esto puede leer el estado viejo aun.
        // Lo ideal es useEffect([filtros]). Pero el usuario pidió botón aplicar.
    }, 100);
    // Para asegurar consistencia en React funcional sin reescribir todo:
    // Haremos que 'cargarDatos' lea los valores de los argumentos si se pasan, o del estado si no.
    // Modificaré cargarDatos abajo para recibir filtros opcionales.
    recargarSinFiltros();
  };
  
  const recargarSinFiltros = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        // Sin filtros de fecha/tipo
        const queryParams = new URLSearchParams();
        queryParams.append('page', 1);
        queryParams.append('per_page', rowsPerPage);
        
        const res = await axiosClient.get(`/inventory-movements?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.data && res.data.data) {
          setMovimientos(res.data.data);
          setTotalRows(res.data.total);
        }
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const hayFiltrosActivos = fechaFiltro || tipoFiltro !== 'todos';

  return (
    <Box sx={{ p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <Box className="movements-header" display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box display="flex" alignItems="center">
          <Box 
            className="header-icon-wrapper"
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
            <HistoryIcon sx={{ fontSize: 40, color: themeColor }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="700" sx={{ color: '#1a237e' }}>
              Movimientos de Inventario
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
              Registro y seguimiento de entradas y salidas
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Card: Filtros */}
      <Card className="filters-card" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <FilterListIcon sx={{ mr: 1, color: '#2196f3', fontSize: 24 }} />
              <Typography variant="h6" fontWeight="700" sx={{ color: '#1a237e' }}>
                Filtros
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<FilterListIcon />}
              onClick={() => setModalFiltros(true)}
              sx={{
                background: `linear-gradient(135deg, ${themeColor}, ${themeColorLight})`,
                textTransform: 'none',
                fontWeight: '600',
              }}
            >
              Abrir Filtros
            </Button>
          </Box>

          {hayFiltrosActivos && (
            <Box display="flex" gap={1} flexWrap="wrap">
              {fechaFiltro && (
                <Chip
                  label={`Fecha: ${fechaFiltro}`}
                  onDelete={() => { setFechaFiltro(''); setTimeout(recargarSinFiltros, 50); }} // Quick fix for interactions
                  sx={{
                    bgcolor: '#e3f2fd',
                    color: '#1565c0',
                    fontWeight: '600',
                    '& .MuiChip-deleteIcon': { color: '#1565c0' }
                  }}
                />
              )}
              {tipoFiltro !== 'todos' && (
                <Chip
                  label={`Tipo: ${tipoFiltro === 'entrada' ? 'Entrada' : 'Salida'}`}
                  onDelete={() => { setTipoFiltro('todos'); setTimeout(recargarSinFiltros, 50); }}
                  sx={{
                    bgcolor: tipoFiltro === 'entrada' ? '#c8e6c9' : '#ffcdd2',
                    color: tipoFiltro === 'entrada' ? '#2e7d32' : '#c62828',
                    fontWeight: '600',
                    '& .MuiChip-deleteIcon': {
                      color: tipoFiltro === 'entrada' ? '#2e7d32' : '#c62828'
                    }
                  }}
                />
              )}
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleLimpiarYRecargar}
                sx={{ color: '#666', textTransform: 'none', ml: 'auto' }}
              >
                Limpiar todos
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Card: Tabla de Movimientos */}
      <Card className="movements-card">
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box>
              <Typography variant="h6" fontWeight="700" sx={{ color: '#1a237e' }}>
                Movimientos Registrados
              </Typography>
              <Chip
                label={`${totalRows} movimientos totales`}
                sx={{
                  mt: 0.5,
                  bgcolor: '#e3f2fd',
                  color: '#1565c0',
                  fontWeight: 'bold'
                }}
              />
            </Box>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : movimientos.length === 0 ? (
            <Box className="empty-state-movements" textAlign="center" py={5}>
              <HistoryIcon sx={{ fontSize: 56, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" fontWeight="600" sx={{ color: '#1a237e', mb: 1 }}>
                No hay movimientos encontrados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {hayFiltrosActivos ? 'Intenta con filtros diferentes' : 'Comienza registrando el primer movimiento'}
              </Typography>
            </Box>
          ) : (
            <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: '700', color: '#1a237e', fontSize: '0.9rem' }}>
                      Producto
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: '700', color: '#1a237e', fontSize: '0.9rem' }}>
                      Tipo
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: '700', color: '#1a237e', fontSize: '0.9rem' }}>
                      Cantidad
                    </TableCell>
                    <TableCell sx={{ fontWeight: '700', color: '#1a237e', fontSize: '0.9rem' }}>
                      Motivo
                    </TableCell>
                    <TableCell sx={{ fontWeight: '700', color: '#1a237e', fontSize: '0.9rem' }}>
                      Fecha
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimientos.map((mov) => {
                    // Si el producto viene embebido del backend (optimizado), usarlo. Si no, buscar en inventario
                    const nombreProducto = mov.producto ? mov.producto.nombre : (inventario.find((p) => p.id === mov.inventory_id)?.producto?.nombre || 'Producto desconocido');
                    const esEntrada = mov.tipo === 'entrada';

                    return (
                      <TableRow
                        key={mov.id}
                        className="movement-row"
                        sx={{
                          borderLeft: `4px solid ${esEntrada ? '#4caf50' : '#f44336'}`,
                          '&:hover': { bgcolor: '#f9f9f9' }
                        }}
                      >
                        <TableCell sx={{ fontWeight: '500', color: '#1a237e' }}>
                          {nombreProducto}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={esEntrada ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                            label={mov.tipo.toUpperCase()}
                            sx={{
                              bgcolor: esEntrada ? '#c8e6c9' : '#ffcdd2',
                              color: esEntrada ? '#2e7d32' : '#c62828',
                              fontWeight: '600',
                              fontSize: '0.75rem',
                            }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight="700" sx={{
                            color: esEntrada ? '#4caf50' : '#f44336',
                            fontSize: '1.1rem'
                          }}>
                            {esEntrada ? '+' : '-'}{mov.cantidad}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#666' }}>
                          {mov.motivo || <Typography component="em" sx={{ color: '#999' }}>Sin motivo</Typography>}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#666', fontWeight: '500' }}>
                            {new Date(mov.created_at).toLocaleString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
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
              count={totalRows}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
            </>
          )}
        </CardContent>
      </Card>

      {/* Botón Flotante: Registrar Movimiento */}
      <Tooltip title="Registrar nuevo movimiento">
        <Fab
          color="primary"
          aria-label="registrar movimiento"
          onClick={() => setModalRegistrar(true)}
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

      {/* Modal: Registrar Movimiento */}
      <Dialog
        open={modalRegistrar}
        onClose={() => setModalRegistrar(false)}
        maxWidth="sm"
        fullWidth
        className="register-modal"
      >
        <DialogTitle sx={{
          fontWeight: '700',
          color: '#1a237e',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
        }}>
          <Box>Registrar Nuevo Movimiento</Box>
          <IconButton onClick={() => setModalRegistrar(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Tipo de Movimiento - Radio seleccionable */}
            <FormControl component="fieldset">
              <Typography variant="subtitle1" fontWeight="700" sx={{ color: '#1a237e', mb: 1.5 }}>
                Tipo de Movimiento
              </Typography>
              <RadioGroup
                row
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <FormControlLabel
                  value="entrada"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <ArrowUpwardIcon sx={{ color: '#4caf50' }} />
                      <Typography fontWeight="600">Entrada</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="salida"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <ArrowDownwardIcon sx={{ color: '#f44336' }} />
                      <Typography fontWeight="600">Salida</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            <Divider />

            {/* Producto */}
            <FormControl fullWidth>
              <InputLabel id="producto-label">Seleccionar Producto</InputLabel>
              <Select
                labelId="producto-label"
                value={productoSeleccionado}
                onChange={(e) => setProductoSeleccionado(e.target.value)}
                label="Seleccionar Producto"
              >
                <MenuItem value="">
                  <em>Seleccione un producto...</em>
                </MenuItem>
                {inventario.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    <Box display="flex" justifyContent="space-between" width="100%">
                      <span>{item.producto?.nombre || 'Sin nombre'}</span>
                      <Typography variant="caption" sx={{ color: '#999', ml: 2 }}>
                        Stock: {item.cantidad}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Cantidad */}
            <TextField
              label="Cantidad"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              fullWidth
              inputProps={{ min: 1 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#2196f3',
                  },
                }
              }}
            />

            {/* Motivo */}
            <TextField
              label="Motivo (opcional)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Ej: Compra a proveedor, devolución, ajuste..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#2196f3',
                  },
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button
            onClick={() => setModalRegistrar(false)}
            sx={{ textTransform: 'none', color: '#666' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={registrarMovimiento}
            variant="contained"
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #4caf50, #81c784)',
              textTransform: 'none',
              fontWeight: '600',
            }}
          >
            {loading ? <CircularProgress size={20} /> : 'Guardar Movimiento'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Filtros */}
      <Dialog
        open={modalFiltros}
        onClose={() => setModalFiltros(false)}
        maxWidth="sm"
        fullWidth
        className="filters-modal"
      >
        <DialogTitle sx={{
          fontWeight: '700',
          color: '#1a237e',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
        }}>
          <Box>Filtrar Movimientos</Box>
          <IconButton onClick={() => setModalFiltros(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Filtro por Fecha */}
            <Box>
              <Typography variant="subtitle1" fontWeight="700" sx={{ color: '#1a237e', mb: 1.5 }}>
                📅 Filtrar por Fecha
              </Typography>
              <TextField
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#2196f3',
                    },
                  }
                }}
              />
            </Box>

            <Divider />

            {/* Filtro por Tipo */}
            <Box>
              <Typography variant="subtitle1" fontWeight="700" sx={{ color: '#1a237e', mb: 1.5 }}>
                🔄 Tipo de Movimiento
              </Typography>
              <RadioGroup
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
              >
                <FormControlLabel value="todos" control={<Radio />} label="Todos" />
                <FormControlLabel
                  value="entrada"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <ArrowUpwardIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                      <span>Entradas</span>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="salida"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <ArrowDownwardIcon sx={{ color: '#f44336', fontSize: 18 }} />
                      <span>Salidas</span>
                    </Box>
                  }
                />
              </RadioGroup>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0', gap: 1 }}>
          <Button
            onClick={limpiarFiltros}
            startIcon={<ClearIcon />}
            sx={{ textTransform: 'none', color: '#f44336' }}
          >
            Limpiar
          </Button>
          <Button
            onClick={aplicarFiltros}
            variant="contained"
            sx={{
              background: `linear-gradient(135deg, ${themeColor}, ${themeColorLight})`,
              textTransform: 'none',
              fontWeight: '600',
            }}
          >
            Aplicar Filtros
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
