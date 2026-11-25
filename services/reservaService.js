import { supabase } from './supabase';

// Obtener los horarios de un barbero para una fecha.
export async function obtenerHorariosDisponibles(barberoId, fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaSeleccionada = new Date(`${fecha}T00:00:00`);

  const fechaMaxima = new Date(hoy);
  fechaMaxima.setDate(fechaMaxima.getDate() + 30);

  if (fechaSeleccionada > fechaMaxima) {
    throw new Error(
      'Solo puedes consultar horarios dentro de los próximos 30 días.'
    );
  }

  const { data, error } = await supabase.rpc(
    'obtener_horarios_disponibles',
    {
      p_barbero_id: barberoId,
      p_fecha: fecha,
    }
  );

  if (error) {
    if (error.code === 'P0001' && error.message?.includes('fechas pasadas')) {
      throw new Error(
        'No puedes consultar fechas pasadas. Selecciona una fecha válida.'
      );
    }

    throw error;
  }

  return data || [];
}

// Registrar una nueva reserva en Supabase.
export async function registrarReserva(datosReserva) {
  const { data, error } = await supabase
    .from('reservas')
    .insert(datosReserva)
    .select('id')
    .single();

  if (error) throw error;

  return data;
}

// Guardar la ruta de la imagen de referencia en la reserva.
export async function actualizarImagenReferenciaReserva(
  reservaId,
  rutaImagen
) {
  const { data, error } = await supabase
    .from('reservas')
    .update({
      imagen_referencia: rutaImagen,
    })
    .eq('id', reservaId)
    .select('id, imagen_referencia')
    .single();

  if (error) throw error;

  return data;
}



