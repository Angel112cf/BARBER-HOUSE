import { supabase } from './supabase';

// Obtener los tipos de rostro disponibles.
export async function obtenerTiposRostro() {
  const { data, error } = await supabase
    .from('tipos_rostro')
    .select('id, nombre')
    .order('id', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

// Obtener los cortes normales activos recomendados para un tipo de rostro.
export async function obtenerCortesPorRostro(
  tipoRostroId,
  busqueda = ''
) {
  let consulta = supabase
    .from('cortes')
    .select(`
      id,
      nombre,
      descripcion,
      precio,
      permite_barba,
      imagen_url,
      es_personalizado,
      activo,
      corte_rostro!inner (
        tipo_rostro_id,
        por_que_favorece
      )
    `)
    .eq('activo', true)
    .eq('es_personalizado', false)
    .eq('corte_rostro.tipo_rostro_id', tipoRostroId)
    .order('nombre', { ascending: true });

  const termino = busqueda.trim();

  if (termino) {
    consulta = consulta.ilike('nombre', `%${termino}%`);
  }

  const { data, error } = await consulta;

  if (error) {
    throw error;
  }

  return data.map((corte) => ({
    ...corte,
    por_que_favorece:
      corte.corte_rostro?.[0]?.por_que_favorece || null,
  }));
}

// Obtener el registro activo de corte personalizado.
export async function obtenerCortePersonalizado() {
  const { data, error } = await supabase
    .from('cortes')
    .select(`
      id,
      nombre,
      descripcion,
      precio,
      permite_barba,
      imagen_url,
      es_personalizado,
      activo
    `)
    .eq('activo', true)
    .eq('es_personalizado', true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      'No se encontró un corte personalizado activo en el catálogo.'
    );
  }

  return data;
}

// Obtener los tipos de rostro compatibles con un corte.
export async function obtenerRostrosPorCorte(corteId) {
  const { data, error } = await supabase
    .from('cortes')
    .select(`
      corte_rostro (
        por_que_favorece,
        tipos_rostro (
          id,
          nombre
        )
      )
    `)
    .eq('id', corteId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  return (data.corte_rostro || []).map((relacion) => ({
    id: relacion.tipos_rostro.id,
    nombre: relacion.tipos_rostro.nombre,
    por_que_favorece: relacion.por_que_favorece,
  }));
}
