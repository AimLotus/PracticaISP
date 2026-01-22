import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Divider,
  Avatar,
  InputAdornment,
  TablePagination,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import axios from 'axios';
import config from '../../config';

const baseURL = config.API_BASE_URL;

const rolesDisponibles = [
  { id: 1, nombre: 'Administrador', color: '#9c27b0', bgColor: '#f3e5f5' },
  { id: 2, nombre: 'Ventas', color: '#4caf50', bgColor: '#e8f5e9' },
  { id: 3, nombre: 'Dueño de Negocio', color: '#ff9800', bgColor: '#fff3e0' },
  { id: 4, nombre: 'Inventario', color: '#2196f3', bgColor: '#e3f2fd' },
];

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioEditado, setUsuarioEditado] = useState(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [emailEditado, setEmailEditado] = useState('');
  const [passwordEditado, setPasswordEditado] = useState('');
  const [rolEditado, setRolEditado] = useState('');

  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [usuarioParaEliminar, setUsuarioParaEliminar] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('success');
  const [mensajeVisible, setMensajeVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const mostrarMensaje = (msg, tipo = 'success') => {
    setMensaje(msg);
    setTipoMensaje(tipo);
    setMensajeVisible(true);
  };

  const getToken = () => localStorage.getItem('token');

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.get(`${baseURL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuarios(response.data);
    } catch (error) {
      mostrarMensaje('No se pudieron cargar los usuarios.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarUsuarios();
    setRefreshing(false);
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const matchSearch = usuario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRol = filterRol === '' || usuario.rol_id === parseInt(filterRol);
    const matchEstado = filterEstado === '' || 
                       (filterEstado === 'activo' && usuario.activo) ||
                       (filterEstado === 'inactivo' && !usuario.activo);
    
    return matchSearch && matchRol && matchEstado;
  });

  const usuariosDisplayed = usuariosFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Estadísticas
  const stats = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo).length,
    inactivos: usuarios.filter(u => !u.activo).length,
    porRol: {
      admin: usuarios.filter(u => u.rol_id === 1).length,
      ventas: usuarios.filter(u => u.rol_id === 2).length,
      dueno: usuarios.filter(u => u.rol_id === 3).length,
      inventario: usuarios.filter(u => u.rol_id === 4).length,
    },
  };

  // Obtener color de rol
  const getRoleColor = (rolId) => {
    return rolesDisponibles.find(r => r.id === rolId) || rolesDisponibles[0];
  };

  // Obtener nombre de rol
  const getRoleName = (rolId) => {
    return rolesDisponibles.find(r => r.id === rolId)?.nombre || 'N/A';
  };

  // Abrir modal editar usuario
  const abrirEditar = (usuario) => {
    setUsuarioEditado(usuario);
    setNombreEditado(usuario.name);
    setEmailEditado(usuario.email);
    setPasswordEditado('');
    setRolEditado(usuario.rol_id || '');
    setModalVisible(true);
  };

  // Guardar cambios usuario editado
  const guardarCambios = async () => {
    if (!nombreEditado.trim() || !emailEditado.trim() || !rolEditado) {
      mostrarMensaje('Por favor complete todos los campos.', 'error');
      return;
    }

    try {
      const token = getToken();
      const payload = {
        name: nombreEditado.trim(),
        email: emailEditado.trim(),
        rol_id: rolEditado,
      };
      if (passwordEditado.trim() !== '') {
        payload.password = passwordEditado.trim();
      }

      const response = await axios.put(
        `${baseURL}/users/${usuarioEditado.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuarioEditado.id ? response.data : u))
      );
      setModalVisible(false);
      mostrarMensaje('Usuario actualizado correctamente.', 'success');
    } catch (error) {
      mostrarMensaje('No se pudo actualizar el usuario.', 'error');
    }
  };

  // Confirmar eliminación usuario
  const confirmarEliminar = (usuario) => {
    setUsuarioParaEliminar(usuario);
    setConfirmDeleteVisible(true);
  };

  // Eliminar usuario
  const eliminarUsuario = async () => {
    try {
      const token = getToken();
      await axios.delete(`${baseURL}/users/${usuarioParaEliminar.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuarios((prev) =>
        prev.filter((u) => u.id !== usuarioParaEliminar.id)
      );
      setConfirmDeleteVisible(false);
      mostrarMensaje('Usuario eliminado correctamente.', 'success');
    } catch (error) {
      mostrarMensaje('No se pudo eliminar el usuario.', 'error');
    }
  };

  // Cambiar estado usuario (activar/desactivar)
  const cambiarEstadoUsuario = async (usuario) => {
    try {
      const token = getToken();
      await axios.patch(
        `${baseURL}/users/${usuario.id}/toggle-activo`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuario.id ? { ...u, activo: !u.activo } : u
        )
      );
      mostrarMensaje(`Usuario ${usuario.activo ? 'desactivado' : 'activado'} correctamente.`, 'success');
    } catch (error) {
      mostrarMensaje('No se pudo cambiar el estado del usuario.', 'error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} gap={2} sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Gestión de Usuarios
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
            Administra y controla todos los usuarios del sistema
          </Typography>
        </Box>
        <Tooltip title="Actualizar lista">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </Tooltip>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ borderRadius: '12px', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #1976d2, #21CBF3)' } }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                Total Usuarios
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
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
          <Card sx={{ borderRadius: '12px', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #9c27b0, #ba68c8)' } }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                Administradores
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#9c27b0' }}>
                {stats.porRol.admin}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros y Búsqueda */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: '12px', backgroundColor: '#f8f9fa' }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#999' }} />
                  </InputAdornment>
                ),
              }}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: 'white',
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtrar por Rol</InputLabel>
              <Select
                value={filterRol}
                onChange={(e) => {
                  setFilterRol(e.target.value);
                  setPage(0);
                }}
                label="Filtrar por Rol"
                sx={{ borderRadius: '8px', backgroundColor: 'white' }}
              >
                <MenuItem value="">Todos los roles</MenuItem>
                {rolesDisponibles.map((rol) => (
                  <MenuItem key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtrar por Estado</InputLabel>
              <Select
                value={filterEstado}
                onChange={(e) => {
                  setFilterEstado(e.target.value);
                  setPage(0);
                }}
                label="Filtrar por Estado"
                sx={{ borderRadius: '8px', backgroundColor: 'white' }}
              >
                <MenuItem value="">Todos los estados</MenuItem>
                <MenuItem value="activo">Activos</MenuItem>
                <MenuItem value="inactivo">Inactivos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }} display="flex" alignItems="flex-end">
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setFilterRol('');
                setFilterEstado('');
                setPage(0);
              }}
              sx={{ borderRadius: '8px', textTransform: 'none' }}
            >
              Limpiar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de Usuarios */}
      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
              <TableCell sx={{ fontWeight: '700', color: '#333', py: 2 }}>Usuario</TableCell>
              <TableCell sx={{ fontWeight: '700', color: '#333', py: 2 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: '700', color: '#333', py: 2 }}>Rol</TableCell>
              <TableCell sx={{ fontWeight: '700', color: '#333', py: 2 }}>Estado</TableCell>
              <TableCell align="center" sx={{ fontWeight: '700', color: '#333', py: 2 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuariosDisplayed.length > 0 ? (
              usuariosDisplayed.map((usuario) => {
                const roleInfo = getRoleColor(usuario.rol_id);
                return (
                  <TableRow
                    key={usuario.id}
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
                            bgcolor: roleInfo.color,
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        >
                          {usuario.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography fontWeight="600">{usuario.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2, color: '#666' }}>
                      <Typography variant="body2">{usuario.email}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Chip
                        label={getRoleName(usuario.rol_id)}
                        size="small"
                        sx={{
                          bgcolor: roleInfo.bgColor,
                          color: roleInfo.color,
                          fontWeight: '600',
                          border: `1px solid ${roleInfo.color}20`,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Chip
                        label={usuario.activo ? 'Activo' : 'Inactivo'}
                        size="small"
                        icon={usuario.activo ? undefined : undefined}
                        sx={{
                          bgcolor: usuario.activo ? '#e8f5e9' : '#ffebee',
                          color: usuario.activo ? '#2e7d32' : '#c62828',
                          fontWeight: '600',
                          border: `1px solid ${usuario.activo ? '#4caf50' : '#f44336'}20`,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        <Tooltip title="Editar usuario">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => abrirEditar(usuario)}
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
                        <Tooltip title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}>
                          <IconButton
                            size="small"
                            color={usuario.activo ? 'success' : 'warning'}
                            onClick={() => cambiarEstadoUsuario(usuario)}
                            sx={{
                              '&:hover': {
                                backgroundColor: usuario.activo ? 'rgba(76, 175, 80, 0.08)' : 'rgba(255, 152, 0, 0.08)',
                                borderRadius: '8px',
                              },
                            }}
                          >
                            {usuario.activo ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar usuario">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => confirmarEliminar(usuario)}
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
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No se encontraron usuarios con los filtros aplicados
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={usuariosFiltrados.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Usuarios por página:"
          sx={{
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#f8f9fa',
            '& .MuiTablePagination-root': {
              color: '#666',
            },
          }}
        />
      </TableContainer>

      {/* Modal Editar Usuario */}
      <Dialog
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
          Editar Usuario
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: '#667eea',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              {nombreEditado.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Modificando datos de
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {nombreEditado || 'Usuario'}
              </Typography>
            </Box>
          </Box>
          <TextField
            fullWidth
            label="Nombre"
            value={nombreEditado}
            onChange={(e) => setNombreEditado(e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={emailEditado}
            onChange={(e) => setEmailEditado(e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />
          <TextField
            fullWidth
            label="Nueva Contraseña (opcional)"
            type="password"
            value={passwordEditado}
            onChange={(e) => setPasswordEditado(e.target.value)}
            margin="normal"
            variant="outlined"
            helperText="Dejar vacío para mantener la contraseña actual"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Rol</InputLabel>
            <Select
              value={rolEditado}
              onChange={(e) => setRolEditado(e.target.value)}
              label="Rol"
              sx={{
                borderRadius: '8px',
              }}
            >
              {rolesDisponibles.map((rol) => (
                <MenuItem key={rol.id} value={rol.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: rol.color,
                      }}
                    />
                    {rol.nombre}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setModalVisible(false)}
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={guardarCambios}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
            }}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmación Eliminar */}
      <Dialog
        open={confirmDeleteVisible}
        onClose={() => setConfirmDeleteVisible(false)}
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
            ¿Está seguro de que desea eliminar al usuario <strong>{usuarioParaEliminar?.name}</strong>?
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDeleteVisible(false)} sx={{ textTransform: 'none', borderRadius: '8px' }}>
            Cancelar
          </Button>
          <Button
            onClick={eliminarUsuario}
            color="error"
            variant="contained"
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            Eliminar Usuario
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={mensajeVisible}
        autoHideDuration={3000}
        onClose={() => setMensajeVisible(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setMensajeVisible(false)}
          severity={tipoMensaje}
          sx={{
            width: '100%',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
}
