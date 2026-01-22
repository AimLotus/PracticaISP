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
  Card,
  CardContent,
  Avatar,
  Divider,
  Grid,
  InputAdornment,
  Chip,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BadgeIcon from '@mui/icons-material/Badge';
import WarningIcon from '@mui/icons-material/Warning';

import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';

export default function ClientesScreen() {
  const { user } = useAuth();
  
  // Configuración de colores basada en el rol del usuario (rol_id: 3 = dueño)
  const themeColor = user?.rol_id === 3 ? '#ff9800' : '#4caf50';
  const themeColorLight = user?.rol_id === 3 ? '#ffb74d' : '#66bb6a';
  const themeColorAlpha = user?.rol_id === 3 ? 'rgba(255, 152, 0, 0.4)' : 'rgba(76, 175, 80, 0.4)';

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteParaEliminar, setClienteParaEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState('');

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

  useEffect(() => {
    listarClientes();
  }, []);

  const listarClientes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axiosClient.get('/clientes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClientes(response.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      mostrarMensaje('Error al cargar clientes', 'error');
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

  const crearCliente = async () => {
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

      const res = await axiosClient.post('/clientes', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setClientes([...clientes, res.data]);
      mostrarMensaje('Cliente creado correctamente', 'success');
      setModalCrear(false);
    } catch (error) {
      console.error('Error al crear cliente:', error);
      if (error.response?.data?.errors) {
        const mensajes = Object.values(error.response.data.errors).flat().join(', ');
        mostrarMensaje(mensajes, 'error');
      } else if (error.response?.data?.message) {
        mostrarMensaje(error.response.data.message, 'error');
      } else {
        mostrarMensaje('Error al crear el cliente', 'error');
      }
    }
  };

  const abrirEditar = (cliente) => {
    setClienteSeleccionado(cliente);
    setNombre(cliente.nombre || '');
    setRucCi(cliente.ruc_ci || '');
    setDireccion(cliente.direccion || '');
    setTelefono(cliente.telefono || '');
    setEmail(cliente.email || '');
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
        `/clientes/${clienteSeleccionado.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setClientes(
        clientes.map((c) => (c.id === clienteSeleccionado.id ? res.data : c))
      );
      mostrarMensaje('Cliente actualizado correctamente', 'success');
      setModalEditar(false);
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      if (error.response?.data?.errors) {
        const mensajes = Object.values(error.response.data.errors).flat().join(', ');
        mostrarMensaje(mensajes, 'error');
      } else if (error.response?.data?.message) {
        mostrarMensaje(error.response.data.message, 'error');
      } else {
        mostrarMensaje('Error al actualizar el cliente', 'error');
      }
    }
  };

  const confirmarEliminar = (cliente) => {
    setClienteParaEliminar(cliente);
    setModalEliminar(true);
  };

  const eliminarCliente = async () => {
    try {
      const token = localStorage.getItem('token');
      await axiosClient.delete(`/clientes/${clienteParaEliminar.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClientes(clientes.filter((c) => c.id !== clienteParaEliminar.id));
      mostrarMensaje('Cliente eliminado correctamente', 'success');
      setModalEliminar(false);
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      mostrarMensaje('Error al eliminar el cliente', 'error');
    }
  };

  const clientesFiltrados = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (cliente.email && cliente.email.toLowerCase().includes(busqueda.toLowerCase())) ||
      (cliente.ruc_ci && cliente.ruc_ci.includes(busqueda))
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
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
              <PeopleIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Gestión de Clientes
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Administra todos tus clientes de una manera eficiente
              </Typography>
            </Box>
          </Box>
          <Chip
            label={`${clientes.length} Cliente${clientes.length !== 1 ? 's' : ''}`}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.9rem',
            }}
          />
        </Box>
      </Paper>

      {/* Tarjeta de Estadísticas y Búsqueda */}
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
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Avatar
                  sx={{
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    width: 48,
                    height: 48,
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Total de Clientes
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#333' }}>
                    {clientes.length}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, email o RUC..."
                variant="outlined"
                size="small"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: '#999' }} />,
                  endAdornment: busqueda && (
                    <IconButton
                      size="small"
                      onClick={() => setBusqueda('')}
                      sx={{ cursor: 'pointer' }}
                    >
                      <ClearIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Grid>
          </Grid>

          {busqueda && (
            <Box sx={{ mt: 2 }}>
              <Chip
                icon={<SearchIcon />}
                label={`${clientesFiltrados.length} resultado${clientesFiltrados.length !== 1 ? 's' : ''}`}
                color="primary"
                variant="outlined"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Tabla de Clientes */}
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
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar
                sx={{
                  bgcolor: (theme) => alpha('#f5576c', 0.1),
                  color: '#f5576c',
                }}
              >
                <PeopleIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Lista de Clientes
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {clientesFiltrados.length} de {clientes.length} clientes
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`${clientesFiltrados.length}`}
              sx={{ fontSize: '0.9rem', bgcolor: alpha(themeColor, 0.1), color: themeColor, fontWeight: 'bold' }}
              variant="outlined"
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          {clientesFiltrados.length === 0 ? (
            <Box
              sx={{
                py: 4,
                textAlign: 'center',
                bgcolor: '#f9f9f9',
                borderRadius: '8px',
                border: '2px dashed #ddd',
              }}
            >
              <PeopleIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
              <Typography color="textSecondary" mb={1}>
                {busqueda ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </Typography>
              {busqueda && (
                <Typography variant="caption" color="textSecondary">
                  Intenta con otro término de búsqueda
                </Typography>
              )}
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>
                      Nombre
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>
                      RUC/Cédula
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>
                      Dirección
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>
                      Teléfono
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>
                      Email
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#333' }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientesFiltrados.map((cliente) => (
                    <TableRow
                      key={cliente.id}
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
                            {cliente.nombre.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ color: '#333', fontWeight: '600' }}>
                            {cliente.nombre || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <BadgeIcon sx={{ fontSize: 16, color: '#999' }} />
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            {cliente.ruc_ci || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <LocationOnIcon sx={{ fontSize: 16, color: '#999' }} />
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            {cliente.direccion || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <PhoneIcon sx={{ fontSize: 16, color: '#999' }} />
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            {cliente.telefono || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <EmailIcon sx={{ fontSize: 16, color: '#999' }} />
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            {cliente.email || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          <Tooltip title="Editar cliente">
                            <IconButton
                              color="primary"
                              onClick={() => abrirEditar(cliente)}
                              size="small"
                              sx={{
                                '&:hover': { bgcolor: '#e3f2fd' },
                              }}
                            >
                              <EditIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar cliente">
                            <IconButton
                              color="error"
                              onClick={() => confirmarEliminar(cliente)}
                              size="small"
                              sx={{
                                '&:hover': { bgcolor: '#ffebee' },
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Botón flotante crear */}
      <Tooltip title="Agregar nuevo cliente">
        <Fab
          color="primary"
          aria-label="add"
          onClick={abrirCrear}
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
          <PersonAddIcon />
        </Fab>
      </Tooltip>

      {/* Modal Crear Cliente */}
      <Dialog
        open={modalCrear}
        onClose={() => setModalCrear(false)}
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
          <PersonAddIcon sx={{ fontSize: 32 }} />
          <Box>
            <DialogTitle sx={{ p: 0, color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>
              Crear Nuevo Cliente
            </DialogTitle>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Completa el formulario para agregar un cliente
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Nombre"
            type="text"
            variant="outlined"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            size="small"
            InputProps={{
              startAdornment: <PeopleIcon sx={{ mr: 1, color: '#999' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />

          <TextField
            fullWidth
            margin="dense"
            label="RUC / Cédula"
            type="text"
            variant="outlined"
            value={rucCi}
            onChange={(e) => setRucCi(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <BadgeIcon sx={{ mr: 1, color: '#999' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />

          <TextField
            fullWidth
            margin="dense"
            label="Dirección"
            type="text"
            variant="outlined"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <LocationOnIcon sx={{ mr: 1, color: '#999' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />

          <TextField
            fullWidth
            margin="dense"
            label="Teléfono"
            type="tel"
            variant="outlined"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <PhoneIcon sx={{ mr: 1, color: '#999' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />

          <TextField
            fullWidth
            margin="dense"
            label="Email"
            type="email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <EmailIcon sx={{ mr: 1, color: '#999' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setModalCrear(false)}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600',
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={crearCliente}
            variant="contained"
            sx={{
              background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorLight} 100%)`,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
            }}
            startIcon={<PersonAddIcon />}
          >
            Crear Cliente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Editar Cliente */}
      <Dialog
        open={modalEditar}
        onClose={() => setModalEditar(false)}
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
          <EditIcon sx={{ fontSize: 32 }} />
          <Box>
            <DialogTitle sx={{ p: 0, color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>
              Editar Cliente
            </DialogTitle>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Actualiza la información del cliente
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Nombre"
            type="text"
            variant="outlined"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            size="small"
            startAdornment={<PeopleIcon sx={{ mr: 1, color: '#999' }} />}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />

          <TextField
            fullWidth
            margin="dense"
            label="RUC / Cédula"
            type="text"
            variant="outlined"
            value={rucCi}
            onChange={(e) => setRucCi(e.target.value)}
            size="small"
            startAdornment={<BadgeIcon sx={{ mr: 1, color: '#999' }} />}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />

          <TextField
            fullWidth
            margin="dense"
            label="Dirección"
            type="text"
            variant="outlined"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            size="small"
            startAdornment={<LocationOnIcon sx={{ mr: 1, color: '#999' }} />}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />

          <TextField
            fullWidth
            margin="dense"
            label="Teléfono"
            type="tel"
            variant="outlined"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            size="small"
            startAdornment={<PhoneIcon sx={{ mr: 1, color: '#999' }} />}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />

          <TextField
            fullWidth
            margin="dense"
            label="Email"
            type="email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="small"
            startAdornment={<EmailIcon sx={{ mr: 1, color: '#999' }} />}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setModalEditar(false)}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600',
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={guardarCambios}
            variant="contained"
            sx={{
              background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorLight} 100%)`,
              color: 'white',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
            }}
            startIcon={<EditIcon />}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Confirmar Eliminación */}
      <Dialog
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
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
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <WarningIcon sx={{ fontSize: 32 }} />
          <Box>
            <DialogTitle sx={{ p: 0, color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>
              Confirmar Eliminación
            </DialogTitle>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Esta acción no se puede deshacer
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            ¿Está seguro de que desea eliminar el cliente:
          </Typography>
          <Card sx={{ bgcolor: '#fce4ec', borderLeft: '4px solid #f5576c', mb: 2 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="body1" fontWeight="bold" sx={{ color: '#333' }}>
                {clienteParaEliminar?.nombre}
              </Typography>
              {clienteParaEliminar?.email && (
                <Typography variant="caption" color="textSecondary">
                  {clienteParaEliminar.email}
                </Typography>
              )}
            </CardContent>
          </Card>
          <Alert severity="warning" sx={{ borderRadius: '8px' }}>
            Esta acción eliminará permanentemente al cliente y no se podrá recuperar.
          </Alert>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setModalEliminar(false)}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600',
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={eliminarCliente}
            variant="contained"
            color="error"
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
            }}
            startIcon={<DeleteIcon />}
          >
            Sí, Eliminar
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
