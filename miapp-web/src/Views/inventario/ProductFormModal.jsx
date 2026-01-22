import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Typography,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import BusinessIcon from '@mui/icons-material/Business';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../contexts/AuthContext';

const ProductFormModal = ({
  open,
  onClose,
  onSubmit,
  product = null,
  taxes = [],
  suppliers = [],
  isLoading = false,
}) => {
  const { user } = useAuth();
  
  // Configuración de colores basada en el rol del usuario (rol_id: 3 = dueño)
  const themeColor = user?.rol_id === 3 ? '#ff9800' : '#1976d2';
  const themeColorLight = user?.rol_id === 3 ? '#ffb74d' : '#42a5f5';
  
  const isEditing = !!product;
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    precio_compra: '',
    precio_venta: '',
    stock_minimo: '',
    tax_id: '',
  });

  const [providers, setProviders] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [supplierPrice, setSupplierPrice] = useState('');
  const [errors, setErrors] = useState({});

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (product) {
      setFormData({
        codigo: product.codigo || '',
        nombre: product.nombre || '',
        descripcion: product.descripcion || '',
        categoria: product.categoria || '',
        precio_compra: String(product.precio_compra || ''),
        precio_venta: String(product.precio_venta || ''),
        stock_minimo: String(product.stock_minimo || ''),
        tax_id: product.tax_id || '',
      });
      const existingProviders = (product.providers || []).map(prov => ({
        provider_id: prov.id,
        is_primary: prov.pivot?.is_primary || false,
        precio_proveedor: prov.pivot?.precio_proveedor || '',
      }));
      setProviders(existingProviders);
    } else {
      resetForm();
    }
  }, [product, open]);

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria: '',
      precio_compra: '',
      precio_venta: '',
      stock_minimo: '',
      tax_id: '',
    });
    setProviders([]);
    setSelectedSupplier('');
    setIsPrimary(false);
    setSupplierPrice('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error del campo cuando el usuario comienza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código es obligatorio';
    }
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    if (!formData.precio_compra) {
      newErrors.precio_compra = 'El precio de compra es obligatorio';
    } else if (isNaN(Number(formData.precio_compra))) {
      newErrors.precio_compra = 'Debe ser un número válido';
    }
    if (!formData.precio_venta) {
      newErrors.precio_venta = 'El precio de venta es obligatorio';
    } else if (isNaN(Number(formData.precio_venta))) {
      newErrors.precio_venta = 'Debe ser un número válido';
    }
    if (!formData.stock_minimo) {
      newErrors.stock_minimo = 'El stock mínimo es obligatorio';
    } else if (isNaN(Number(formData.stock_minimo))) {
      newErrors.stock_minimo = 'Debe ser un número válido';
    }
    if (!formData.tax_id) {
      newErrors.tax_id = 'Debe seleccionar un impuesto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSupplier = () => {
    if (!selectedSupplier) {
      setErrors(prev => ({ ...prev, supplier: 'Seleccione un proveedor' }));
      return;
    }

    const supplierExists = providers.some(p => p.provider_id === selectedSupplier);
    if (supplierExists) {
      setErrors(prev => ({ ...prev, supplier: 'Este proveedor ya está agregado' }));
      return;
    }

    setProviders([...providers, {
      provider_id: selectedSupplier,
      is_primary: isPrimary,
      precio_proveedor: supplierPrice || '',
    }]);

    setSelectedSupplier('');
    setIsPrimary(false);
    setSupplierPrice('');
    setErrors(prev => ({ ...prev, supplier: '' }));
  };

  const handleRemoveSupplier = (index) => {
    setProviders(providers.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      ...formData,
      precio_compra: parseFloat(formData.precio_compra),
      precio_venta: parseFloat(formData.precio_venta),
      stock_minimo: parseInt(formData.stock_minimo, 10),
      providers: providers.length > 0 ? providers : undefined,
    };

    await onSubmit(payload);
    handleClose();
  };

  const getSupplierName = (supplierId) => {
    return suppliers.find(s => s.id === supplierId)?.nombre || 'Proveedor';
  };

  const hasMarginWarning = () => {
    const costPrice = parseFloat(formData.precio_compra);
    const sellPrice = parseFloat(formData.precio_venta);
    if (!costPrice || !sellPrice) return false;
    const margin = ((sellPrice - costPrice) / costPrice) * 100;
    return margin < 0 || margin > 300;
  };

  const marginValue = () => {
    const costPrice = parseFloat(formData.precio_compra);
    const sellPrice = parseFloat(formData.precio_venta);
    if (!costPrice || !sellPrice) return 0;
    return (((sellPrice - costPrice) / costPrice) * 100).toFixed(2);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      className={isEditing ? 'edit-modal' : 'create-modal'}
    >
      <DialogTitle sx={{
        fontWeight: '700',
        color: '#1a237e',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0',
      }}>
        <Box>{isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}</Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Información Básica */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: '600', mb: 2, color: '#1a237e' }}>
            Información Básica
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              autoFocus
              label="Código"
              name="codigo"
              value={formData.codigo}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              size="small"
              error={!!errors.codigo}
              helperText={errors.codigo}
              placeholder="Ej: PROD001"
            />
            <TextField
              label="Nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              size="small"
              error={!!errors.nombre}
              helperText={errors.nombre}
              placeholder="Nombre del producto"
            />
            <TextField
              label="Descripción"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              size="small"
              multiline
              rows={2}
              placeholder="Descripción opcional del producto"
            />
            <TextField
              label="Categoría"
              name="categoria"
              value={formData.categoria}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Ej: Bebidas, Snacks, Electrónica, etc."
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Precios y Stock */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: '600', mb: 2, color: '#1a237e' }}>
            Precios y Stock
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Precio Compra"
                name="precio_compra"
                type="number"
                value={formData.precio_compra}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!errors.precio_compra}
                helperText={errors.precio_compra}
                inputProps={{ step: '0.01', min: '0' }}
              />
              <TextField
                label="Precio Venta"
                name="precio_venta"
                type="number"
                value={formData.precio_venta}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                size="small"
                error={!!errors.precio_venta}
                helperText={errors.precio_venta}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Box>

            {/* Margen Indicator */}
            {formData.precio_compra && formData.precio_venta && (
              <Alert
                severity={hasMarginWarning() ? 'warning' : 'success'}
                sx={{ py: 1 }}
              >
                <Typography variant="body2">
                  Margen: <strong>{marginValue()}%</strong>
                  {hasMarginWarning() && ' (Verifica este valor)'}
                </Typography>
              </Alert>
            )}

            <TextField
              label="Stock Mínimo"
              name="stock_minimo"
              type="number"
              value={formData.stock_minimo}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              size="small"
              error={!!errors.stock_minimo}
              helperText={errors.stock_minimo}
              inputProps={{ min: '0' }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Impuestos */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: '600', mb: 2, color: '#1a237e' }}>
            Impuestos
          </Typography>
          <FormControl fullWidth size="small" error={!!errors.tax_id}>
            <InputLabel>Seleccione un impuesto</InputLabel>
            <Select
              name="tax_id"
              value={formData.tax_id}
              onChange={handleInputChange}
              label="Seleccione un impuesto"
            >
              {taxes.map((tax) => (
                <MenuItem key={tax.id} value={tax.id}>
                  {tax.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {errors.tax_id && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {errors.tax_id}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Proveedores */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: '600', mb: 2, color: '#1a237e', display: 'flex', alignItems: 'center' }}>
            <BusinessIcon sx={{ mr: 1, fontSize: 20 }} />
            Proveedores (Opcional)
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Seleccionar Proveedor</InputLabel>
              <Select
                value={selectedSupplier}
                onChange={(e) => {
                  setSelectedSupplier(e.target.value);
                  if (errors.supplier) {
                    setErrors(prev => ({ ...prev, supplier: '' }));
                  }
                }}
                label="Seleccionar Proveedor"
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 2, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    size="small"
                  />
                }
                label="Principal"
                sx={{ m: 0 }}
              />
              <TextField
                label="Precio Proveedor"
                type="number"
                value={supplierPrice}
                onChange={(e) => setSupplierPrice(e.target.value)}
                variant="outlined"
                size="small"
                inputProps={{ step: '0.01', min: '0' }}
                fullWidth
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddSupplier}
                startIcon={<AddIcon />}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Agregar
              </Button>
            </Box>

            {errors.supplier && (
              <Typography variant="caption" color="error">
                {errors.supplier}
              </Typography>
            )}
          </Box>

          {/* Lista de Proveedores Agregados */}
          {providers.length > 0 && (
            <List dense sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
              {providers.map((provider, index) => (
                <ListItem key={index} sx={{ py: 1 }}>
                  {provider.is_primary && (
                    <StarIcon sx={{ color: '#ffc107', mr: 1, fontSize: 18 }} />
                  )}
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" sx={{ fontWeight: provider.is_primary ? '600' : '400' }}>
                          {getSupplierName(provider.provider_id)}
                        </Typography>
                        {provider.is_primary && (
                          <Typography
                            variant="caption"
                            sx={{
                              backgroundColor: '#e3f2fd',
                              color: '#1976d2',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              fontWeight: '600',
                            }}
                          >
                            Principal
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={provider.precio_proveedor ? `$${provider.precio_proveedor}` : 'Sin precio definido'}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleRemoveSupplier(index)}
                      sx={{ color: '#f44336' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0', gap: 1 }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none', color: '#666' }}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          sx={{
            background: isEditing 
              ? 'linear-gradient(135deg, #4caf50, #81c784)' 
              : `linear-gradient(135deg, ${themeColor}, ${themeColorLight})`,
            textTransform: 'none',
            fontWeight: '600',
          }}
        >
          {isLoading ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Crear Producto')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductFormModal;
