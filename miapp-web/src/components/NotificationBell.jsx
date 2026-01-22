import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Typography,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InventoryIcon from '@mui/icons-material/Inventory';
import EmailIcon from '@mui/icons-material/Email';
import ErrorIcon from '@mui/icons-material/Error';
import axiosClient from '../api/axiosClient';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [resultData, setResultData] = useState({ success: false, message: '' });

  const open = Boolean(anchorEl);

  useEffect(() => {
    // Cargar notificaciones al montar
    loadNotifications();
    loadUnreadCount();

    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await axiosClient.get('/notifications/unread-count');
      const newCount = response.data.count;
      
      // Si hay cambios en el contador, recargar las notificaciones
      if (newCount !== unreadCount && open) {
        loadNotifications();
      }
      
      setUnreadCount(newCount);
    } catch (error) {
      console.error('Error al cargar conteo:', error);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    // SIEMPRE recargar las notificaciones al abrir el menú
    loadNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    setSelectedNotification(notification);
    
    // Si es pendiente, cargar proveedores disponibles
    if (notification.estado === 'pendiente') {
      await loadProvidersForProduct(notification.producto.id);
      // Seleccionar el proveedor por defecto si existe
      if (notification.proveedor) {
        setSelectedProviderId(notification.proveedor.id);
      }
    }
    
    setDialogOpen(true);
    
    // Marcar como leída
    if (!notification.leida) {
      markAsRead(notification.id);
    }
  };

  const loadProvidersForProduct = async (productId) => {
    try {
      // Obtener todos los proveedores del producto
      const response = await axiosClient.get(`/products/${productId}/providers`);
      if (response.data && Array.isArray(response.data)) {
        setAvailableProviders(response.data);
      } else {
        setAvailableProviders([]);
      }
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      // Si falla, intentar obtener todos los proveedores
      try {
        const allProvidersResponse = await axiosClient.get('/proveedores');
        if (allProvidersResponse.data && Array.isArray(allProvidersResponse.data)) {
          setAvailableProviders(allProvidersResponse.data);
        } else {
          setAvailableProviders([]);
        }
      } catch (err) {
        console.error('Error al cargar todos los proveedores:', err);
        setAvailableProviders([]);
      }
    }
  };

  const markAsRead = async (id) => {
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
      loadUnreadCount();
      loadNotifications();
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const handleAccept = async () => {
    if (!selectedNotification) return;
    
    if (!selectedProviderId) {
      alert('Por favor seleccione un proveedor');
      return;
    }

    setProcessing(true);
    try {
      const response = await axiosClient.post(`/notifications/${selectedNotification.id}/accept`, {
        proveedor_id: selectedProviderId
      });
      
      // Cerrar el dialog de notificación primero
      setDialogOpen(false);
      
      // Mostrar resultado
      setTimeout(() => {
        setResultData({
          success: response.data.success,
          message: response.data.message || 'Correo enviado exitosamente al proveedor'
        });
        setResultDialogOpen(true);
        
        if (response.data.success) {
          loadNotifications();
          loadUnreadCount();
        }
      }, 300);
    } catch (error) {
      console.error('Error al aceptar:', error);
      
      // Cerrar el dialog de notificación primero
      setDialogOpen(false);
      
      // Mostrar error
      setTimeout(() => {
        setResultData({
          success: false,
          message: error.response?.data?.message || 'Error al enviar el correo'
        });
        setResultDialogOpen(true);
      }, 300);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedNotification) return;

    setProcessing(true);
    try {
      const response = await axiosClient.post(`/notifications/${selectedNotification.id}/reject`);
      
      setDialogOpen(false);
      
      setTimeout(() => {
        setResultData({
          success: true,
          message: 'Notificación rechazada correctamente'
        });
        setResultDialogOpen(true);
        
        loadNotifications();
        loadUnreadCount();
      }, 300);
    } catch (error) {
      console.error('Error al rechazar:', error);
      
      setDialogOpen(false);
      
      setTimeout(() => {
        setResultData({
          success: false,
          message: error.response?.data?.message || 'Error al rechazar la notificación'
        });
        setResultDialogOpen(true);
      }, 300);
    } finally {
      setProcessing(false);
    }
  };

  const getEstadoChip = (estado) => {
    switch (estado) {
      case 'pendiente':
        return <Chip label="Pendiente" color="warning" size="small" />;
      case 'aceptada':
        return <Chip label="Aceptada" color="success" size="small" icon={<CheckCircleIcon />} />;
      case 'rechazada':
        return <Chip label="Rechazada" color="error" size="small" icon={<CancelIcon />} />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label="notificaciones"
        sx={{
          '&:focus': { outline: 'none' },
          '& .MuiTouchRipple-child': { backgroundColor: 'white' }
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="h6">Notificaciones</Typography>
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No hay notificaciones
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {notifications.map((notif) => (
              <MenuItem
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  py: 2,
                  borderBottom: '1px solid #eee',
                  backgroundColor: notif.leida ? 'transparent' : '#f5f5f5',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                  <InventoryIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="subtitle2" sx={{ flex: 1 }}>
                    {notif.producto.nombre}
                  </Typography>
                  {getEstadoChip(notif.estado)}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Stock: {notif.cantidad_actual}/{notif.stock_minimo} unidades
                </Typography>
                {notif.proveedor && (
                  <Typography variant="caption" color="text.secondary">
                    Proveedor: {notif.proveedor.nombre}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {formatDate(notif.created_at)}
                </Typography>
              </MenuItem>
            ))}
          </Box>
        )}
      </Menu>

      {/* Dialog de confirmación */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => !processing && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedNotification && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon color="warning" />
                <Typography variant="h6">
                  Alerta de Stock Bajo
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedNotification.estado === 'pendiente' ? (
                <>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {selectedNotification.mensaje}
                  </Alert>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Detalles del Producto:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2">
                        <strong>Código:</strong> {selectedNotification.producto.codigo}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Producto:</strong> {selectedNotification.producto.nombre}
                      </Typography>
                      <Typography variant="body2" color="error">
                        <strong>Stock Actual:</strong> {selectedNotification.cantidad_actual} unidades
                      </Typography>
                      <Typography variant="body2">
                        <strong>Stock Mínimo:</strong> {selectedNotification.stock_minimo} unidades
                      </Typography>
                    </Box>
                  </Box>

                  {/* Selector de Proveedor */}
                  <Box sx={{ mt: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Seleccionar Proveedor</InputLabel>
                      <Select
                        value={selectedProviderId}
                        onChange={(e) => setSelectedProviderId(e.target.value)}
                        label="Seleccionar Proveedor"
                      >
                        {availableProviders.map((provider) => (
                          <MenuItem key={provider.id} value={provider.id}>
                            {provider.nombre} - {provider.email}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2">
                      ¿Desea enviar un correo electrónico al proveedor seleccionado para solicitar reabastecimiento?
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box>
                  <Alert 
                    severity={selectedNotification.estado === 'aceptada' ? 'success' : 'info'}
                    sx={{ mb: 2 }}
                  >
                    Esta notificación ya ha sido {selectedNotification.estado}.
                  </Alert>
                  <Typography variant="body2">
                    <strong>Fecha de respuesta:</strong> {formatDate(selectedNotification.fecha_respuesta)}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              {selectedNotification.estado === 'pendiente' ? (
                <>
                  <Button 
                    onClick={() => setDialogOpen(false)} 
                    disabled={processing}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleReject} 
                    color="error"
                    startIcon={<CancelIcon />}
                    disabled={processing}
                  >
                    Rechazar
                  </Button>
                  <Button 
                    onClick={handleAccept} 
                    color="success"
                    variant="contained"
                    startIcon={processing ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                    disabled={processing}
                  >
                    {processing ? 'Enviando...' : 'Aceptar y Enviar Email'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setDialogOpen(false)}>
                  Cerrar
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog de resultado */}
      <Dialog 
        open={resultDialogOpen} 
        onClose={() => setResultDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          {resultData.success ? (
            <>
              <EmailIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                ¡Éxito!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {resultData.message}
              </Typography>
            </>
          ) : (
            <>
              <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Error
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {resultData.message}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialogOpen(false)} fullWidth variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationBell;
