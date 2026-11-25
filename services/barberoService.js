import { supabase } from './supabase';

// Obtener los barberos reales y activos.
export async function obtenerBarberos() {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      id,
      nombre,
      correo,
      telefono,
      especialidad,
      foto_url,
      perfiles_demo_api (
        nombre,
        correo,
        telefono,
        foto_url
      )
    `)
    .eq('rol', 'barbero')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) throw error;

  return (data || []).map((barbero) => {
    const perfilAPI = barbero.perfiles_demo_api?.[0] || null;

    return {
      ...barbero,
      perfilAPI,
    };
  });
}

// Obtener los favoritos del cliente.
export async function obtenerFavoritosPorCliente(clienteId) {
  const { data, error } = await supabase
    .from('favoritos_barberos')
    .select('barbero_id')
    .eq('cliente_id', clienteId);

  if (error) throw error;

  return data || [];
}

// Agregar o quitar un barbero de favoritos.
export async function alternarFavorito(clienteId, barberoId) {
  const { data: favorito, error: errorConsulta } = await supabase
    .from('favoritos_barberos')
    .select('cliente_id, barbero_id')
    .eq('cliente_id', clienteId)
    .eq('barbero_id', barberoId)
    .maybeSingle();

  if (errorConsulta) throw errorConsulta;

  if (favorito) {
    const { error } = await supabase
      .from('favoritos_barberos')
      .delete()
      .eq('cliente_id', clienteId)
      .eq('barbero_id', barberoId);

    if (error) throw error;

    return false;
  }

  const { error } = await supabase
    .from('favoritos_barberos')
    .insert({
      cliente_id: clienteId,
      barbero_id: barberoId,
    });

  if (error) throw error;

  return true;
}
