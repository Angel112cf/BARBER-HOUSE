import { supabase } from './supabase';

// Registrar un nuevo cliente
export async function registrarCliente({
  nombre,
  correo,
  telefono,
  password,
}) {
  const { data, error } = await supabase.auth.signUp({
    email: correo.trim().toLowerCase(),
    password,
    options: {
      data: {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

// Iniciar sesión
export async function iniciarSesion(correo, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

// Cerrar sesión
export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

// Obtener la sesión actual
export async function obtenerSesion() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}
