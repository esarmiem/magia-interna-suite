/**
 * Utilidades para manejo de fechas de manera consistente
 * Evita problemas de timezone al trabajar con fechas de nacimiento
 * Configurado para zona horaria de Colombia (UTC-5)
 */

/**
 * Convierte una fecha de string a Date sin problemas de timezone
 * Para fechas de nacimiento, solo necesitamos la fecha, no la hora
 */
export function parseBirthDate(dateString: string | null): Date | null {
  if (!dateString) return null;
  
  // Crear fecha directamente sin timezone para evitar desplazamientos
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formatea una fecha de nacimiento para mostrar
 */
export function formatBirthDate(dateString: string | null): string {
  if (!dateString) return 'No especificada';
  
  const date = parseBirthDate(dateString);
  if (!date) return 'Fecha inválida';
  
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Convierte una fecha de nacimiento a formato ISO para el input date
 * Mantiene la fecha original sin aplicar timezone
 */
export function formatBirthDateForInput(dateString: string | null): string {
  if (!dateString) return '';
  
  // Para el input date, devolver la fecha original sin modificar
  // ya que el input date espera la fecha en formato YYYY-MM-DD
  return dateString;
}

/**
 * Calcula la edad basada en la fecha de nacimiento
 */
export function calculateAge(birthDateString: string): number {
  const birthDate = parseBirthDate(birthDateString);
  if (!birthDate) return 0;
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Calcula días hasta el próximo cumpleaños
 */
export function getDaysUntilBirthday(birthDateString: string): number {
  const birthDate = parseBirthDate(birthDateString);
  if (!birthDate) return 0;
  
  const today = new Date();
  const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  const diffTime = nextBirthday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
} 