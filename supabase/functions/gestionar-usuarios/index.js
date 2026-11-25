import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function respuesta(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return respuesta({ error: 'Método no permitido.' }, 405);
  }

  let admin;
  let idCreado = null;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceKey || !anonKey) {
      throw new Error('Faltan variables de entorno de Supabase.');
    }

    // Comprobar la sesión del administrador.
    const token = req.headers.get('Authorization');

    if (!token) {
      return respuesta({ error: 'No hay sesión autenticada.' }, 401);
    }

    const cliente = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: token },
      },
    });

    const { data: sesion, error: errorSesion } =
      await cliente.auth.getUser();

    if (errorSesion || !sesion.user) {
      return respuesta({ error: 'Sesión no válida.' }, 401);
    }

    // Crear cliente administrativo.
    admin = createClient(supabaseUrl, serviceKey);

    const { data: administrador, error: errorAdmin } = await admin
      .from('usuarios')
      .select('rol, activo')
      .eq('id', sesion.user.id)
      .maybeSingle();

    if (
      errorAdmin ||
      !administrador ||
      administrador.rol !== 'admin' ||
      administrador.activo !== true
    ) {
      return respuesta({
        error: 'Solo un administrador activo puede realizar esta operación.',
      }, 403);
    }

    const datos = await req.json();
    const { accion } = datos;


    
    // LISTAR USUARIOS.
    if (accion === 'listar') {
      const pagina = Math.max(1, Number(datos.pagina) || 1);
      const limite = Math.min(
        100,
        Math.max(1, Number(datos.limite) || 50)
      );

      const desde = (pagina - 1) * limite;
      const hasta = desde + limite - 1;

      let consulta = admin
        .from('usuarios')
        .select(
          'id, nombre, correo, telefono, rol, ci, direccion, fecha_nacimiento, foto_url, especialidad, activo, created_at, updated_at',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false });

      if (
        datos.rol &&
        ['cliente', 'barbero', 'admin'].includes(datos.rol)
      ) {
        consulta = consulta.eq('rol', datos.rol);
      }

      if (typeof datos.activo === 'boolean') {
        consulta = consulta.eq('activo', datos.activo);
      }

      // Buscar por nombre, correo o CI.
      const termino = String(datos.buscar || '')
        .trim()
        .replace(/[^\p{L}\p{N}@._\-\s]/gu, '')
        .slice(0, 100);

      if (termino) {
        const patron = `%${termino}%`;

        consulta = consulta.or(
          `nombre.ilike.${patron},correo.ilike.${patron},ci.ilike.${patron}`
        );
      }

      const {
        data: usuarios,
        error,
        count,
      } = await consulta.range(desde, hasta);

      if (error) throw error;

      return respuesta({
        mensaje: 'Usuarios consultados correctamente.',
        usuarios,
        total: count || 0,
        pagina,
        limite,
        totalPaginas: Math.ceil((count || 0) / limite),
      });
    }


    // CREAR USUARIO.
    if (accion === 'crear') {
      const {
        nombre,
        correo,
        telefono,
        password,
        rol,
        ci,
        direccion,
        fecha_nacimiento,
        foto_url,
        especialidad,
      } = datos;

      const correoLimpio = correo?.trim().toLowerCase();

      if (
        !nombre?.trim() ||
        !correoLimpio ||
        !telefono?.trim() ||
        !password ||
        password.length < 6 ||
        !['cliente', 'barbero', 'admin'].includes(rol)
      ) {
        return respuesta({
          error: 'Verifica los datos obligatorios del usuario.',
        }, 400);
      }

      // Crear cuenta en Supabase Auth.
      // El trigger crea automáticamente el perfil inicial.
      const { data: cuenta, error: errorCrear } =
        await admin.auth.admin.createUser({
          email: correoLimpio,
          password,
          email_confirm: true,
          user_metadata: {
            nombre: nombre.trim(),
            telefono: telefono.trim(),
          },
        });

      if (errorCrear) throw errorCrear;

      idCreado = cuenta.user.id;

      // Actualizar el perfil creado por el trigger.
      const perfil = {
        nombre: nombre.trim(),
        correo: correoLimpio,
        telefono: telefono.trim(),
        rol,
        ci: rol === 'barbero' ? ci || null : null,
        direccion: rol === 'barbero' ? direccion || null : null,
        fecha_nacimiento:
          rol === 'barbero' ? fecha_nacimiento || null : null,
        foto_url: rol === 'barbero' ? foto_url || null : null,
        especialidad:
          rol === 'barbero' ? especialidad || null : null,
        activo: true,
      };

      const { error: errorPerfil } = await admin
        .from('usuarios')
        .update(perfil)
        .eq('id', idCreado);

      if (errorPerfil) throw errorPerfil;

      return respuesta({
        mensaje: 'Usuario creado correctamente.',
        id: idCreado,
      });
    }

    // EDITAR USUARIO.
    if (accion === 'actualizar') {
      const {
        id,
        nombre,
        correo,
        telefono,
        password,
        rol,
        ci,
        direccion,
        fecha_nacimiento,
        foto_url,
        especialidad,
      } = datos;

      if (!id) {
        return respuesta({ error: 'Falta el ID del usuario.' }, 400);
      }

      if (id === sesion.user.id && rol && rol !== 'admin') {
        return respuesta({
          error: 'No puedes cambiar tu propio rol de administrador.',
        }, 400);
      }

      if (rol && !['cliente', 'barbero', 'admin'].includes(rol)) {
        return respuesta({ error: 'El rol indicado no es válido.' }, 400);
      }

      const cambiosAuth = {};

      if (correo !== undefined) {
        const correoLimpio = correo.trim().toLowerCase();

        if (!correoLimpio) {
          return respuesta({ error: 'El correo no es válido.' }, 400);
        }

        cambiosAuth.email = correoLimpio;
        cambiosAuth.email_confirm = true;
      }

      if (password !== undefined && password !== '') {
        if (password.length < 6) {
          return respuesta({
            error: 'La contraseña debe tener al menos 6 caracteres.',
          }, 400);
        }

        cambiosAuth.password = password;
      }

      // Actualizar credenciales cuando corresponda.
      if (Object.keys(cambiosAuth).length > 0) {
        const { error } = await admin.auth.admin.updateUserById(
          id,
          cambiosAuth
        );

        if (error) throw error;
      }

      const perfil = {};

      if (nombre !== undefined) perfil.nombre = nombre.trim();
      if (correo !== undefined) {
        perfil.correo = correo.trim().toLowerCase();
      }
      if (telefono !== undefined) perfil.telefono = telefono.trim();
      if (rol !== undefined) perfil.rol = rol;

      if (rol !== undefined && rol !== 'barbero') {
        perfil.ci = null;
        perfil.direccion = null;
        perfil.fecha_nacimiento = null;
        perfil.foto_url = null;
        perfil.especialidad = null;
      } else if (rol === 'barbero' || !rol) {
        if (ci !== undefined) perfil.ci = ci || null;
        if (direccion !== undefined) perfil.direccion = direccion || null;
        if (fecha_nacimiento !== undefined) {
          perfil.fecha_nacimiento = fecha_nacimiento || null;
        }
        if (foto_url !== undefined) perfil.foto_url = foto_url || null;
        if (especialidad !== undefined) {
          perfil.especialidad = especialidad || null;
        }
      }

      if (Object.keys(perfil).length > 0) {
        const { error } = await admin
          .from('usuarios')
          .update(perfil)
          .eq('id', id);

        if (error) throw error;
      }

      return respuesta({
        mensaje: 'Usuario actualizado correctamente.',
      });
    }

    // ACTIVAR O INACTIVAR CUENTA.
    if (accion === 'cambiar_estado') {
      const { id, activo } = datos;

      if (!id || typeof activo !== 'boolean') {
        return respuesta({
          error: 'Indica el usuario y su nuevo estado.',
        }, 400);
      }

      if (id === sesion.user.id && activo === false) {
        return respuesta({
          error: 'No puedes inactivar tu propia cuenta.',
        }, 400);
      }

      // Bloquear o desbloquear el acceso en Supabase Auth.
      const { error: errorAuth } = await admin.auth.admin.updateUserById(
        id,
        {
          ban_duration: activo ? 'none' : '876000h',
        }
      );

      if (errorAuth) throw errorAuth;

      // Actualizar el estado del perfil.
      const { error: errorEstado } = await admin
        .from('usuarios')
        .update({ activo })
        .eq('id', id);

      if (errorEstado) throw errorEstado;

      return respuesta({
        mensaje: activo
          ? 'Cuenta activada correctamente.'
          : 'Cuenta inactivada correctamente.',
      });
    }

    return respuesta({ error: 'La operación solicitada no es válida.' }, 400);

  } catch (error) {
    console.error('Error en gestionar-usuarios:', error);

    // Si falla la creación del perfil, eliminar la cuenta recién creada.
    if (idCreado && admin) {
      await admin.auth.admin.deleteUser(idCreado);
    }

    return respuesta({
      error: error.message || 'Ocurrió un error al gestionar el usuario.',
    }, 500);
  }
});
