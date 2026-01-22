import axiosClient from './axiosClient';

// Servicio para obtener datos financieros (solo para roles admin y dueño)

export const obtenerResumenFinanciero = async () => {
  try {
    const response = await axiosClient.get('/finanzas/resumen');
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error al obtener resumen financiero'
    );
  }
};

export const obtenerVentasPorPeriodo = async (periodo = 'mes') => {
  try {
    const response = await axiosClient.get('/finanzas/ventas-por-periodo', {
      params: { periodo }
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error al obtener ventas por periodo'
    );
  }
};

export const obtenerProductosMasVendidos = async (limite = 10) => {
  try {
    const response = await axiosClient.get('/finanzas/productos-mas-vendidos', {
      params: { limite }
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error al obtener productos más vendidos'
    );
  }
};

export const obtenerIngresosVsGastos = async (periodo = 'mes') => {
  try {
    const response = await axiosClient.get('/finanzas/ingresos-vs-gastos', {
      params: { periodo }
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error al obtener ingresos vs gastos'
    );
  }
};

export const obtenerMejoresClientes = async (limite = 10) => {
  try {
    const response = await axiosClient.get('/finanzas/mejores-clientes', {
      params: { limite }
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error al obtener mejores clientes'
    );
  }
};

export const obtenerPrincipalesProveedores = async (limite = 10) => {
  try {
    const response = await axiosClient.get('/finanzas/principales-proveedores', {
      params: { limite }
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Error al obtener principales proveedores'
    );
  }
};
