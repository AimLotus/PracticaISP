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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
  InputAdornment,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

import axiosClient from '../../api/axiosClient';

export default function GestionImpuestos() {
  const [impuestos, setImpuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [impuestoSeleccionado, setImpuestoSeleccionado] = useState(null);
  const [impuestoParaEliminar, setImpuestoParaEliminar] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Campos del formulario
  const [nombreEditado, setNombreEditado] = useState('');
  const [porcentajeEditado, setPorcentajeEditado] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [porcentajeNuevo, setPorcentajeNuevo] = useState('');

  // Errores de validación
  const [errores, setErrores] = useState({
    nombreNuevo: '',
    porcentajeNuevo: '',
    nombreEditado: '',
    porcentajeEditado: '',
  });

  // Mensajes
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('success');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    cargarImpuestos();
  }, []);

  const cargarImpuestos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axiosClient.get('/taxes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setImpuestos(response.data);
    } catch (error) {
      console.error('Error al cargar impuestos:', error);
      mostrarMensaje('Error al cargar impuestos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarImpuestos();
    setRefreshing(false);
  };

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    setOpenSnackbar(true);
  };

  // Validar nombre
  const validarNombre = (value, isCreating = false) => {
    const errorKey = isCreating ? 'nombreNuevo' : 'nombreEditado';
    const nuevosErrores = { ...errores };
    
    if (!value.trim()) {
      nuevosErrores[errorKey] = 'El nombre es obligatorio';
    } else if (value.trim().length < 2) {
      nuevosErrores[errorKey] = 'El nombre debe tener al menos 2 caracteres';
    } else {
      nuevosErrores[errorKey] = '';
    }
    setErrores(nuevosErrores);
  };

  // Validar porcentaje
  const validarPorcentaje = (value, isCreating = false) => {
    const errorKey = isCreating ? 'porcentajeNuevo' : 'porcentajeEditado';
    const nuevosErrores = { ...errores };
    const num = parseFloat(value);
    
    if (!value.trim()) {
      nuevosErrores[errorKey] = 'El porcentaje es obligatorio';
    } else if (isNaN(num)) {
      nuevosErrores[errorKey] = 'Debe ser un número válido';
    } else if (num < 0 || num > 100) {
      nuevosErrores[errorKey] = 'El porcentaje debe estar entre 0 y 100';
    } else {
      nuevosErrores[errorKey] = '';
    }
    setErrores(nuevosErrores);
  };

  const abrirCrear = () => {
    setNombreNuevo('');
    setPorcentajeNuevo('');
    setErrores({
      nombreNuevo: '',
      porcentajeNuevo: '',
      nombreEditado: '',
      porcentajeEditado: '',
    });
    setModalCrear(true);
  };

  const crearImpuesto = async () => {
    validarNombre(nombreNuevo, true);
    validarPorcentaje(porcentajeNuevo, true);

    if (errores.nombreNuevo || errores.porcentajeNuevo) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axiosClient.post(
        '/taxes',
        { nombre: nombreNuevo.trim(), porcentaje: parseFloat(porcentajeNuevo) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrarMensaje(`✓ Impuesto "${nombreNuevo}" creado correctamente`, 'success');
      setModalCrear(false);
      cargarImpuestos();
    } catch (error) {
      console.error('Error al crear impuesto:', error);
      mostrarMensaje('Error al crear el impuesto', 'error');
    }
  };

  const abrirEditar = (impuesto) => {
    setImpuestoSeleccionado(impuesto);
    setNombreEditado(impuesto.nombre);
    setPorcentajeEditado(impuesto.porcentaje.toString());
    setErrores({
      nombreNuevo: '',
      porcentajeNuevo: '',
      nombreEditado: '',
      porcentajeEditado: '',
    });
    setModalEditar(true);
  };

  const guardarCambios = async () => {
    validarNombre(nombreEditado, false);
    validarPorcentaje(porcentajeEditado, false);

    if (errores.nombreEditado || errores.porcentajeEditado) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axiosClient.put(
        `/taxes/${impuestoSeleccionado.id}`,
        { nombre: nombreEditado.trim(), porcentaje: parseFloat(porcentajeEditado) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrarMensaje('✓ Impuesto actualizado correctamente', 'success');
      setModalEditar(false);
      cargarImpuestos();
    } catch (error) {
      console.error('Error al actualizar impuesto:', error);
      mostrarMensaje('Error al actualizar el impuesto', 'error');
    }
  };

  const confirmarEliminar = (impuesto) => {
    setImpuestoParaEliminar(impuesto);
    setModalEliminar(true);
  };

  const eliminarImpuesto = async () => {
    try {
      const token = localStorage.getItem('token');
      await axiosClient.delete(`/taxes/${impuestoParaEliminar.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      mostrarMensaje('✓ Impuesto eliminado correctamente', 'success');
      setModalEliminar(false);
      cargarImpuestos();
    } catch (error) {
      console.error('Error al eliminar impuesto:', error);
      mostrarMensaje('Error al eliminar el impuesto', 'error');
    }
  };

  const toggleActivo = async (impuesto) => {
    try {
      const token = localStorage.getItem('token');
      await axiosClient.patch(
        `/taxes/${impuesto.id}/toggle-activo`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrarMensaje(
        `✓ Impuesto ${impuesto.activo ? 'desactivado' : 'activado'} correctamente`,
        'success'
      );
      cargarImpuestos();
    } catch (error) {
      console.error('Error al cambiar estado del impuesto:', error);
      mostrarMensaje('Error al cambiar el estado', 'error');
    }
  };

  // Filtrar impuestos según búsqueda
  const impuestosFiltrados = impuestos.filter((impuesto) =>
    impuesto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular estadísticas
  const stats = {
    total: impuestos.length,
    activos: impuestos.filter(i => i.activo).length,
    inactivos: impuestos.filter(i => !i.activo).length,
    promedio: impuestos.length > 0 
      ? (impuestos.reduce((sum, i) => sum + parseFloat(i.porcentaje), 0) / impuestos.length).toFixed(2)
      : 0,
    maximo: impuestos.length > 0
      ? Math.max(...impuestos.map(i => parseFloat(i.porcentaje))).toFixed(2)
      : 0,
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between"
        mb={4}
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'flex-start', sm: 'center' },
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LocalOfferIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#1a1a1a' }}>
              Gestión de Impuestos
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
              Administra las tasas impositivas del sistema
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Actualizar datos">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ 
              textTransform: 'none',
              borderRadius: '8px',
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          >
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </Tooltip>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ borderRadius: '12px', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #ff9800, #f57c00)' } }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                Total
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#ff9800' }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ borderRadius: '12px', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #4caf50, #81c784)' } }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                Activos
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#4caf50' }}>
                {stats.activos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ borderRadius: '12px', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f44336, #ef5350)' } }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                Inactivos
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#f44336' }}>
                {stats.inactivos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ borderRadius: '12px', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #2196f3, #64b5f6)' } }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                Promedio
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#2196f3' }}>
                {stats.promedio}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Búsqueda y Acciones */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: '12px', backgroundColor: '#f8f9fa' }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            placeholder="Buscar impuesto por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#999' }} />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{
              flex: 1,
              minWidth: '250px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: 'white',
              },
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={abrirCrear}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              px: 3,
            }}
          >
            Nuevo Impuesto
          </Button>
        </Box>
      </Paper>

      {/* Tabla de Impuestos */}
      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
              <TableCell sx={{ fontWeight: '700', color: '#333', py: 2 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: '700', color: '#333', py: 2 }}>Porcentaje</TableCell>
              <TableCell sx={{ fontWeight: '700', color: '#333', py: 2 }}>Estado</TableCell>
              <TableCell align="center" sx={{ fontWeight: '700', color: '#333', py: 2 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {impuestosFiltrados.length > 0 ? (
              impuestosFiltrados.map((impuesto) => {
                const porcentajeNum = parseFloat(impuesto.porcentaje);
                return (
                  <TableRow
                    key={impuesto.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: '#f8f9fa',
                        transition: 'background-color 0.2s ease',
                      },
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'linear-gradient(135deg, #ff9800, #f57c00)',
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        >
                          {impuesto.nombre.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography fontWeight="600">{impuesto.nombre}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <TrendingUpIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                        <Typography fontWeight="600">{!isNaN(porcentajeNum) ? porcentajeNum.toFixed(2) : '-'}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Chip
                        label={impuesto.activo ? 'Activo' : 'Inactivo'}
                        size="small"
                        sx={{
                          bgcolor: impuesto.activo ? '#e8f5e9' : '#ffebee',
                          color: impuesto.activo ? '#2e7d32' : '#c62828',
                          fontWeight: '600',
                          border: `1px solid ${impuesto.activo ? '#4caf50' : '#f44336'}20`,
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleActivo(impuesto)}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        <Tooltip title="Editar impuesto">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => abrirEditar(impuesto)}
                            sx={{
                              '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                borderRadius: '8px',
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar impuesto">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => confirmarEliminar(impuesto)}
                            sx={{
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 0.08)',
                                borderRadius: '8px',
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchTerm ? 'No se encontraron impuestos con esa búsqueda' : 'No hay impuestos registrados'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal Crear */}
      <Dialog
        open={modalCrear}
        onClose={() => setModalCrear(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
          Crear Nuevo Impuesto
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            label="Nombre del impuesto"
            type="text"
            fullWidth
            variant="outlined"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            onBlur={() => validarNombre(nombreNuevo, true)}
            error={!!errores.nombreNuevo}
            helperText={errores.nombreNuevo}
            placeholder="Ej: IVA, ICE, ISR"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocalOfferIcon sx={{ color: '#ff9800' }} />
                </InputAdornment>
              ),
              endAdornment: nombreNuevo && !errores.nombreNuevo ? (
                <InputAdornment position="end">
                  <CheckCircleIcon sx={{ color: '#4caf50' }} />
                </InputAdornment>
              ) : null,
            }}
          />
          <TextField
            label="Porcentaje (%)"
            type="number"
            fullWidth
            variant="outlined"
            value={porcentajeNuevo}
            onChange={(e) => setPorcentajeNuevo(e.target.value)}
            onBlur={() => validarPorcentaje(porcentajeNuevo, true)}
            error={!!errores.porcentajeNuevo}
            helperText={errores.porcentajeNuevo || 'Valor entre 0 y 100'}
            inputProps={{ step: '0.01', min: '0', max: '100' }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TrendingUpIcon sx={{ color: '#ff9800' }} />
                </InputAdornment>
              ),
              endAdornment: porcentajeNuevo && !errores.porcentajeNuevo ? (
                <InputAdornment position="end">
                  <CheckCircleIcon sx={{ color: '#4caf50' }} />
                </InputAdornment>
              ) : null,
            }}
          />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalCrear(false)} sx={{ textTransform: 'none', borderRadius: '8px' }}>
            Cancelar
          </Button>
          <Button
            onClick={crearImpuesto}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
            }}
          >
            Crear Impuesto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Editar */}
      <Dialog
        open={modalEditar}
        onClose={() => setModalEditar(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
          Editar Impuesto
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            label="Nombre del impuesto"
            type="text"
            fullWidth
            variant="outlined"
            value={nombreEditado}
            onChange={(e) => setNombreEditado(e.target.value)}
            onBlur={() => validarNombre(nombreEditado, false)}
            error={!!errores.nombreEditado}
            helperText={errores.nombreEditado}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocalOfferIcon sx={{ color: '#ff9800' }} />
                </InputAdornment>
              ),
              endAdornment: nombreEditado && !errores.nombreEditado ? (
                <InputAdornment position="end">
                  <CheckCircleIcon sx={{ color: '#4caf50' }} />
                </InputAdornment>
              ) : null,
            }}
          />
          <TextField
            label="Porcentaje (%)"
            type="number"
            fullWidth
            variant="outlined"
            value={porcentajeEditado}
            onChange={(e) => setPorcentajeEditado(e.target.value)}
            onBlur={() => validarPorcentaje(porcentajeEditado, false)}
            error={!!errores.porcentajeEditado}
            helperText={errores.porcentajeEditado || 'Valor entre 0 y 100'}
            inputProps={{ step: '0.01', min: '0', max: '100' }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TrendingUpIcon sx={{ color: '#ff9800' }} />
                </InputAdornment>
              ),
              endAdornment: porcentajeEditado && !errores.porcentajeEditado ? (
                <InputAdornment position="end">
                  <CheckCircleIcon sx={{ color: '#4caf50' }} />
                </InputAdornment>
              ) : null,
            }}
          />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalEditar(false)} sx={{ textTransform: 'none', borderRadius: '8px' }}>
            Cancelar
          </Button>
          <Button
            onClick={guardarCambios}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
            }}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Confirmar Eliminación
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta acción no se puede deshacer
          </Alert>
          <Typography>
            ¿Está seguro de que desea eliminar el impuesto <strong>{impuestoParaEliminar?.nombre}</strong>?
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalEliminar(false)} sx={{ textTransform: 'none', borderRadius: '8px' }}>
            Cancelar
          </Button>
          <Button
            onClick={eliminarImpuesto}
            color="error"
            variant="contained"
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            Eliminar Impuesto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={tipoMensaje}
          sx={{
            width: '100%',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          icon={tipoMensaje === 'success' ? <TaskAltIcon /> : undefined}
        >
          {mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
}
