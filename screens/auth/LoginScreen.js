import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CampoTexto from '../../components/CampoTexto';
import Boton from '../../components/Boton';
import { iniciarSesion as iniciarSesionAuth } from '../../services/authService';
import { supabase } from '../../services/supabase';
import { useUsuario } from '../../context/UsuarioContext';

export default function LoginScreen({ navigation }) {
  const { setUsuario } = useUsuario();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const [errores, setErrores] = useState({
    correo: '',
    password: '',
    general: '',
  });

  function limpiarError(campo) {
    setErrores((prev) => ({
      ...prev,
      [campo]: '',
      general: '',
    }));
  }

  async function iniciarSesion() {
    if (cargando) return;

    const correoLimpio = correo.trim().toLowerCase();

    const nuevosErrores = {
      correo: '',
      password: '',
      general: '',
    };

    if (!correoLimpio) {
      nuevosErrores.correo = 'Ingresa tu correo electrónico.';
    } else {
      const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!formatoCorreo.test(correoLimpio)) {
        nuevosErrores.correo = 'Ingresa un correo electrónico válido.';
      }
    }

    if (!password) {
      nuevosErrores.password = 'Ingresa tu contraseña.';
    }

    if (nuevosErrores.correo || nuevosErrores.password) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      setCargando(true);
      setErrores({
        correo: '',
        password: '',
        general: '',
      });

      // Iniciar sesión mediante Supabase Auth.
      const data = await iniciarSesionAuth(correoLimpio, password);

      if (!data.session || !data.user) {
        setErrores({
          correo: '',
          password: '',
          general: 'Debes confirmar tu correo electrónico antes de iniciar sesión.',
        });
        return;
      }

      // Obtener el perfil del usuario autenticado.
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('id, nombre, correo, telefono, rol, activo')
        .eq('id', data.user.id)
        .maybeSingle();

      if (error) throw error;

      if (!usuario) {
        await supabase.auth.signOut();

        setErrores({
          correo: '',
          password: '',
          general: 'No se encontró el perfil asociado a esta cuenta.',
        });
        return;
      }

      if (usuario.activo === false) {
        await supabase.auth.signOut();

        setErrores({
          correo: '',
          password: '',
          general: 'Tu cuenta se encuentra inactiva. Contacta con el administrador.',
        });
        return;
      }

      // Guardar el usuario autenticado.
      setUsuario(usuario);

      // Redirigir según el rol.
      if (usuario.rol === 'cliente') {
        navigation.replace('ClienteTabs');
      } else if (usuario.rol === 'barbero') {
        navigation.replace('BarberoStack');
      } else if (
        usuario.rol === 'administrador' ||
        usuario.rol === 'admin'
      ) {
        navigation.replace('AdministradorStack');
      } else {
        await supabase.auth.signOut();
        setUsuario(null);

        setErrores({
          correo: '',
          password: '',
          general: 'El tipo de usuario no es válido.',
        });
      }
    } catch (error) {
      const mensaje = error.message?.toLowerCase() || '';

      if (
        mensaje.includes('invalid login credentials') ||
        mensaje.includes('invalid_credentials') ||
        mensaje.includes('invalid email or password') ||
        mensaje.includes('user not found')
      ) {
        setErrores({
          correo: '',
          password: 'Correo o contraseña incorrectos. Verifica tus datos.',
          general: '',
        });
      } else {
        setErrores({
          correo: '',
          password: '',
          general: 'No se pudo iniciar sesión. Comprueba tu conexión e inténtalo nuevamente.',
        });
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={styles.areaSegura} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.teclado}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.contenedor}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formulario}>
            <Text style={styles.marca}>BARBER HOUSE</Text>

            <Text style={styles.titulo}>Bienvenido</Text>
            <Text style={styles.subtitulo}>
              Ingresa a tu cuenta para continuar.
            </Text>

            <CampoTexto
              etiqueta="Correo electrónico"
              valor={correo}
              cambiarValor={(valor) => {
                setCorreo(valor);
                limpiarError('correo');
              }}
              placeholder="ejemplo@correo.com"
              teclado="email-address"
              error={errores.correo}
            />

            <CampoTexto
              etiqueta="Contraseña"
              valor={password}
              cambiarValor={(valor) => {
                setPassword(valor);
                limpiarError('password');
              }}
              placeholder="Ingresa tu contraseña"
              seguro
              mostrarOjo
              error={errores.password}
            />

            {errores.general ? (
              <Text style={styles.errorGeneral}>
                {errores.general}
              </Text>
            ) : null}

            <Boton
              titulo={cargando ? 'INICIANDO SESIÓN...' : 'INICIAR SESIÓN'}
              onPress={iniciarSesion}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('Registro')}
              style={styles.enlaceContenedor}
            >
              <Text style={styles.enlace}>
                ¿No tienes una cuenta?{' '}
                <Text style={styles.naranja}>Regístrate</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.pie}>
            BARBER HOUSE · Estilo y cuidado personal
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: '#171717',
  },
  teclado: {
    flex: 1,
  },
  contenedor: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 25,
  },
  formulario: {
    width: '100%',
  },
  marca: {
    color: '#F28C28',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 18,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitulo: {
    color: '#BDBDBD',
    fontSize: 15,
    marginBottom: 35,
  },
  errorGeneral: {
    color: '#FF5252',
    fontSize: 13,
    lineHeight: 19,
    marginTop: -3,
    marginBottom: 15,
  },
  enlaceContenedor: {
    paddingVertical: 18,
  },
  enlace: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 5,
  },
  naranja: {
    color: '#F28C28',
    fontWeight: 'bold',
  },
  pie: {
    color: '#777777',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 25,
  },
});