// Obtener una reserva registrada mediante su UUID.
export async function obtenerReservaPorId(reservaId) {
  const { data: reserva, error } = await supabase
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
      direccion_referencia,
      latitud,
      longitud,
      imagen_referencia
    `)
    .eq('id', reservaId)
    .single();

  if (error) throw error;

  const { data: usuarios, error: errorUsuarios } = await supabase
    .from('usuarios')
    .select('id, nombre, telefono, direccion')
    .in('id', [reserva.cliente_id, reserva.barbero_id]);

  if (errorUsuarios) throw errorUsuarios;

  const cliente = usuarios.find(
    (usuario) => usuario.id === reserva.cliente_id
  );

  const barbero = usuarios.find(
    (usuario) => usuario.id === reserva.barbero_id
  );

  const { data: corte, error: errorCorte } = await supabase
    .from('cortes')
    .select('imagen_url, es_personalizado')
    .eq('id', reserva.corte_id)
    .maybeSingle();

  if (errorCorte) throw errorCorte;

  return {
    ...reserva,
    cliente: cliente?.nombre || 'Cliente',
    telefono_cliente: cliente?.telefono || '',
    direccion_cliente: cliente?.direccion || '',
    barbero_nombre: barbero?.nombre || 'Barbero',
    imagen_url: corte?.imagen_url || null,
    corte_personalizado: corte?.es_personalizado || false,
  };
}


// Obtener todas las reservas de un cliente.
export async function obtenerReservasPorCliente(clienteId) {
  const { data: reservas, error } = await supabase
    .from('reservas')
    .select(`
      id,
      cliente_id,
      barbero_id,
      servicio,
      fecha,
      hora,
      modalidad,
      precio_base,
      precio,
      incluye_barba,
      estado,
      created_at
    `)
    .eq('cliente_id', clienteId)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false });

  if (error) throw error;

  if (!reservas || reservas.length === 0) {
    return [];
  }

  const barberosIds = [
    ...new Set(reservas.map((reserva) => reserva.barbero_id)),
  ];

  const { data: barberos, error: errorBarberos } = await supabase
    .from('usuarios')
    .select('id, nombre')
    .in('id', barberosIds);

  if (errorBarberos) throw errorBarberos;

  const nombresBarberos = {};

  (barberos || []).forEach((barbero) => {
    nombresBarberos[barbero.id] = barbero.nombre;
  });

  return reservas.map((reserva) => ({
    ...reserva,
    barbero_nombre:
      nombresBarberos[reserva.barbero_id] || 'Barbero',
  }));
}

// Cancelar únicamente una reserva pendiente del cliente.
export async function cancelarReserva(reservaId, clienteId) {
  const { data, error } = await supabase
    .from('reservas')
    .update({
      estado: 'cancelada',
    })
    .eq('id', reservaId)
    .eq('cliente_id', clienteId)
    .eq('estado', 'pendiente de realizar')
    .select('id')
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
}

// Funciones del barbero.

// Obtener la fecha actual en formato YYYY-MM-DD.
function obtenerFechaLocal() {
  const fecha = new Date();

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

// Obtener todas las citas asignadas al barbero.
export async function obtenerAgendaPorBarbero(barberoId) {
  const { data: reservas, error } = await supabase
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
      precio,
      incluye_barba,
      estado,
      imagen_referencia
    `)
    .eq('barbero_id', barberoId)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: true });

  if (error) throw error;

  if (!reservas || reservas.length === 0) {
    return [];
  }

  // Obtener los clientes de las reservas.
  const clientesIds = [
    ...new Set(
      reservas
        .map((reserva) => reserva.cliente_id)
        .filter((id) => id !== null && id !== undefined)
    ),
  ];

  let clientes = [];

  if (clientesIds.length > 0) {
    const { data, error: errorClientes } = await supabase
      .from('usuarios')
      .select('id, nombre, telefono, correo')
      .in('id', clientesIds);

    if (errorClientes) throw errorClientes;

    clientes = data || [];
  }

  const datosClientes = {};

  clientes.forEach((cliente) => {
    datosClientes[cliente.id] = cliente;
  });

  // Obtener las imágenes y el tipo de cada corte.
  const cortesIds = [
    ...new Set(
      reservas
        .map((reserva) => reserva.corte_id)
        .filter((id) => id !== null && id !== undefined)
    ),
  ];

  let cortes = [];

  if (cortesIds.length > 0) {
    const { data, error: errorCortes } = await supabase
      .from('cortes')
      .select('id, imagen_url, es_personalizado')
      .in('id', cortesIds);

    if (errorCortes) throw errorCortes;

    cortes = data || [];
  }

  const datosCortes = {};

  cortes.forEach((corte) => {
    datosCortes[corte.id] = corte;
  });

  // Devolver las reservas con sus datos relacionados.
  return reservas.map((reserva) => {
    const cliente = datosClientes[reserva.cliente_id];
    const corte = datosCortes[reserva.corte_id];

    return {
      ...reserva,
      cliente: cliente?.nombre || 'Cliente',
      telefono_cliente: cliente?.telefono || '',
      correo_cliente: cliente?.correo || '',
      imagen_url: corte?.imagen_url || null,
      corte_personalizado: corte?.es_personalizado || false,
    };
  });
}



// Obtener el historial y las ganancias de un barbero.
export async function obtenerHistorialPorBarbero(barberoId) {
  const { data: reservas, error } = await supabase
    .from('reservas')
    .select(`
      id,
      cliente_id,
      barbero_id,
      servicio,
      fecha,
      hora,
      modalidad,
      precio,
      incluye_barba,
      estado
    `)
    .eq('barbero_id', barberoId)
    .in('estado', [
      'pendiente de realizar',
      'realizada',
      'cancelada',
    ])
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false });

  if (error) throw error;

  const historial = reservas || [];

  const clientesIds = [
    ...new Set(historial.map((reserva) => reserva.cliente_id)),
  ];

  let clientes = [];

  if (clientesIds.length > 0) {
    const { data, error: errorClientes } = await supabase
      .from('usuarios')
      .select('id, nombre, telefono')
      .in('id', clientesIds);

    if (errorClientes) throw errorClientes;

    clientes = data || [];
  }

  const datosClientes = {};

  clientes.forEach((cliente) => {
    datosClientes[cliente.id] = cliente;
  });

  // Solo los servicios realizados generan ganancias.
  const serviciosRealizados = historial.filter(
    (reserva) => reserva.estado === 'realizada'
  );

  const gananciaBruta = serviciosRealizados.reduce(
    (total, reserva) => total + Number(reserva.precio || 0),
    0
  );

  // El 30% corresponde a la barbería y el 70% al barbero.
  const comisionBarberia = gananciaBruta * 0.30;
  const gananciaNeta = gananciaBruta * 0.70;

  return {
    reservas: historial.map((reserva) => ({
      ...reserva,
      cliente: datosClientes[reserva.cliente_id]?.nombre || 'Cliente',
      telefono_cliente:
        datosClientes[reserva.cliente_id]?.telefono || '',
    })),
    cantidadServicios: serviciosRealizados.length,
    gananciaBruta,
    comisionBarberia,
    gananciaNeta,
  };
}


