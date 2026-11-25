import { supabase } from './supabase';

// Obtener el perfil del usuario.
export async function obtenerPerfil(idUsuario) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, correo, telefono, rol, activo')
    .eq('id', idUsuario)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

// Actualizar nombre y teléfono del cliente.
export async function actualizarDatosCliente({ nombre, telefono }) {
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!authData.user) {
    throw new Error('No hay una sesión activa.');
  }

  const { data, error } = await supabase
    .from('usuarios')
    .update({
      nombre: nombre.trim(),
      telefono: telefono.trim(),
    })
    .eq('id', authData.user.id)
    .select('id, nombre, correo, telefono, rol, activo')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Actualizar el correo mediante Supabase Auth.
export async function actualizarCorreoCliente(correo) {
  const { data, error } = await supabase.auth.updateUser({
    email: correo.trim().toLowerCase(),
  });

  if (error) {
    throw error;
  }

  return data;
}

// Actualizar la contraseña mediante Supabase Auth.
export async function actualizarContrasenaCliente(password) {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}
