/**
 * Utilidades para formatear moneda en formato colombiano (pesos)
 */

/**
 * Convierte un número a formato de pesos colombianos
 * @param amount - Cantidad en número
 * @returns String formateado como pesos colombianos (ej: $129.000)
 */
export function formatColombianPeso(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Convierte un string con formato colombiano a número
 * @param formattedAmount - String con formato (ej: "129.000" o "$129.000")
 * @returns Número
 */
export function parseColombianPeso(formattedAmount: string): number {
  // Remover símbolo de peso y espacios
  const cleanAmount = formattedAmount.replace(/[$\s]/g, '');
  
  // Remover puntos de miles y convertir a número
  const numericAmount = parseFloat(cleanAmount.replace(/\./g, ''));
  
  return isNaN(numericAmount) ? 0 : numericAmount;
}

/**
 * Formatea un input para mostrar formato colombiano mientras se escribe
 * @param value - Valor del input
 * @returns String formateado para mostrar
 */
export function formatInputForDisplay(value: string): string {
  // Remover todo excepto números
  const numericValue = value.replace(/\D/g, '');
  
  if (numericValue === '') return '';
  
  // Convertir a número y formatear
  const number = parseInt(numericValue, 10);
  return formatColombianPeso(number);
}

/**
 * Obtiene el valor numérico de un input formateado para guardar en BD
 * @param formattedValue - Valor formateado del input
 * @returns Número para guardar en BD
 */
export function getNumericValue(formattedValue: string): number {
  return parseColombianPeso(formattedValue);
} 