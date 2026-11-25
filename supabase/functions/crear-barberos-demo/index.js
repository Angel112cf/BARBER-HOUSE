import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido.' }),
        { status: 405 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceKey || !anonKey) {
      throw new Error('Faltan variables de entorno de Supabase.');
    }

    // Comprobar que quien ejecuta la función es administrador.
    const token = req.headers.get('Authorization');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No hay sesión autenticada.' }),
        { status: 401 }
      );
    }

    const cliente = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: token } },
    });

    const { data: usuarioAuth, error: errorAuth } =
      await cliente.auth.getUser();

    if (errorAuth || !usuarioAuth.user) {
      return new Response(
        JSON.stringify({ error: 'Sesión no válida.' }),
        { status: 401 }
      );
    }

    // Cliente administrativo de Supabase.
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: administrador, error: errorAdmin } = await admin
      .from('usuarios')
      .select('rol')
      .eq('id', usuarioAuth.user.id)
      .single();

    if (errorAdmin || administrador.rol !== 'admin') {
      return new Response(
        JSON.stringify({
          error: 'Solo un administrador puede realizar esta operación.',
        }),
        { status: 403 }
      );
    }

    // Consultar los ocho perfiles de Random User Generator.
    const respuestaAPI = await fetch(
      'https://randomuser.me/api/?results=8&seed=barberhouse'
    );

    if (!respuestaAPI.ok) {
      throw new Error('No se pudo consultar Random User Generator.');
    }

    const resultadoAPI = await respuestaAPI.json();

    const perfilesAPI = resultadoAPI.results.map((persona) => ({
      id: persona.login.uuid,
      nombre: `${persona.name.first} ${persona.name.last}`,
      correo: persona.email.toLowerCase(),
      telefono: persona.phone,
      foto_url: persona.picture.large,
      fecha_actualizacion: new Date().toISOString(),
    }));

    if (perfilesAPI.length !== 8) {
      throw new Error('La API no devolvió exactamente ocho perfiles.');
    }

    // Guardar los perfiles externos en Supabase.
    const { error: errorGuardar } = await admin
      .from('perfiles_demo_api')
      .upsert(perfilesAPI, { onConflict: 'id' });

    if (errorGuardar) throw errorGuardar;

    // Recuperar los ocho perfiles almacenados.
    const { data: perfiles, error: errorPerfiles } = await admin
      .from('perfiles_demo_api')
      .select('*')
      .order('nombre', { ascending: true });

    if (errorPerfiles) throw errorPerfiles;

    if (!perfiles || perfiles.length !== 8) {
      throw new Error('No se pudieron recuperar los ocho perfiles.');
    }

    // Consultar las cuentas existentes en Supabase Auth.
    const { data: usuariosAuth, error: errorLista } =
      await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (errorLista) throw errorLista;

    const resultados = [];

    // Crear las ocho cuentas de barberos.
    for (let i = 0; i < perfiles.length; i++) {
      const perfil = perfiles[i];
      const correo = `barbero${i + 1}@barberhouse.com`;
      const password = '123456';

      let cuenta = usuariosAuth.users.find(
        (usuario) => usuario.email === correo
      );

      // Crear la cuenta o reutilizarla si ya existe.
      if (!cuenta) {
        const { data, error } = await admin.auth.admin.createUser({
          email: correo,
          password,
          email_confirm: true,
          user_metadata: {
            nombre: perfil.nombre,
            telefono: perfil.telefono,
          },
        });

        if (error) throw error;

        cuenta = data.user;
      } else {
        const { data, error } = await admin.auth.admin.updateUserById(
          cuenta.id,
          {
            password,
            email_confirm: true,
          }
        );

        if (error) throw error;

        cuenta = data.user;
      }

      // Comprobar si el perfil ya existe en la tabla usuarios.
      const { data: usuarioExistente, error: errorConsultaUsuario } =
        await admin
          .from('usuarios')
          .select('id')
          .eq('id', cuenta.id)
          .maybeSingle();

      if (errorConsultaUsuario) throw errorConsultaUsuario;

      const datosBarbero = {
        nombre: perfil.nombre,
        correo,
        telefono: perfil.telefono || '70000000',
        rol: 'barbero',
        especialidad: 'Barbero profesional',
        foto_url: perfil.foto_url,
        activo: true,
      };

      // Actualizar el perfil creado por el trigger o insertarlo.
      let errorUsuario;

      if (usuarioExistente) {
        const resultado = await admin
          .from('usuarios')
          .update(datosBarbero)
          .eq('id', cuenta.id);

        errorUsuario = resultado.error;
      } else {
        const resultado = await admin
          .from('usuarios')
          .insert({
            id: cuenta.id,
            ...datosBarbero,
          });

        errorUsuario = resultado.error;
      }

      if (errorUsuario) throw errorUsuario;

      // Relacionar el perfil de la API con el barbero de Supabase.
      const { error: errorRelacion } = await admin
        .from('perfiles_demo_api')
        .update({ barbero_id: cuenta.id })
        .eq('id', perfil.id);

      if (errorRelacion) throw errorRelacion;

      resultados.push({
        nombre: perfil.nombre,
        correo,
        id: cuenta.id,
      });
    }

    return new Response(
      JSON.stringify({
        mensaje: 'Barberos creados y relacionados correctamente.',
        barberos: resultados,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || 'Error al crear los barberos.',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
