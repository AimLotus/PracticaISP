import axiosClient from './axiosClient';

/**
 * Obtener configuración de la empresa
 */
export const getCompanySettings = async () => {
  const response = await axiosClient.get('/company-settings');
  return response.data;
};

/**
 * Actualizar configuración de la empresa
 */
export const updateCompanySettings = async (data) => {
  const response = await axiosClient.put('/company-settings', data);
  return response.data;
};

/**
 * Subir logo de la empresa
 */
export const uploadCompanyLogo = async (file) => {
  const formData = new FormData();
  formData.append('logo', file);
  
  const response = await axiosClient.post('/company-settings/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Eliminar logo de la empresa
 */
export const deleteCompanyLogo = async () => {
  const response = await axiosClient.delete('/company-settings/logo');
  return response.data;
};
