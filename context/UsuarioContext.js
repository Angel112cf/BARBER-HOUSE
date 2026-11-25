import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const UsuarioContext = createContext(null);

// Mantener los datos del usuario autenticado.
export function UsuarioProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    let solicitudActual = 0;

    // Obtener el perfil desde la tabla usuarios.
    async function cargarPerfil(idUsuario, numeroSolicitud) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, correo, telefono, rol, activo')
        .eq('id', idUsuario)
        .maybeSingle();

      if (!activo || numeroSolicitud !== solicitudActual) {
        return;
      }

      if (error) {
        console.error('Error al cargar el perfil:', error.message);
        setUsuario(null);
      } else {
        setUsuario(data);
      }

      setCargando(false);
    }

    // Escuchar los cambios de autenticación.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (evento, session) => {
        const numeroSolicitud = ++solicitudActual;

        if (session?.user) {
          setCargando(true);

          // Consultar el perfil después de finalizar el evento.
          Promise.resolve().then(() => {
            cargarPerfil(session.user.id, numeroSolicitud);
          });
        } else {
          setUsuario(null);
          setCargando(false);
        }
      }
    );

    return () => {
      activo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UsuarioContext.Provider
      value={{ usuario, setUsuario, cargando }}
    >
      {children}
    </UsuarioContext.Provider>
  );
}

// Permitir que las pantallas accedan al usuario autenticado.
export function useUsuario() {
  const contexto = useContext(UsuarioContext);

  if (!contexto) {
    throw new Error(
      'useUsuario debe utilizarse dentro de UsuarioProvider.'
    );
  }

  return contexto;
}
