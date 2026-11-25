import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUsuario } from '../../context/UsuarioContext';
import {
  obtenerReservasPorCliente,
  cancelarReserva,
} from '../../services/reservaService';

export default function ReservasScreen() {
  const { usuario } = useUsuario();

  const [reservas, setReservas] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const cargarReservas = async () => {
    if (!usuario?.id) {
      setReservas([]);
      setCargando(false);
      setError(true);
      return;
    }

    try {
      setCargando(true);
      setError(false);

      const resultado = await obtenerReservasPorCliente(usuario.id);
      setReservas(resultado);
    } catch (error) {
      console.error('ERROR AL CARGAR RESERVAS:', error);
      setError(true);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarReservas();
    }, [usuario?.id])
  );

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';

    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  };

  const obtenerEstado = (estado) => {
    if (estado === 'realizada') return 'Realizada';
    if (estado === 'cancelada') return 'Cancelada';
    return 'Pendiente';
  };

  const confirmarCancelacion = (reserva) => {
    Alert.alert(
      'Cancelar reserva',
      `¿Estás seguro de que deseas cancelar tu cita del ${formatearFecha(reserva.fecha)} a las ${String(reserva.hora).substring(0, 5)}?`,
      [
        {
          text: 'Volver',
          style: 'cancel',
        },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const cancelada = await cancelarReserva(
                reserva.id,
                usuario.id
              );

              if (cancelada) {
                Alert.alert(
                  'Reserva cancelada',
                  'Tu reserva se canceló correctamente.'
                );
              } else {
                Alert.alert(
                  'No se pudo cancelar',
                  'La reserva ya no está pendiente o no te pertenece.'
                );
              }

              await cargarReservas();
            } catch (error) {
              console.error('ERROR AL CANCELAR RESERVA:', error);

              Alert.alert(
                'Error',
                'No se pudo cancelar la reserva. Inténtalo nuevamente.'
              );
            }
          },
        },
      ]
    );
  };

  const reservasFiltradas = reservas.filter((reserva) => {
    if (filtro === 'todas') return true;

    if (filtro === 'pendientes') {
      return reserva.estado === 'pendiente de realizar';
    }

    if (filtro === 'realizadas') {
      return reserva.estado === 'realizada';
    }

    if (filtro === 'canceladas') {
      return reserva.estado === 'cancelada';
    }

    return true;
  });

  const filtros = [
    { valor: 'todas', texto: 'Todas' },
    { valor: 'pendientes', texto: 'Pendientes' },
    { valor: 'realizadas', texto: 'Realizadas' },
    { valor: 'canceladas', texto: 'Canceladas' },
  ];

  return (
    <SafeAreaView
      style={styles.areaSegura}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.encabezado}>
          <Text style={styles.marca}>BARBER HOUSE</Text>

          <Text style={styles.titulo}>Mis citas</Text>

          <Text style={styles.descripcion}>
            Consulta tus citas y administra tus reservas.
          </Text>
        </View>

        <View style={styles.seccionFiltros}>
          <Text style={styles.tituloSeccion}>Mis reservas</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtros}
            contentContainerStyle={styles.contenidoFiltros}
          >
            {filtros.map((item) => (
              <TouchableOpacity
                key={item.valor}
                style={[
                  styles.botonFiltro,
                  filtro === item.valor && styles.filtroActivo,
                ]}
                onPress={() => setFiltro(item.valor)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.textoFiltro,
                    filtro === item.valor && styles.textoFiltroActivo,
                  ]}
                >
                  {item.texto}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {cargando ? (
          <View style={styles.estadoContenedor}>
            <ActivityIndicator size="large" color="#F28C28" />
            <Text style={styles.textoEstadoPantalla}>
              Cargando tus reservas...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.vacio}>
            <Text style={styles.iconoVacio}>!</Text>

            <Text style={styles.tituloVacio}>
              No se pudieron cargar tus citas
            </Text>

            <Text style={styles.textoVacio}>
              Comprueba tu conexión e inténtalo nuevamente.
            </Text>

            <TouchableOpacity
              style={styles.botonReintentar}
              onPress={cargarReservas}
              activeOpacity={0.8}
            >
              <Text style={styles.textoBotonReintentar}>
                REINTENTAR
              </Text>
            </TouchableOpacity>
          </View>
        ) : reservasFiltradas.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.iconoVacio}>▣</Text>

            <Text style={styles.tituloVacio}>
              No tienes reservas
            </Text>

            <Text style={styles.textoVacio}>
              {filtro === 'todas'
                ? 'Cuando programes una cita aparecerá aquí.'
                : 'No hay reservas disponibles en esta categoría.'}
            </Text>
          </View>
        ) : (
          reservasFiltradas.map((reserva) => (
            <View style={styles.tarjeta} key={reserva.id}>
              <View style={styles.encabezadoTarjeta}>
                <View style={styles.infoServicio}>
                  <Text style={styles.etiquetaTarjeta}>
                    SERVICIO
                  </Text>

                  <Text style={styles.servicio}>
                    {reserva.servicio}
                  </Text>
                </View>

                <View
                  style={[
                    styles.estado,
                    reserva.estado === 'realizada' && styles.estadoRealizada,
                    reserva.estado === 'cancelada' && styles.estadoCancelada,
                  ]}
                >
                  <Text style={styles.textoEstado}>
                    {obtenerEstado(reserva.estado)}
                  </Text>
                </View>
              </View>

              <View style={styles.separador} />

              <View style={styles.datos}>
                <View style={styles.filaDato}>
                  <Text style={styles.iconoDato}>✂</Text>
                  <View style={styles.contenidoDato}>
                    <Text style={styles.etiquetaDato}>Barbero</Text>
                    <Text style={styles.dato}>
                      {reserva.barbero_nombre}
                    </Text>
                  </View>
                </View>

                <View style={styles.filaDato}>
                  <Text style={styles.iconoDato}>▦</Text>
                  <View style={styles.contenidoDato}>
                    <Text style={styles.etiquetaDato}>Fecha</Text>
                    <Text style={styles.dato}>
                      {formatearFecha(reserva.fecha)}
                    </Text>
                  </View>
                </View>

                <View style={styles.filaDato}>
                  <Text style={styles.iconoDato}>◷</Text>
                  <View style={styles.contenidoDato}>
                    <Text style={styles.etiquetaDato}>Hora</Text>
                    <Text style={styles.dato}>
                      {String(reserva.hora).substring(0, 5)}
                    </Text>
                  </View>
                </View>

                <View style={styles.filaDato}>
                  <Text style={styles.iconoDato}>⌖</Text>
                  <View style={styles.contenidoDato}>
                    <Text style={styles.etiquetaDato}>Modalidad</Text>
                    <Text style={styles.dato}>
                      {reserva.modalidad === 'domicilio'
                        ? 'A domicilio'
                        : 'En local'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.filaPrecio}>
                <View>
                  <Text style={styles.etiquetaPrecio}>TOTAL A PAGAR</Text>
                  <Text style={styles.precio}>
                    Bs. {Number(reserva.precio).toFixed(2)}
                  </Text>
                </View>

                <Text style={styles.moneda}>BOB</Text>
              </View>

              {reserva.estado === 'pendiente de realizar' && (
                <TouchableOpacity
                  style={styles.botonCancelar}
                  onPress={() => confirmarCancelacion(reserva)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.textoBotonCancelar}>
                    CANCELAR RESERVA
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: '#171717',
  },
  contenido: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 40,
  },
  encabezado: {
    marginBottom: 27,
  },
  marca: {
    color: '#F28C28',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 9,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: 'bold',
    marginBottom: 7,
  },
  descripcion: {
    color: '#AAAAAA',
    fontSize: 14,
    lineHeight: 21,
  },
  seccionFiltros: {
    marginBottom: 22,
  },
  tituloSeccion: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 13,
  },
  filtros: {
    flexGrow: 0,
  },
  contenidoFiltros: {
    paddingRight: 10,
  },
  botonFiltro: {
    backgroundColor: '#292929',
    borderWidth: 1,
    borderColor: '#383838',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    marginRight: 9,
  },
  filtroActivo: {
    backgroundColor: '#F28C28',
    borderColor: '#F28C28',
  },
  textoFiltro: {
    color: '#CCCCCC',
    fontSize: 13,
    fontWeight: '600',
  },
  textoFiltroActivo: {
    color: '#171717',
    fontWeight: 'bold',
  },
  estadoContenedor: {
    alignItems: 'center',
    marginTop: 55,
  },
  textoEstadoPantalla: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 14,
  },
  vacio: {
    backgroundColor: '#292929',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#383838',
    padding: 28,
    alignItems: 'center',
    marginTop: 10,
  },
  iconoVacio: {
    color: '#F28C28',
    fontSize: 38,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tituloVacio: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  textoVacio: {
    color: '#AAAAAA',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },
  botonReintentar: {
    backgroundColor: '#F28C28',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 9,
    marginTop: 18,
  },
  textoBotonReintentar: {
    color: '#171717',
    fontSize: 13,
    fontWeight: 'bold',
  },
  tarjeta: {
    backgroundColor: '#292929',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#383838',
    padding: 17,
    marginBottom: 16,
  },
  encabezadoTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  infoServicio: {
    flex: 1,
  },
  etiquetaTarjeta: {
    color: '#888888',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  servicio: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  estado: {
    backgroundColor: '#66501F',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  estadoRealizada: {
    backgroundColor: '#245A38',
  },
  estadoCancelada: {
    backgroundColor: '#692D2D',
  },
  textoEstado: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  separador: {
    height: 1,
    backgroundColor: '#444444',
    marginVertical: 16,
  },
  datos: {
    gap: 15,
  },
  filaDato: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoDato: {
    color: '#F28C28',
    fontSize: 20,
    width: 34,
    textAlign: 'center',
  },
  contenidoDato: {
    flex: 1,
    marginLeft: 8,
  },
  etiquetaDato: {
    color: '#888888',
    fontSize: 11,
    marginBottom: 3,
  },
  dato: {
    color: '#EEEEEE',
    fontSize: 14,
    fontWeight: '500',
  },
  filaPrecio: {
    borderTopWidth: 1,
    borderTopColor: '#444444',
    paddingTop: 15,
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etiquetaPrecio: {
    color: '#AAAAAA',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 5,
  },
  precio: {
    color: '#F28C28',
    fontSize: 22,
    fontWeight: 'bold',
  },
  moneda: {
    color: '#888888',
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: '#383838',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  botonCancelar: {
    borderWidth: 1,
    borderColor: '#D9534F',
    borderRadius: 9,
    padding: 13,
    alignItems: 'center',
    marginTop: 17,
    backgroundColor: '#3A2424',
  },
  textoBotonCancelar: {
    color: '#FF7777',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
