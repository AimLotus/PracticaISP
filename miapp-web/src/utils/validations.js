// Utilidades de validación

/**
 * Valida formato de email
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Valida que el campo no esté vacío
 */
export const validateRequired = (value) => {
  return value && value.toString().trim() !== '';
};

/**
 * Valida longitud mínima
 */
export const validateMinLength = (value, minLength) => {
  return value && value.toString().length >= minLength;
};

/**
 * Valida longitud máxima
 */
export const validateMaxLength = (value, maxLength) => {
  return value && value.toString().length <= maxLength;
};

/**
 * Valida formato de RUC o CI (Ecuador)
 */
export const validateRucCi = (value) => {
  if (!value) return true; // Es opcional
  const cleaned = value.toString().replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 13;
};

/**
 * Valida número de teléfono
 */
export const validatePhone = (value) => {
  if (!value) return true; // Es opcional
  const cleaned = value.toString().replace(/\D/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15;
};

/**
 * Valida que sea un número positivo
 */
export const validatePositiveNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

/**
 * Valida que sea un número no negativo
 */
export const validateNonNegativeNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
};

/**
 * Valida contraseña (mínimo 6 caracteres)
 */
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Valida que dos contraseñas coincidan
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};
