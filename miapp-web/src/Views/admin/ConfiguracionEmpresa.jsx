import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  PhotoCamera,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import Icon from '../../components/Icon';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';

export default function ConfiguracionEmpresa() {
  const { user } = useAuth();
  
  // Configuración de colores basada en el rol del usuario (rol_id: 3 = dueño)
  const themeColor = user?.rol_id === 3 ? '#ff9800' : '#667eea';
  const themeColorLight = user?.rol_id === 3 ? '#ffb74d' : '#764ba2';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configData, setConfigData] = useState({
    nombre_empresa: '',
    nombre_dueno: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
    logo_path: '',
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [errores, setErrores] = useState({});

  const cargarConfiguracion = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axiosClient.get('/empresa/config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = response.data.data || response.data;
      setConfigData({
        nombre_empresa: data.nombre_empresa || '',
        nombre_dueno: data.nombre_dueno || '',
        ruc: data.ruc || '',
        direccion: data.direccion || '',
        telefono: data.telefono || '',
        email: data.email || '',
        logo_path: data.logo_path || '',
      });
      
      if (data.logo_url) {
        setLogoPreview(data.logo_url);
      }
    } catch (error) {
      mostrarMensaje('Error al cargar la configuración', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  const handleChange = (field, value) => {
    setConfigData({ ...configData, [field]: value });
    validarCampo(field, value);
  };

  const validarCampo = (field, value) => {
    const nuevosErrores = { ...errores };

    switch (field) {
      case 'nombre_empresa':
        if (!value.trim()) {
          nuevosErrores.nombre_empresa = 'El nombre es obligatorio';
        } else if (value.trim().length < 3) {
          nuevosErrores.nombre_empresa = 'Mínimo 3 caracteres';
        } else {
          delete nuevosErrores.nombre_empresa;
        }
        break;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          nuevosErrores.email = 'Email inválido';
        } else {
          delete nuevosErrores.email;
        }
        break;
      
      case 'telefono':
        if (value && !/^\d{7,}$/.test(value.replace(/\D/g, ''))) {
          nuevosErrores.telefono = 'Mínimo 7 dígitos';
        } else {
          delete nuevosErrores.telefono;
        }
        break;
      
      default:
        break;
    }

    setErrores(nuevosErrores);
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    
    if (!configData.nombre_empresa.trim()) {
      nuevosErrores.nombre_empresa = 'El nombre es obligatorio';
    }
    if (configData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configData.email)) {
      nuevosErrores.email = 'Email inválido';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        mostrarMensaje('Solo JPG, PNG o GIF', 'error');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        mostrarMensaje('Archivo muy grande (máx 5MB)', 'error');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteLogo = async () => {
    try {
      const token = localStorage.getItem('token');
      await axiosClient.delete('/empresa/logo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogoPreview(null);
      setLogoFile(null);
      mostrarMensaje('✓ Logo eliminado', 'success');
    } catch (error) {
      mostrarMensaje('Error al eliminar el logo', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      mostrarMensaje('Corrija los errores en el formulario', 'error');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      await axiosClient.put('/empresa/config', configData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        await fetch('http://localhost:8000/api/empresa/logo', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      }

      mostrarMensaje('✓ Cambios guardados correctamente', 'success');
      setLogoFile(null);
      
      // Recargar la página para reflejar cambios globales (logo, nombre en header, etc.)
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      mostrarMensaje('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
  };

  const camposValidos = configData.nombre_empresa.trim() && !Object.keys(errores).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
    },
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 700, mx: 'auto' }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Box
            sx={{
              p: 1.5,
              background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorLight} 100%)`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BusinessIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Configuración de Empresa
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
              Administra la información de tu empresa
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tarjeta Principal */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e0e0e0',
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Sección Logo */}
          <Box sx={{ bgcolor: '#f8f9fa', p: 3, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={3} sx={{ color: '#333' }}>
              Logo de la Empresa
            </Typography>

            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <Avatar
                src={logoPreview}
                alt="Logo"
                sx={{
                  width: 120,
                  height: 120,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  bgcolor: '#e0e0e0',
                }}
              >
                {!logoPreview && <BusinessIcon sx={{ fontSize: 60, color: '#999' }} />}
              </Avatar>
              
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  component="label"
                  size="small"
                  startIcon={<PhotoCamera />}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColorLight} 100%)`,
                  }}
                >
                  Cambiar Logo
                  <input
                    type="file"
                    hidden
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleLogoChange}
                  />
                </Button>
                
                {logoPreview && (
                  <Tooltip title="Eliminar logo">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={handleDeleteLogo}
                      sx={{ border: '1px solid #f44336' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Typography variant="caption" sx={{ color: '#999' }}>
                JPG, PNG o GIF • Máximo 5MB
              </Typography>
            </Box>
          </Box>

          {/* Sección Formulario */}
          <Box sx={{ p: 3 }}>
            <Box display="flex" flexDirection="column" gap={3}>
              {/* Nombre de la Empresa */}
              <TextField
                fullWidth
                label="Nombre de la Empresa"
                value={configData.nombre_empresa}
                onChange={(e) => handleChange('nombre_empresa', e.target.value)}
                error={!!errores.nombre_empresa}
                helperText={errores.nombre_empresa}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon name="business" sx={{ color: themeColor }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              {/* Nombre del Dueño */}
              <TextField
                fullWidth
                label="Nombre del Dueño"
                value={configData.nombre_dueno}
                onChange={(e) => handleChange('nombre_dueno', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: themeColor }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              {/* RUC y Teléfono */}
              <Box display="flex" gap={2}>
                <TextField
                  flex={1}
                  sx={{ flex: 1, ...inputSx }}
                  label="RUC"
                  value={configData.ruc || ''}
                  onChange={(e) => handleChange('ruc', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon name="badge" sx={{ color: themeColor }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  flex={1}
                  sx={{ flex: 1, ...inputSx }}
                  label="Teléfono"
                  value={configData.telefono || ''}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  error={!!errores.telefono}
                  helperText={errores.telefono}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon name="phone" sx={{ color: themeColor }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Email */}
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={configData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                error={!!errores.email}
                helperText={errores.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon name="email" sx={{ color: themeColor }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              {/* Dirección */}
              <TextField
                fullWidth
                label="Dirección"
                multiline
                rows={3}
                value={configData.direccion || ''}
                onChange={(e) => handleChange('direccion', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon name="location_on" sx={{ color: themeColor }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              {/* Divider */}
              <Divider sx={{ my: 1 }} />

              {/* Botón Guardar */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={saving || !camposValidos}
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  background: !camposValidos
                    ? '#ccc'
                    : `linear-gradient(135deg, ${themeColor} 0%, ${themeColorLight} 100%)`,
                  fontSize: '1rem',
                  fontWeight: '600',
                }}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={!!mensaje.texto}
        autoHideDuration={4000}
        onClose={() => setMensaje({ texto: '', tipo: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={mensaje.tipo}
          onClose={() => setMensaje({ texto: '', tipo: '' })}
          sx={{ borderRadius: '8px' }}
        >
          {mensaje.texto}
        </Alert>
      </Snackbar>
    </Box>
  );
}
