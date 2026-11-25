import { supabase } from './supabase';

// Crear las ocho cuentas de barberos de demostración.
export async function crearBarberosDemo() {
  const { data, error } = await supabase.functions.invoke(
    'crear-barberos-demo',
    {
      method: 'POST',
    }
  );

  if (error) {
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

// Ejecutar operaciones de gestión de usuarios.
async function ejecutarAccion(datos) {
  const { data, error } = await supabase.functions.invoke(
    'gestionar-usuarios',
    {
      body: datos,
    }
  );

  if (error) {
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}


// Obtener usuarios registrados.
export async function listarUsuarios({
  pagina = 1,
  limite = 50,
  rol,
  activo,
  buscar,
} = {}) {
  return ejecutarAccion({
    accion: 'listar',
    pagina,
    limite,
    rol,
    activo,
    buscar,
  });
}


// Crear un usuario.
export async function crearUsuario(datos) {
  return ejecutarAccion({
    accion: 'crear',
    ...datos,
  });
}

// Actualizar datos de un usuario.
export async function actualizarUsuario(datos) {
  return ejecutarAccion({
    accion: 'actualizar',
    ...datos,
  });
}

// Activar o inactivar una cuenta.
export async function cambiarEstadoUsuario(id, activo) {
  return ejecutarAccion({
    accion: 'cambiar_estado',
    id,
    activo,
  });
}
