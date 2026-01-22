import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  InputAdornment,
  Divider,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BadgeIcon from '@mui/icons-material/Badge';
import StoreIcon from '@mui/icons-material/Store';

import axiosClient from '../../api/axiosClient';

export default function ProveedoresScreen() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [proveedorParaEliminar, setProveedorParaEliminar] = useState(null);

  // Campos formulario
  const [nombre, setNombre] = useState('');
  const [rucCi, setRucCi] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  // Mensajes
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('success');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  // Búsqueda
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    listarProveedores();
  }, []);

  const listarProveedores = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axiosClient.get('/proveedores', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProveedores(response.data);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      mostrarMensaje('Error al cargar proveedores', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    setOpenSnackbar(true);
  };

  const abrirCrear = () => {
    setNombre('');
    setRucCi('');
    setDireccion('');
    setTelefono('');
    setEmail('');
    setModalCrear(true);
  };

  const crearProveedor = async () => {
    if (!nombre.trim()) {
      mostrarMensaje('El nombre es obligatorio', 'error');
      return;
    }
    
    // Validación de RUC/CI (10 o 13 dígitos)
    if (rucCi.trim() && !/^\d{10}$|^\d{13}$/.test(rucCi.trim())) {
      mostrarMensaje('El RUC/Cédula debe tener 10 o 13 dígitos', 'error');
      return;
    }
    
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      mostrarMensaje('El email no es válido', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        nombre: nombre.trim(),
        ruc_ci: rucCi.trim(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
      };

      const res = await axiosClient.post('/proveedores', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProveedores([...proveedores, res.data]);
      mostrarMensaje('Proveedor creado correctamente', 'success');
      setModalCrear(false);
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      if (error.response?.data?.errors) {
        const mensajes = Object.values(error.response.data.errors).flat().join(', ');
        mostrarMensaje(mensajes, 'error');
      } else if (error.response?.data?.message) {
        mostrarMensaje(error.response.data.message, 'error');
      } else {
        mostrarMensaje('Error al crear el proveedor', 'error');
      }
    }
  };

  const abrirEditar = (proveedor) => {
    setProveedorSeleccionado(proveedor);
    setNombre(proveedor.nombre || '');
    setRucCi(proveedor.ruc_ci || '');
    setDireccion(proveedor.direccion || '');
    setTelefono(proveedor.telefono || '');
    setEmail(proveedor.email || '');
    setModalEditar(true);
  };

  const guardarCambios = async () => {
    if (!nombre.trim()) {
      mostrarMensaje('El nombre es obligatorio', 'error');
      return;
    }
    
    // Validación de RUC/CI (10 o 13 dígitos)
    if (rucCi.trim() && !/^\d{10}$|^\d{13}$/.test(rucCi.trim())) {
      mostrarMensaje('El RUC/Cédula debe tener 10 o 13 dígitos', 'error');
      return;
    }
    
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      mostrarMensaje('El email no es válido', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        nombre: nombre.trim(),
        ruc_ci: rucCi.trim(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
      };

      const res = await axiosClient.put(
        `/proveedores/${proveedorSeleccionado.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProveedores(
        proveedores.map((p) => (p.id === proveedorSeleccionado.id ? res.data : p))
      );
      mostrarMensaje('Proveedor actualizado correctamente', 'success');
      setModalEditar(false);
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      mostrarMensaje('Error al actualizar el proveedor', 'error');
    }
  };

  const confirmarEliminar = (proveedor) => {
    setProveedorParaEliminar(proveedor);
    setModalEliminar(true);
  };

  const eliminarProveedor = async () => {
    try {
      const token = localStorage.getItem('token');
      await axiosClient.delete(`/proveedores/${proveedorParaEliminar.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProveedores(proveedores.filter((p) => p.id !== proveedorParaEliminar.id));
      mostrarMensaje('Proveedor eliminado correctamente', 'success');
      setModalEliminar(false);
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      mostrarMensaje('Error al eliminar el proveedor', 'error');
    }
  };
  
  // Filtrar proveedores según búsqueda
  const proveedoresFiltrados = proveedores.filter((proveedor) => {
    const busquedaLower = busqueda.toLowerCase();
    return (
      (proveedor.nombre || '').toLowerCase().includes(busquedaLower) ||
      (proveedor.ruc_ci || '').toLowerCase().includes(busquedaLower) ||
      (proveedor.email || '').toLowerCase().includes(busquedaLower) ||
      (proveedor.telefono || '').toLowerCase().includes(busquedaLower)
    );
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
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
          background: 'linear-gradient(135deg, #ff9800 0%, #bd7200 100%)',
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
              <StoreIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Gestión de Proveedores
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Administra tu red de proveedores
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={`${proveedores.length} ${proveedores.length === 1 ? 'Proveedor' : 'Proveedores'}`}
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

      {/* Barra de búsqueda y botón agregar */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={3}
        gap={2}
        flexWrap="wrap"
      >
        <TextField
          placeholder="Buscar por nombre, RUC, email o teléfono..."
          variant="outlined"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          sx={{ 
            flexGrow: 1,
            minWidth: '280px',
            bgcolor: 'white',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={abrirCrear}
          sx={{
            bgcolor: '#ff9800',
            py: 1.5,
            px: 3,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(232, 152, 3, 0.3)',
            '&:hover': {
              bgcolor: '#e48d0a',
              boxShadow: '0 6px 16px rgba(229, 156, 30, 0.4)',
            }
          }}
        >
          Nuevo Proveedor
        </Button>
      </Box>

      {/* Grid de Cards de Proveedores */}
      {proveedoresFiltrados.length > 0 ? (
        <Grid container spacing={3}>
          {proveedoresFiltrados.map((proveedor) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={proveedor.id}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                    borderColor: '#ff9800',
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header de la card */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Avatar 
                      sx={{ 
                        bgcolor: alpha('#ff9800', 0.1),
                        width: 48, 
                        height: 48 
                      }}
                    >
                      <BusinessIcon sx={{ color: '#ff9800', fontSize: 24 }} />
                    </Avatar>
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => abrirEditar(proveedor)}
                          sx={{
                            bgcolor: alpha('#ff9800', 0.1),
                            '&:hover': {
                              bgcolor: alpha('#ff9800', 0.2),
                            }
                          }}
                        >
                          <EditIcon sx={{ fontSize: 18, color: '#ff9800' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => confirmarEliminar(proveedor)}
                          sx={{
                            bgcolor: alpha('#f44336', 0.1),
                            '&:hover': {
                              bgcolor: alpha('#f44336', 0.2),
                            }
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 18, color: '#f44336' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Nombre del proveedor */}
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    gutterBottom
                    sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '3.6em'
                    }}
                  >
                    {proveedor.nombre || 'Sin nombre'}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Información de contacto */}
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    {proveedor.ruc_ci && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <BadgeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {proveedor.ruc_ci}
                        </Typography>
                      </Box>
                    )}
                    
                    {proveedor.telefono && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {proveedor.telefono}
                        </Typography>
                      </Box>
                    )}
                    
                    {proveedor.email && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {proveedor.email}
                        </Typography>
                      </Box>
                    )}
                    
                    {proveedor.direccion && (
                      <Box display="flex" alignItems="flex-start" gap={1}>
                        <LocationOnIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.2 }} />
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {proveedor.direccion}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'white',
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
            <BusinessIcon sx={{ fontSize: 40, color: '#999' }} />
          </Avatar>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {busqueda ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {busqueda 
              ? 'Intenta con otros términos de búsqueda'
              : 'Comienza agregando tu primer proveedor'
            }
          </Typography>
          {!busqueda && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={abrirCrear}
              sx={{ borderRadius: 2 }}
            >
              Agregar Proveedor
            </Button>
          )}
        </Paper>
      )}

      {/* Modal Crear */}
      <Dialog 
        open={modalCrear} 
        onClose={() => setModalCrear(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: alpha('#ff9800', 0.1) }}>
              <AddIcon sx={{ color: '#ff9800' }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Crear Proveedor
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completa la información del nuevo proveedor
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            type="text"
            fullWidth
            variant="outlined"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BusinessIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="dense"
            label="RUC / Cédula"
            type="text"
            fullWidth
            variant="outlined"
            value={rucCi}
            onChange={(e) => setRucCi(e.target.value)}
            sx={{ mb: 2 }}
            helperText="10 o 13 dígitos"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BadgeIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="dense"
            label="Teléfono"
            type="tel"
            fullWidth
            variant="outlined"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="dense"
            label="Dirección"
            type="text"
            fullWidth
            variant="outlined"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            multiline
            rows={2}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                  <LocationOnIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 2 }}>
          <Button 
            onClick={() => setModalCrear(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={crearProveedor} 
            variant="contained" 
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
            Crear Proveedor
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
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: alpha('#ff9800', 0.1) }}>
              <EditIcon sx={{ color: '#ff9800' }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Editar Proveedor
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Actualiza la información del proveedor
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            type="text"
            fullWidth
            variant="outlined"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BusinessIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="dense"
            label="RUC / Cédula"
            type="text"
            fullWidth
            variant="outlined"
            value={rucCi}
            onChange={(e) => setRucCi(e.target.value)}
            sx={{ mb: 2 }}
            helperText="10 o 13 dígitos"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BadgeIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="dense"
            label="Teléfono"
            type="tel"
            fullWidth
            variant="outlined"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="dense"
            label="Dirección"
            type="text"
            fullWidth
            variant="outlined"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            multiline
            rows={2}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                  <LocationOnIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 2 }}>
          <Button 
            onClick={() => setModalEditar(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={guardarCambios} 
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
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: alpha('#f44336', 0.1) }}>
              <DeleteIcon sx={{ color: '#f44336' }} />
            </Avatar>
            <Typography variant="h6" fontWeight="bold">
              Confirmar Eliminación
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Typography>
            ¿Estás seguro de que deseas eliminar al proveedor{' '}
            <strong>"{proveedorParaEliminar?.nombre}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 2 }}>
          <Button 
            onClick={() => setModalEliminar(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={eliminarProveedor} 
            variant="contained" 
            color="error"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
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
