import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { obtenerAgendaPorBarbero } from '../../services/reservaService';

export default function AgendaBarberoScreen({ navigation }) {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [filtro, setFiltro] = useState('todas');
  const [busqueda, setBusqueda] = useState('');

  const filtros = [
    { id: 'hoy', nombre: 'Hoy' },
    { id: 'pendientes', nombre: 'Pendientes' },
    { id: 'canceladas', nombre: 'Canceladas' },
    { id: 'realizadas', nombre: 'Realizadas' },
    { id: 'todas', nombre: 'Todas' },
  ];

  // Obtener la fecha actual en formato YYYY-MM-DD.
  const obtenerFechaHoy = () => {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  };

  // Recuperar la fotografía privada de un corte personalizado.
  const obtenerFotoReferencia = async (reservaId) => {
    try {
      const { data: archivos, error } = await supabase.storage
        .from('referencias-reservas')
        .list(reservaId);

      if (error) throw error;

      const archivo = (archivos || []).find(
        (item) => item.name && !item.name.startsWith('.')
      );

      if (!archivo) return null;

      const { data, error: errorUrl } = await supabase.storage
        .from('referencias-reservas')
        .createSignedUrl(
          `${reservaId}/${archivo.name}`,
          3600
        );

      if (errorUrl) throw errorUrl;

      return data.signedUrl;
    } catch (error) {
      console.error('Error al obtener referencia:', error);
      return null;
    }
  };

  // Consultar todas las citas del barbero autenticado.
  const cargarAgenda = async () => {
    try {
      const { data: usuario, error } = await supabase.auth.getUser();

      if (error) throw error;

      if (!usuario.user) {
        throw new Error('No se encontró una sesión activa.');
      }

      const datos = await obtenerAgendaPorBarbero(usuario.user.id);

      // Recuperar las fotografías privadas de los cortes personalizados.
      const reservasConImagenes = await Promise.all(
        datos.map(async (reserva) => {
          if (reserva.corte_personalizado) {
            const foto = await obtenerFotoReferencia(reserva.id);

            return {
              ...reserva,
              imagen_mostrar: foto,
            };
          }

          return {
            ...reserva,
            imagen_mostrar: reserva.imagen_url,
          };
        })
      );

      setReservas(reservasConImagenes);
    } catch (error) {
      console.error('Error al cargar agenda:', error);
      Alert.alert('Error', error.message || 'No se pudo cargar la agenda.');
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarAgenda();
    }, [])
  );

  const actualizar = () => {
    setActualizando(true);
    cargarAgenda();
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';

    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  };

  // Aplicar el filtro seleccionado y el texto de búsqueda.
  const reservasFiltradas = reservas.filter((item) => {
    let coincideFiltro = true;

    if (filtro === 'hoy') {
      coincideFiltro = item.fecha === obtenerFechaHoy();
    } else if (filtro === 'pendientes') {
      coincideFiltro = item.estado === 'pendiente de realizar';
    } else if (filtro === 'canceladas') {
      coincideFiltro = item.estado === 'cancelada';
    } else if (filtro === 'realizadas') {
      coincideFiltro = item.estado === 'realizada';
    }

    if (!coincideFiltro) return false;

    const texto = busqueda.trim().toLowerCase();

    if (!texto) return true;

    const nombreCliente = (item.cliente || '').toLowerCase();
    const correoCliente = (item.correo_cliente || '').toLowerCase();
    const fechaNormal = formatearFecha(item.fecha).toLowerCase();
    const fechaOriginal = (item.fecha || '').toLowerCase();

    return (
      nombreCliente.includes(texto) ||
      correoCliente.includes(texto) ||
      fechaNormal.includes(texto) ||
      fechaOriginal.includes(texto)
    );
  });

  // Mostrar el estado real de cada cita.
  const obtenerEstado = (estado) => {
    if (estado === 'realizada') {
      return {
        nombre: 'Realizada',
        contenedor: styles.estadoRealizada,
        texto: styles.textoRealizada,
      };
    }

    if (estado === 'cancelada') {
      return {
        nombre: 'Cancelada',
        contenedor: styles.estadoCancelada,
        texto: styles.textoCancelada,
      };
    }

    return {
      nombre: 'Pendiente',
      contenedor: styles.estadoPendiente,
      texto: styles.textoPendiente,
    };
  };

  const mostrarReserva = ({ item }) => {
    const estado = obtenerEstado(item.estado);

    return (
      <TouchableOpacity
        style={styles.tarjeta}
        onPress={() =>
          navigation.navigate('DetalleReservaBarbero', {
            reservaId: item.id,
          })
        }
        activeOpacity={0.85}
      >
        <View style={styles.filaSuperior}>
          <Text style={styles.fecha}>
            {formatearFecha(item.fecha)}
          </Text>

          <View style={[styles.estado, estado.contenedor]}>
            <Text style={[styles.estadoTexto, estado.texto]}>
              {estado.nombre}
            </Text>
          </View>
        </View>

        <View style={styles.contenidoServicio}>
          <View style={styles.imagenContenedor}>
            {item.imagen_mostrar ? (
              <Image
                source={{ uri: item.imagen_mostrar }}
                style={styles.imagenCorte}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.sinImagen}>
                <Text style={styles.iconoImagen}>✂</Text>
              </View>
            )}
          </View>

          <View style={styles.infoServicio}>
            <Text style={styles.tipoCorte}>
              {item.corte_personalizado
                ? 'CORTE PERSONALIZADO'
                : 'CORTE SELECCIONADO'}
            </Text>

            <Text style={styles.servicio}>
              {item.servicio}
            </Text>

            <Text style={styles.cliente}>
              {item.cliente}
            </Text>

            {!!item.correo_cliente && (
              <Text style={styles.correoCliente}>
                {item.correo_cliente}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.separador} />

        <View style={styles.filaDato}>
          <Text style={styles.etiquetaDato}>HORA</Text>
          <Text style={styles.valorDato}>
            {item.hora?.slice(0, 5) || 'No disponible'}
          </Text>
        </View>

        <View style={styles.filaDato}>
          <Text style={styles.etiquetaDato}>MODALIDAD</Text>
          <Text style={styles.valorDato}>
            {item.modalidad}
          </Text>
        </View>

        {item.incluye_barba && (
          <View style={styles.filaDato}>
            <Text style={styles.etiquetaDato}>SERVICIO EXTRA</Text>
            <Text style={styles.valorDato}>Incluye barba</Text>
          </View>
        )}

        <View style={styles.pieTarjeta}>
          <Text style={styles.precio}>
            Bs {Number(item.precio).toFixed(2)}
          </Text>

          <Text style={styles.verDetalle}>
            Ver detalles →
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#F28C28" />
        <Text style={styles.textoCargando}>
          Cargando agenda...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Text style={styles.marca}>BARBER HOUSE</Text>
        <Text style={styles.titulo}>Mi agenda</Text>
        <Text style={styles.subtitulo}>
          Organiza tus citas y revisa los detalles de cada cliente.
        </Text>

        <View style={styles.resumenAgenda}>
          <Text style={styles.numeroReservas}>
            {reservasFiltradas.length}
          </Text>

          <Text style={styles.textoReservas}>
            {reservasFiltradas.length === 1
              ? 'CITA ENCONTRADA'
              : 'CITAS ENCONTRADAS'}
          </Text>
        </View>
      </View>

      <TextInput
        style={styles.buscador}
        placeholder="Buscar por fecha, nombre o correo..."
        placeholderTextColor="#858585"
        value={busqueda}
        onChangeText={setBusqueda}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.contenedorFiltros}
        contentContainerStyle={styles.filtros}
      >
        {filtros.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.botonFiltro,
              filtro === item.id && styles.botonFiltroActivo,
            ]}
            onPress={() => setFiltro(item.id)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.textoFiltro,
                filtro === item.id && styles.textoFiltroActivo,
              ]}
            >
              {item.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={reservasFiltradas}
        keyExtractor={(item) => String(item.id)}
        renderItem={mostrarReserva}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
            tintColor="#F28C28"
            colors={['#F28C28']}
          />
        }
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Text style={styles.iconoVacio}>✂</Text>

            <Text style={styles.textoVacio}>
              No se encontraron citas.
            </Text>

            <Text style={styles.descripcionVacio}>
              Prueba con otro filtro o modifica tu búsqueda.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#111111',
    paddingHorizontal: 20,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
  },
  textoCargando: {
    color: '#FFFFFF',
    marginTop: 12,
  },
  encabezado: {
    paddingTop: 20,
    paddingBottom: 15,
  },
  marca: {
    color: '#F28C28',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 8,
  },
  subtitulo: {
    color: '#A6A6A6',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  resumenAgenda: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#292019',
    borderColor: '#603B20',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  numeroReservas: {
    color: '#F28C28',
    fontSize: 23,
    fontWeight: '900',
    marginRight: 10,
  },
  textoReservas: {
    color: '#E0D0C0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  buscador: {
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#39312A',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 13,
  },
  contenedorFiltros: {
    height: 48,
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 15,
  },
  filtros: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 5,
  },
  botonFiltro: {
    width: 100,
    height: 40,
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#39312A',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonFiltroActivo: {
    backgroundColor: '#F28C28',
    borderColor: '#F28C28',
  },
  textoFiltro: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    includeFontPadding: false,
  },
  textoFiltroActivo: {
    color: '#111111',
  },
  lista: {
    paddingBottom: 30,
    flexGrow: 1,
  },
  tarjeta: {
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#39312A',
  },
  filaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  fecha: {
    color: '#F28C28',
    fontSize: 13,
    fontWeight: '900',
  },
  estado: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },
  estadoPendiente: {
    backgroundColor: '#38271A',
  },
  estadoRealizada: {
    backgroundColor: '#173A27',
  },
  estadoCancelada: {
    backgroundColor: '#402020',
  },
  estadoTexto: {
    fontSize: 10,
    fontWeight: '900',
  },
  textoPendiente: {
    color: '#F5A65D',
  },
  textoRealizada: {
    color: '#65D995',
  },
  textoCancelada: {
    color: '#F07878',
  },
  contenidoServicio: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagenContenedor: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#29221C',
    marginRight: 14,
  },
  imagenCorte: {
    width: '100%',
    height: '100%',
  },
  sinImagen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconoImagen: {
    color: '#F28C28',
    fontSize: 34,
  },
  infoServicio: {
    flex: 1,
  },
  tipoCorte: {
    color: '#F28C28',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  servicio: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  cliente: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 7,
  },
  correoCliente: {
    color: '#858585',
    fontSize: 10,
    marginTop: 4,
  },
  separador: {
    height: 1,
    backgroundColor: '#393939',
    marginVertical: 15,
  },
  filaDato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  etiquetaDato: {
    color: '#999999',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  valorDato: {
    color: '#F1F1F1',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  pieTarjeta: {
    borderTopWidth: 1,
    borderTopColor: '#393939',
    marginTop: 5,
    paddingTop: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  precio: {
    color: '#F28C28',
    fontSize: 20,
    fontWeight: '900',
  },
  verDetalle: {
    color: '#F28C28',
    fontSize: 12,
    fontWeight: '900',
  },
  vacio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 70,
  },
  iconoVacio: {
    fontSize: 48,
    color: '#F28C28',
    marginBottom: 15,
  },
  textoVacio: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  descripcionVacio: {
    color: '#999999',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
