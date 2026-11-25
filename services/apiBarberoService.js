import { supabase } from './supabase';

const API_URL =
  'https://randomuser.me/api/?results=8&seed=barberhouse';

// Obtener ocho perfiles de la API pública.
export async function obtenerPerfilesAPI() {
  const respuesta = await fetch(API_URL);

  if (!respuesta.ok) {
    throw new Error('No se pudo conectar con la API pública.');
  }

  const resultado = await respuesta.json();

  const perfiles = resultado.results.map((persona) => ({
    id: persona.login.uuid,
    nombre: `${persona.name.first} ${persona.name.last}`,
    correo: persona.email.toLowerCase(),
    telefono: persona.phone,
    foto_url: persona.picture.large,
    fecha_actualizacion: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('perfiles_demo_api')
    .upsert(perfiles, { onConflict: 'id' })
    .select();

  if (error) throw error;

  return data || [];
}
