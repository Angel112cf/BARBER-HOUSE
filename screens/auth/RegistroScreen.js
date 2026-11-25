import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CampoTexto from '../../components/CampoTexto';
import Boton from '../../components/Boton';
import { registrarCliente } from '../../services/authService';

export default function RegistroScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [registrando, setRegistrando] = useState(false);

  const [errores, setErrores] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    password: '',
    confirmarPassword: '',
    general: '',
  });

  function limpiarError(campo) {
    setErrores((prev) => ({
      ...prev,
      [campo]: '',
      general: '',
    }));
  }

  async function registrarCuenta() {
    if (registrando) return;

    const nombreLimpio = nombre.trim();
    const correoLimpio = correo.trim().toLowerCase();
    const telefonoLimpio = telefono.trim();

    const nuevosErrores = {
      nombre: '',
      correo: '',
      telefono: '',
      password: '',
      confirmarPassword: '',
      general: '',
    };

    // Validar nombre.
    if (!nombreLimpio) {
      nuevosErrores.nombre = 'Ingresa tu nombre completo.';
    } else if (nombreLimpio.length < 3) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres.';
    }

    // Validar correo.
    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoLimpio) {
      nuevosErrores.correo = 'Ingresa tu correo electrónico.';
    } else if (!formatoCorreo.test(correoLimpio)) {
      nuevosErrores.correo = 'Ingresa un correo electrónico válido.';
    }

    // Validar celular boliviano.
    if (!telefonoLimpio) {
      nuevosErrores.telefono = 'Ingresa tu número de celular.';
    } else if (!/^[67]\d{7}$/.test(telefonoLimpio)) {
      nuevosErrores.telefono = 'Ingresa 8 dígitos que comiencen con 6 o 7.';
    }

    // Validar contraseña.
    if (!password) {
      nuevosErrores.password = 'Ingresa una contraseña.';
    } else if (password.length < 6) {
      nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres.';
    }

    // Validar confirmación.
    if (!confirmarPassword) {
      nuevosErrores.confirmarPassword = 'Confirma tu contraseña.';
    } else if (password !== confirmarPassword) {
      nuevosErrores.confirmarPassword = 'Las contraseñas no coinciden.';
    }

    const formularioInvalido = Object.values(nuevosErrores).some(
      (error) => error !== ''
    );

    if (formularioInvalido) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      setRegistrando(true);
      setErrores({
        nombre: '',
        correo: '',
        telefono: '',
        password: '',
        confirmarPassword: '',
        general: '',
      });

      // Registrar al cliente mediante Supabase Auth.
      const data = await registrarCliente({
        nombre: nombreLimpio,
        correo: correoLimpio,
        telefono: telefonoLimpio,
        password,
      });

      // Comprobar si Supabase requiere confirmar el correo.
      if (!data.session) {
        Alert.alert(
          'Revisa tu correo',
          'Tu registro fue recibido correctamente. Confirma tu dirección de correo electrónico para poder iniciar sesión.',
          [
            {
              text: 'Continuar',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Registro exitoso',
          'Tu cuenta de cliente ha sido creada correctamente.',
          [
            {
              text: 'Continuar',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      }
    } catch (error) {
      const mensaje = error.message?.toLowerCase() || '';

      // Detectar si el correo ya está registrado.
      if (
        error.code === 'email_exists' ||
        mensaje.includes('already registered') ||
        mensaje.includes('user already registered')
      ) {
        setErrores((prev) => ({
          ...prev,
          correo: 'Ya existe una cuenta asociada a este correo electrónico.',
        }));
      } else {
        setErrores((prev) => ({
          ...prev,
          general: 'No se pudo crear la cuenta. Comprueba tu conexión e inténtalo nuevamente.',
        }));
      }
    } finally {
      setRegistrando(false);
    }
  }

  return (
    <SafeAreaView style={styles.areaSegura} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.teclado}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.fondo}
          contentContainerStyle={styles.contenedor}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.encabezado}>
            <Text style={styles.marca}>BARBER HOUSE</Text>

            <Text style={styles.titulo}>Crear cuenta</Text>

            <Text style={styles.subtitulo}>
              Regístrate para disfrutar de los servicios de BARBER HOUSE.
            </Text>
          </View>

          <View style={styles.formulario}>
            <CampoTexto
              etiqueta="Nombre completo"
              valor={nombre}
              cambiarValor={(valor) => {
                setNombre(valor);
                limpiarError('nombre');
              }}
              placeholder="Ej. Juan Pérez"
              error={errores.nombre}
            />

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
              etiqueta="Número de celular"
              valor={telefono}
              cambiarValor={(valor) => {
                setTelefono(valor.replace(/\D/g, '').slice(0, 8));
                limpiarError('telefono');
              }}
              placeholder="Ej. 71234567"
              teclado="phone-pad"
              error={errores.telefono}
            />

            <CampoTexto
              etiqueta="Contraseña"
              valor={password}
              cambiarValor={(valor) => {
                setPassword(valor);
                limpiarError('password');
                limpiarError('confirmarPassword');
              }}
              placeholder="Mínimo 6 caracteres"
              seguro
              error={errores.password}
            />

            <CampoTexto
              etiqueta="Confirmar contraseña"
              valor={confirmarPassword}
              cambiarValor={(valor) => {
                setConfirmarPassword(valor);
                limpiarError('confirmarPassword');
              }}
              placeholder="Repite tu contraseña"
              seguro
              error={errores.confirmarPassword}
            />

            {errores.general ? (
              <Text style={styles.errorGeneral}>
                {errores.general}
              </Text>
            ) : null}

            <Boton
              titulo={registrando ? 'CREANDO CUENTA...' : 'REGISTRARME'}
              onPress={registrarCuenta}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.enlaceContenedor}
            >
              <Text style={styles.enlace}>
                ¿Ya tienes una cuenta?{' '}
                <Text style={styles.naranja}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.nota}>
            El registro está disponible únicamente para clientes.
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
  fondo: {
    flex: 1,
    backgroundColor: '#171717',
  },
  contenedor: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 30,
  },
  encabezado: {
    marginBottom: 28,
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
    fontSize: 29,
    fontWeight: 'bold',
    marginBottom: 9,
  },
  subtitulo: {
    color: '#BDBDBD',
    fontSize: 15,
    lineHeight: 22,
  },
  formulario: {
    width: '100%',
  },
  errorGeneral: {
    color: '#FF5252',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 15,
  },
  enlaceContenedor: {
    paddingVertical: 15,
  },
  enlace: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
  },
  naranja: {
    color: '#F28C28',
    fontWeight: 'bold',
  },
  nota: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
