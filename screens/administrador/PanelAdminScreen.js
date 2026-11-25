import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUsuario } from '../../context/UsuarioContext';
import { cerrarSesion } from '../../services/authService';

export default function PanelAdminScreen({ navigation }) {
  const { usuario } = useUsuario();
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const opciones = [
    {
      titulo: 'Gestión de usuarios',
      descripcion: 'Administra clientes, barberos y administradores.',
      imagen: require('../../assets/adminuser.png'),
      destino: 'GestionUsuarios',
    },
    {
      titulo: 'Reservas y citas',
      descripcion: 'Consulta y administra las citas del negocio.',
      imagen: require('../../assets/admincitas.png'),
      destino: 'GestionReservas',
    },
    {
      titulo: 'Estadísticas y ganancias',
      descripcion: 'Consulta el rendimiento y los ingresos del negocio.',
      imagen: require('../../assets/adminganacias.png'),
      destino: 'PanelEstadisticas',
    },
  ];

  function confirmarCierreSesion() {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas salir de tu cuenta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: ejecutarCierreSesion,
        },
      ]
    );
  }

  async function ejecutarCierreSesion() {
    try {
      setCerrandoSesion(true);

      await cerrarSesion();

      navigation.getParent()?.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'No se pudo cerrar la sesión.'
      );
    } finally {
      setCerrandoSesion(false);
    }
  }

  return (
    <SafeAreaView style={styles.contenedor} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.encabezado}>
          <Text style={styles.marca}>BARBER HOUSE</Text>
          <View style={styles.lineaNaranja} />

          <Text style={styles.titulo}>Panel de administración</Text>
          <Text style={styles.bienvenida}>
            Bienvenido, {usuario?.nombre || 'Administrador'}
          </Text>
          <Text style={styles.subtitulo}>
            Gestiona y supervisa las operaciones de tu negocio.
          </Text>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>MÓDULOS DE ADMINISTRACIÓN</Text>

          {opciones.map((opcion) => (
            <Pressable
              key={opcion.destino}
              style={({ pressed }) => [
                styles.tarjeta,
                pressed && styles.tarjetaPresionada,
              ]}
              onPress={() => navigation.navigate(opcion.destino)}
            >
              <View style={styles.contenedorImagen}>
                <Image
                  source={opcion.imagen}
                  style={styles.imagen}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.informacionTarjeta}>
                <Text style={styles.tituloTarjeta}>
                  {opcion.titulo}
                </Text>
                <Text style={styles.descripcionTarjeta}>
                  {opcion.descripcion}
                </Text>
              </View>

              <Text style={styles.flecha}>›</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.pie}>
          <Pressable
            style={({ pressed }) => [
              styles.botonCerrar,
              pressed && styles.botonPresionado,
            ]}
            onPress={confirmarCierreSesion}
            disabled={cerrandoSesion}
          >
            {cerrandoSesion ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.textoCerrar}>
                Cerrar sesión
              </Text>
            )}
          </Pressable>

          <Text style={styles.version}>
            BARBER HOUSE · Administración
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#171717',
  },
  contenido: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 20,
  },
  encabezado: {
    marginBottom: 32,
  },
  marca: {
    color: '#F28C28',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  lineaNaranja: {
    width: 42,
    height: 3,
    backgroundColor: '#F28C28',
    marginTop: 12,
    marginBottom: 23,
    borderRadius: 3,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 9,
  },
  bienvenida: {
    color: '#F28C28',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitulo: {
    color: '#A5A5A5',
    fontSize: 14,
    lineHeight: 21,
  },
  seccion: {
    flex: 1,
  },
  tituloSeccion: {
    color: '#888888',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#292929',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#383838',
    padding: 16,
    marginBottom: 14,
    minHeight: 112,
  },
  tarjetaPresionada: {
    backgroundColor: '#35302B',
    borderColor: '#F28C28',
    opacity: 0.9,
  },
  contenedorImagen: {
    width: 65,
    height: 65,
    borderRadius: 12,
    backgroundColor: '#202020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  imagen: {
    width: 48,
    height: 48,
  },
  informacionTarjeta: {
    flex: 1,
  },
  tituloTarjeta: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 7,
  },
  descripcionTarjeta: {
    color: '#A5A5A5',
    fontSize: 12,
    lineHeight: 18,
  },
  flecha: {
    color: '#F28C28',
    fontSize: 30,
    fontWeight: '300',
    marginLeft: 8,
  },
  pie: {
    marginTop: 20,
    alignItems: 'center',
  },
  botonCerrar: {
    width: '100%',
    minHeight: 50,
    backgroundColor: '#292929',
    borderWidth: 1,
    borderColor: '#F28C28',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonPresionado: {
    backgroundColor: '#45301F',
  },
  textoCerrar: {
    color: '#F28C28',
    fontSize: 15,
    fontWeight: 'bold',
  },
  version: {
    color: '#666666',
    fontSize: 11,
    marginTop: 16,
  },
});
