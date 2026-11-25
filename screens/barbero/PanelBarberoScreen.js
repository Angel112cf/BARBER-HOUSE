import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useUsuario } from '../../context/UsuarioContext';

// Imágenes de BARBER HOUSE.
const logo = require('../../assets/logo.png');
const imagenAgenda = require('../../assets/agenda.png');
const imagenGanancias = require('../../assets/ganancias.png');

export default function PanelBarberoScreen({ navigation }) {
  const { setUsuario } = useUsuario();

  const [nombre, setNombre] = useState('');
  const [cargando, setCargando] = useState(true);

  // Obtener el perfil del barbero autenticado.
  const cargarPerfil = async () => {
    try {
      const { data: usuario, error: errorUsuario } =
        await supabase.auth.getUser();

      if (errorUsuario) throw errorUsuario;

      if (!usuario.user) {
        throw new Error('No se encontró una sesión activa.');
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, correo, telefono, rol, activo')
        .eq('id', usuario.user.id)
        .single();

      if (error) throw error;

      if (data.rol !== 'barbero' || !data.activo) {
        throw new Error('Esta cuenta no tiene acceso al panel de barbero.');
      }

      setNombre(data.nombre);
      setUsuario(data);
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      Alert.alert(
        'Error',
        error.message || 'No se pudo cargar el perfil.'
      );
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      const cargar = async () => {
        if (activo) {
          await cargarPerfil();
        }
      };

      cargar();

      return () => {
        activo = false;
      };
    }, [])
  );

  // Cerrar la sesión del barbero.
  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Deseas salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();

              if (error) throw error;

              setUsuario(null);

              navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert(
                'Error',
                'No se pudo cerrar la sesión.'
              );
            }
          },
        },
      ]
    );
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#F28C28" />
        <Text style={styles.cargando}>Cargando panel...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
      showsVerticalScrollIndicator={false}
    >
      {/* Presentación de la empresa. */}
      <View style={styles.encabezado}>
        <View style={styles.logoContenedor}>
          <Image
            source={logo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.marca}>BARBER HOUSE</Text>
        <Text style={styles.etiqueta}>PANEL DEL BARBERO</Text>

        <View style={styles.lineaNaranja} />
      </View>

      {/* Bienvenida al barbero. */}
      <View style={styles.bienvenida}>
        <Text style={styles.saludo}>BIENVENIDO</Text>

        <Text style={styles.nombre}>{nombre}</Text>

        <Text style={styles.descripcion}>
          Administra tus citas y consulta tus ganancias.
        </Text>
      </View>

      {/* Acceso a la agenda. */}
      <TouchableOpacity
        style={styles.tarjeta}
        onPress={() => navigation.navigate('AgendaBarbero')}
        activeOpacity={0.85}
      >
        <View style={styles.imagenContenedor}>
          <Image
            source={imagenAgenda}
            style={styles.imagenTarjeta}
            resizeMode="contain"
          />
        </View>

        <View style={styles.contenidoTarjeta}>
          <Text style={styles.tituloTarjeta}>Mi agenda</Text>

          <Text style={styles.descripcionTarjeta}>
            Consulta tus próximas citas y los datos de cada cliente.
          </Text>
        </View>

        <Text style={styles.flecha}>›</Text>
      </TouchableOpacity>

      {/* Acceso a las ganancias. */}
      <TouchableOpacity
        style={styles.tarjeta}
        onPress={() => navigation.navigate('HistorialBarbero')}
        activeOpacity={0.85}
      >
        <View style={styles.imagenContenedor}>
          <Image
            source={imagenGanancias}
            style={styles.imagenTarjeta}
            resizeMode="contain"
          />
        </View>

        <View style={styles.contenidoTarjeta}>
          <Text style={styles.tituloTarjeta}>Mis ganancias</Text>

          <Text style={styles.descripcionTarjeta}>
            Consulta tus servicios realizados y el dinero que has ganado.
          </Text>
        </View>

        <Text style={styles.flecha}>›</Text>
      </TouchableOpacity>

      {/* Información sobre las ganancias. */}
      <View style={styles.nota}>
        <Text style={styles.notaTitulo}>TU TRABAJO, TUS GANANCIAS</Text>

        <Text style={styles.notaTexto}>
          Recuerda que recibes el 70% del valor de cada servicio realizado.
        </Text>
      </View>

      {/* Cerrar sesión. */}
      <TouchableOpacity
        style={styles.botonSalir}
        onPress={cerrarSesion}
        activeOpacity={0.8}
      >
        <Text style={styles.textoSalir}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={styles.pie}>
        BARBER HOUSE · ESTILO Y PROFESIONALISMO
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#1f1f1f',
  },
  contenido: {
    paddingHorizontal: 22,
    paddingTop: 25,
    paddingBottom: 35,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
  },
  cargando: {
    color: '#FFFFFF',
    marginTop: 12,
  },

  // Encabezado de la empresa.
  encabezado: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContenedor: {
    width: 115,
    height: 115,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  marca: {
    color: '#F28C28',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
  },
  etiqueta: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: 8,
  },
  lineaNaranja: {
    width: 55,
    height: 3,
    backgroundColor: '#F28C28',
    borderRadius: 5,
    marginTop: 17,
  },

  // Bienvenida.
  bienvenida: {
    marginBottom: 25,
  },
  saludo: {
    color: '#F28C28',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  nombre: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
    marginTop: 6,
  },
  descripcion: {
    color: '#A6A6A6',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 21,
  },

  // Tarjetas principales.
  tarjeta: {
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#39312A',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    minHeight: 112,
  },
  imagenContenedor: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#303030',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    padding: 8,
  },
  imagenTarjeta: {
    width: '100%',
    height: '100%',
  },
  contenidoTarjeta: {
    flex: 1,
  },
  tituloTarjeta: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  descripcionTarjeta: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  flecha: {
    color: '#F28C28',
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 5,
  },

  // Nota de ganancias.
  nota: {
    backgroundColor: '#292019',
    borderWidth: 1,
    borderColor: '#603B20',
    borderRadius: 13,
    padding: 16,
    marginTop: 7,
  },
  notaTitulo: {
    color: '#F28C28',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
  notaTexto: {
    color: '#E0D0C0',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },

  // Cierre de sesión.
  botonSalir: {
    borderWidth: 1,
    borderColor: '#8f0000',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 25,
  },
  textoSalir: {
    color: '#9b0000',
    fontWeight: '800',
    fontSize: 14,
  },
  pie: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 25,
  },
});
