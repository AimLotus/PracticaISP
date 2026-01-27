import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  Snackbar,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Icon from '../components/Icon';
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from '../utils/validations';
import { loginUsuario } from '../api/authService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('success');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    setVisible(true);
  };

  const validateEmailField = (value) => {
    if (!value) {
      setEmailError('El correo es requerido');
    } else if (!validateEmail(value)) {
      setEmailError('Correo electrónico no válido');
    } else {
      setEmailError('');
    }
  };

  const validatePasswordField = (value) => {
    if (!value) {
      setPasswordError('La contraseña es requerida');
    } else if (!validatePassword(value)) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
    } else {
      setPasswordError('');
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    validateEmailField(value);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    validatePasswordField(value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    validateEmailField(email);
    validatePasswordField(password);

    if (!email || !password || emailError || passwordError) {
      mostrarMensaje('Por favor, completa correctamente todos los campos', 'error');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      mostrarMensaje('¡Sesión iniciada correctamente!', 'success');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (error) {
      mostrarMensaje(
        error.response?.data?.message || error.message || 'Error al iniciar sesión',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Logo y Branding */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography
              variant="h5"
              sx={{
                color: 'white',
                fontWeight: 700,
                mb: 0.5,
              }}
            >
              MiApp
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              Gestión de Finanzas y Administración
            </Typography>
          </Box>

          {/* Formulario */}
          <Paper
            elevation={8}
            sx={{
              padding: { xs: 3, sm: 4 },
              borderRadius: 2,
              backgroundColor: '#fff',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography
              variant="h5"
              component="h1"
              sx={{
                color: '#1a1a1a',
                fontWeight: 700,
                mb: 1,
                textAlign: 'center',
              }}
            >
              Iniciar Sesión
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#666',
                textAlign: 'center',
                mb: 3,
              }}
            >
              Ingresa tus credenciales para acceder
            </Typography>

            <Box component="form" onSubmit={handleLogin}>
              {/* Email Field */}
              <Box sx={{ mb: 2.5 }}>
                <TextField
                  label="Correo electrónico"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => validateEmailField(email)}
                  fullWidth
                  type="email"
                  autoComplete="email"
                  disabled={loading}
                  error={!!emailError}
                  helperText={emailError}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon name="email" sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#f8f9fa',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#f0f4ff',
                      },
                    },
                  }}
                />
              </Box>

              {/* Password Field */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  label="Contraseña"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => validatePasswordField(password)}
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={loading}
                  error={!!passwordError}
                  helperText={passwordError}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon name="lock" sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          disabled={loading}
                          tabIndex={0}
                        >
                          <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#f8f9fa',
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#f0f4ff',
                      },
                    },
                  }}
                />
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || emailError !== '' || passwordError !== ''}
                startIcon={<Icon name="login" />}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  padding: '12px 24px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                    transform: 'translateY(-2px)',
                  },
                  '&:disabled': {
                    background: '#ccc',
                    color: '#999',
                    boxShadow: 'none',
                    transform: 'none',
                  },
                }}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Button>
            </Box>
          </Paper>

          {/* Footer Info */}
          <Typography
            variant="caption"
            align="center"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              display: 'block',
            }}
          >
            © 2024 MiApp. Todos los derechos reservados. | Seguridad garantizada
          </Typography>
        </Box>
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={visible}
        autoHideDuration={tipoMensaje === 'success' ? 2000 : 4000}
        onClose={() => setVisible(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transition
      >
        <Alert
          onClose={() => setVisible(false)}
          severity={tipoMensaje}
          sx={{
            width: '100%',
            borderRadius: 1.5,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
          variant="filled"
        >
          {mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
}