// Funciones administrativas de reservas.

// Obtener todas las reservas para el administrador.
export async function obtenerTodasLasReservas() {
  const { data: reservas, error } = await supabase
    .from('reservas')
    .select(`
      id,
      cliente_id,
      barbero_id,
      servicio,
      fecha,
      hora,
      modalidad,
      precio_base,
      precio,
      incluye_barba,
      estado,
      created_at
    `)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false });

  if (error) throw error;

  if (!reservas || reservas.length === 0) {
    return [];
  }

  // Obtener los identificadores de clientes y barberos.
  const usuariosIds = [
    ...new Set(
      reservas.flatMap((reserva) => [
        reserva.cliente_id,
        reserva.barbero_id,
      ])
    ),
  ];

  const { data: usuarios, error: errorUsuarios } = await supabase
    .from('usuarios')
    .select('id, nombre, telefono')
    .in('id', usuariosIds);

  if (errorUsuarios) throw errorUsuarios;

  const datosUsuarios = {};

  (usuarios || []).forEach((usuario) => {
    datosUsuarios[usuario.id] = usuario;
  });

  // Devolver las reservas con los nombres correspondientes.
  return reservas.map((reserva) => ({
    ...reserva,
    cliente_nombre:
      datosUsuarios[reserva.cliente_id]?.nombre || 'Cliente',
    cliente_telefono:
      datosUsuarios[reserva.cliente_id]?.telefono || '',
    barbero_nombre:
      datosUsuarios[reserva.barbero_id]?.nombre || 'Barbero',
  }));
}

// Cambiar el estado de una reserva pendiente desde administración.
export async function actualizarEstadoReserva(reservaId, nuevoEstado) {
  const estadosPermitidos = ['realizada', 'cancelada'];

  if (!estadosPermitidos.includes(nuevoEstado)) {
    throw new Error('El estado solicitado no es válido.');
  }

  const { data, error } = await supabase
    .from('reservas')
    .update({
      estado: nuevoEstado,
    })
    .eq('id', reservaId)
    .eq('estado', 'pendiente de realizar')
    .select('id')
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
}

// Obtener las reservas realizadas para las estadísticas administrativas.
export async function obtenerEstadisticasAdmin() {
  const { data: reservas, error } = await supabase
    .from('reservas')
    .select('id, barbero_id, servicio, fecha, precio, estado')
    .eq('estado', 'realizada')
    .order('fecha', { ascending: false });

  if (error) throw error;

  if (!reservas || reservas.length === 0) {
    return [];
  }

  const barberosIds = [
    ...new Set(reservas.map((reserva) => reserva.barbero_id)),
  ];

  const { data: barberos, error: errorBarberos } = await supabase
    .from('usuarios')
    .select('id, nombre')
    .in('id', barberosIds);

  if (errorBarberos) throw errorBarberos;

  const nombresBarberos = {};

  (barberos || []).forEach((barbero) => {
    nombresBarberos[barbero.id] = barbero.nombre;
  });

  return reservas.map((reserva) => ({
    ...reserva,
    precio: Number(reserva.precio || 0),
    barbero_nombre:
      nombresBarberos[reserva.barbero_id] || 'Barbero',
  }));
}
