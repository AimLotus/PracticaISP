import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  LinearProgress,
  Grid,
  Paper,
  Chip,
  Tooltip,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SecurityIcon from '@mui/icons-material/Security';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import axiosClient from '../../api/axiosClient';

const roles = [
  { label: 'Administrador', value: 'admin', color: '#9c27b0', bgColor: '#f3e5f5' },
  { label: 'Ventas', value: 'ventas', color: '#4caf50', bgColor: '#e8f5e9' },
  { label: 'Dueño de Negocio', value: 'dueno', color: '#ff9800', bgColor: '#fff3e0' },
  { label: 'Inventario', value: 'inventario', color: '#2196f3', bgColor: '#e3f2fd' },
];

export default function AdminRegister() {
  // Formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rol, setRol] = useState('');
  const [loading, setLoading] = useState(false);

  // Mostrar contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mensajes y errores
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('success');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Errores individuales
  const [errores, setErrores] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: '',
  });

  const mostrarMensaje = (msg, tipo = 'success') => {
    setMensaje(msg);
    setTipoMensaje(tipo);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Calcular fortaleza de contraseña
  const calcularFortaleza = (pass) => {
    let fortaleza = 0;
    if (!pass) return 0;
    if (pass.length >= 8) fortaleza += 20;
    if (pass.length >= 12) fortaleza += 10;
    if (/[a-z]/.test(pass)) fortaleza += 20;
    if (/[A-Z]/.test(pass)) fortaleza += 20;
    if (/\d/.test(pass)) fortaleza += 15;
    if (/[@$!%*?&]/.test(pass)) fortaleza += 15;
    return Math.min(fortaleza, 100);
  };

  const obtenerColorFortaleza = (fortaleza) => {
    if (fortaleza < 30) return '#f44336';
    if (fortaleza < 60) return '#ff9800';
    if (fortaleza < 80) return '#ffc107';
    return '#4caf50';
  };

  const obtenerTextoFortaleza = (fortaleza) => {
    if (fortaleza < 30) return 'Débil';
    if (fortaleza < 60) return 'Regular';
    if (fortaleza < 80) return 'Buena';
    return 'Fuerte';
  };

  // Validar email
  const validarEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  // Validaciones individuales
  const validarNombre = (value) => {
    const nuevosErrores = { ...errores };
    if (!value.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    } else if (value.trim().length < 3) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres';
    } else {
      nuevosErrores.nombre = '';
    }
    setErrores(nuevosErrores);
    setNombre(value);
  };

  const validarEmailInput = (value) => {
    const nuevosErrores = { ...errores };
    if (!value.trim()) {
      nuevosErrores.email = 'El email es obligatorio';
    } else if (!validarEmail(value)) {
      nuevosErrores.email = 'Introduce un email válido';
    } else {
      nuevosErrores.email = '';
    }
    setErrores(nuevosErrores);
    setEmail(value);
  };

  const validarPassword = (value) => {
    const nuevosErrores = { ...errores };
    if (!value) {
      nuevosErrores.password = 'La contraseña es obligatoria';
    } else if (value.length < 6) {
      nuevosErrores.password = 'Mínimo 6 caracteres';
    } else {
      nuevosErrores.password = '';
    }
    setErrores(nuevosErrores);
    setPassword(value);

    // Validar confirmación si existe
    if (confirmPassword && value !== confirmPassword) {
      setErrores(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
    } else {
      setErrores(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const validarConfirmPassword = (value) => {
    const nuevosErrores = { ...errores };
    if (!value) {
      nuevosErrores.confirmPassword = 'Debe confirmar la contraseña';
    } else if (value !== password) {
      nuevosErrores.confirmPassword = 'Las contraseñas no coinciden';
    } else {
      nuevosErrores.confirmPassword = '';
    }
    setErrores(nuevosErrores);
    setConfirmPassword(value);
  };

  const validarRol = (value) => {
    const nuevosErrores = { ...errores };
    if (!value) {
      nuevosErrores.rol = 'Selecciona un rol válido';
    } else {
      nuevosErrores.rol = '';
    }
    setErrores(nuevosErrores);
    setRol(value);
  };

  // Validación general antes de enviar
  const validarCampos = () => {
    let esValido = true;
    const nuevosErrores = { ...errores };

    if (!nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
      esValido = false;
    }

    if (!validarEmail(email)) {
      nuevosErrores.email = 'Introduce un email válido';
      esValido = false;
    }

    if (!password || password.length < 6) {
      nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
      esValido = false;
    }

    if (password !== confirmPassword) {
      nuevosErrores.confirmPassword = 'Las contraseñas no coinciden';
      esValido = false;
    }

    if (!rol) {
      nuevosErrores.rol = 'Selecciona un rol';
      esValido = false;
    }

    setErrores(nuevosErrores);
    return esValido;
  };

  const handleRegistro = async () => {
    if (!validarCampos()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const rolLabel = roles.find(r => r.value === rol)?.label;

      await axiosClient.post(
        '/users',
        {
          nombre,
          email,
          password,
          rol,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      mostrarMensaje(`✓ Usuario "${nombre}" creado exitosamente con rol: ${rolLabel}`, 'success');

      // Limpiar formulario
      setNombre('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRol('');
      setErrores({
        nombre: '',
        email: '',
        password: '',
        confirmPassword: '',
        rol: '',
      });
    } catch (error) {


      if (error.response?.data?.errors) {
        const mensajes = Object.values(error.response.data.errors).flat().join(', ');
        mostrarMensaje(mensajes, 'error');
      } else if (error.response?.data?.message) {
        mostrarMensaje(error.response.data.message, 'error');
      } else {
        mostrarMensaje('Error al registrar usuario', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fortalezaPassword = calcularFortaleza(password);
  const rolSeleccionado = roles.find(r => r.value === rol);

  // Campos completos y válidos
  const camposValidos = nombre && validarEmail(email) && password && password === confirmPassword && password.length >= 6 && rol;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 700, mx: 'auto' }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PersonAddIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#1a1a1a' }}>
              Registrar Nuevo Usuario
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
              Completa el formulario para agregar un nuevo usuario al sistema
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Formulario Principal */}
      <Card
        sx={{
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box component="form" noValidate>
            {/* Sección: Información Personal */}
            <Box mb={3}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#333' }}
              >
                <PersonIcon sx={{ color: '#667eea' }} />
                Información Personal
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Nombre */}
              <TextField
                label="Nombre completo"
                value={nombre}
                onChange={(e) => validarNombre(e.target.value)}
                onBlur={() => validarNombre(nombre)}
                fullWidth
                error={!!errores.nombre}
                helperText={errores.nombre}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: nombre && !errores.nombre ? (
                    <InputAdornment position="end">
                      <CheckCircleIcon sx={{ color: '#4caf50' }} />
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  mb: 3.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />

              {/* Email */}
              <TextField
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => validarEmailInput(e.target.value)}
                onBlur={() => validarEmailInput(email)}
                fullWidth
                autoComplete="email"
                error={!!errores.email}
                helperText={errores.email}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: email && !errores.email ? (
                    <InputAdornment position="end">
                      <CheckCircleIcon sx={{ color: '#4caf50' }} />
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  mb: 3.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Box>

            {/* Sección: Contraseña */}
            <Box mb={3}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#333' }}
              >
                <SecurityIcon sx={{ color: '#667eea' }} />
                Seguridad
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Contraseña */}
              <TextField
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => validarPassword(e.target.value)}
                onBlur={() => validarPassword(password)}
                fullWidth
                error={!!errores.password}
                helperText={errores.password}
                autoComplete="new-password"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        tabIndex={-1}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />

              {/* Indicador de Fortaleza */}
              {password && (
                <Box sx={{ mb: 3.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" sx={{ fontWeight: '600', color: '#666' }}>
                      Fortaleza de contraseña
                    </Typography>
                    <Chip
                      label={obtenerTextoFortaleza(fortalezaPassword)}
                      size="small"
                      sx={{
                        bgcolor: obtenerColorFortaleza(fortalezaPassword),
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={fortalezaPassword}
                    sx={{
                      height: 8,
                      borderRadius: '4px',
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: obtenerColorFortaleza(fortalezaPassword),
                      },
                    }}
                  />
                  <Box mt={1.5}>
                    <Typography variant="caption" sx={{ display: 'block', color: '#666', mb: 1 }}>
                      La contraseña debe contener:
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {password.length >= 6 ? (
                            <CheckCircleIcon sx={{ fontSize: '16px', color: '#4caf50' }} />
                          ) : (
                            <ErrorIcon sx={{ fontSize: '16px', color: '#f44336' }} />
                          )}
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            6+ caracteres
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {/[A-Z]/.test(password) ? (
                            <CheckCircleIcon sx={{ fontSize: '16px', color: '#4caf50' }} />
                          ) : (
                            <ErrorIcon sx={{ fontSize: '16px', color: '#f44336' }} />
                          )}
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            Mayúscula
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {/[a-z]/.test(password) ? (
                            <CheckCircleIcon sx={{ fontSize: '16px', color: '#4caf50' }} />
                          ) : (
                            <ErrorIcon sx={{ fontSize: '16px', color: '#f44336' }} />
                          )}
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            Minúscula
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {/\d/.test(password) ? (
                            <CheckCircleIcon sx={{ fontSize: '16px', color: '#4caf50' }} />
                          ) : (
                            <ErrorIcon sx={{ fontSize: '16px', color: '#f44336' }} />
                          )}
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            Número
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              )}

              {/* Confirmar Contraseña */}
              <TextField
                label="Confirmar contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => validarConfirmPassword(e.target.value)}
                onBlur={() => validarConfirmPassword(confirmPassword)}
                fullWidth

                error={!!errores.confirmPassword}
                helperText={errores.confirmPassword}
                autoComplete="new-password"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: confirmPassword && !errores.confirmPassword ? (
                    <InputAdornment position="end">
                      <CheckCircleIcon sx={{ color: '#4caf50' }} />
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  mb: 3.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Box>

            {/* Sección: Asignación de Rol */}
            <Box mb={3}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#333' }}
              >
                <TaskAltIcon sx={{ color: '#667eea' }} />
                Asignación de Rol
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControl fullWidth error={!!errores.rol} sx={{ mb: 2 }}>
                <InputLabel>Selecciona un rol</InputLabel>
                <Select
                  value={rol}
                  onChange={(e) => validarRol(e.target.value)}
                  label="Selecciona un rol"
                  sx={{
                    borderRadius: '8px',
                  }}
                >
                  <MenuItem value="">
                    <em>-- Selecciona un rol --</em>
                  </MenuItem>
                  {roles.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: r.color,
                          }}
                        />
                        {r.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {errores.rol && (
                <Typography variant="caption" sx={{ color: '#f44336', display: 'block', mt: 1 }}>
                  {errores.rol}
                </Typography>
              )}

              {/* Vista previa del rol seleccionado */}
              {rolSeleccionado && (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 3,
                    mb: 2,
                    p: 2,
                    bgcolor: rolSeleccionado.bgColor,
                    borderRadius: '8px',
                    borderLeft: `4px solid ${rolSeleccionado.color}`,
                  }}
                >
                  <Typography variant="body2" sx={{ color: rolSeleccionado.color, fontWeight: '600' }}>
                    ✓ Rol seleccionado: {rolSeleccionado.label}
                  </Typography>
                </Paper>
              )}
            </Box>

            {/* Botones */}
            <Divider sx={{ mb: 3 }} />
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleRegistro}
                disabled={loading || !camposValidos}
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <PersonAddIcon />
                  )
                }
                sx={{
                  background: !camposValidos
                    ? '#ccc'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  '&:hover:not(:disabled)': {
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                  },
                }}
              >
                {loading ? 'Registrando Usuario...' : 'Registrar Usuario'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={() => {
                  setNombre('');
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                  setRol('');
                  setErrores({
                    nombre: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    rol: '',
                  });
                }}
                disabled={loading}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                }}
              >
                Limpiar Formulario
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

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
