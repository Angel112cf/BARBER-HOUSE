import { supabase } from './supabase';

// Completar las reservas con los nombres de cliente y barbero,
// además de la información del corte seleccionado.
async function completarDatosAdmin(reservas) {
  if (!reservas || reservas.length === 0) {
    return [];
  }

  // Obtener los identificadores de los usuarios involucrados.
  const usuariosIds = [
    ...new Set(
      reservas.flatMap((reserva) => [
        reserva.cliente_id,
        reserva.barbero_id,
      ]).filter(Boolean)
    ),
  ];

  let usuarios = [];

  if (usuariosIds.length > 0) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, telefono')
      .in('id', usuariosIds);

    if (error) throw error;

    usuarios = data || [];
  }

  // Obtener los identificadores de los cortes.
  const cortesIds = [
    ...new Set(
      reservas
        .map((reserva) => reserva.corte_id)
        .filter(Boolean)
    ),
  ];

  let cortes = [];

  if (cortesIds.length > 0) {
    const { data, error } = await supabase
      .from('cortes')
      .select('id, imagen_url, es_personalizado')
      .in('id', cortesIds);

    if (error) throw error;

    cortes = data || [];
  }

  // Organizar los usuarios por identificador.
  const datosUsuarios = {};

  usuarios.forEach((usuario) => {
    datosUsuarios[usuario.id] = usuario;
  });

  // Organizar los cortes por identificador.
  const datosCortes = {};

  cortes.forEach((corte) => {
    datosCortes[corte.id] = corte;
  });

  // Completar cada reserva con sus datos relacionados.
  return reservas.map((reserva) => {
    const corte = datosCortes[reserva.corte_id];

    return {
      ...reserva,

      cliente_nombre:
        datosUsuarios[reserva.cliente_id]?.nombre || 'Cliente',

      cliente_telefono:
        datosUsuarios[reserva.cliente_id]?.telefono || '',

      barbero_nombre:
        datosUsuarios[reserva.barbero_id]?.nombre || 'Barbero',

      imagen_url:
        corte?.imagen_url || null,

      corte_personalizado:
        Boolean(corte?.es_personalizado),
    };
  });
}

// Consultar todas las reservas con los datos necesarios
// para la gestión administrativa.
export async function obtenerTodasLasReservasAdmin() {
  const { data, error } = await supabase
    .from('reservas')
    .select(`
      id,
      cliente_id,
      barbero_id,
      corte_id,
      servicio,
      fecha,
      hora,
      modalidad,
      precio_base,
      precio,
      incluye_barba,
      estado,
      created_at,
      direccion_referencia,
      latitud,
      longitud,
      imagen_referencia
    `)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false });

  if (error) throw error;

  return completarDatosAdmin(data || []);
}

// Consultar una reserva específica para mostrar
// toda su información en el detalle administrativo.
export async function obtenerReservaAdminPorId(reservaId) {
  if (!reservaId) {
    throw new Error('No se recibió el identificador de la reserva.');
  }

  const { data, error } = await supabase
    .from('reservas')
    .select(`
      id,
      cliente_id,
      barbero_id,
      corte_id,
      servicio,
      fecha,
      hora,
      modalidad,
      precio_base,
      precio,
      incluye_barba,
      estado,
      created_at,
      direccion_referencia,
      latitud,
      longitud,
      imagen_referencia
    `)
    .eq('id', reservaId)
    .single();

  if (error) throw error;

  const [reserva] = await completarDatosAdmin([data]);

  return reserva;
}
