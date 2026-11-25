import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  obtenerTodasLasReservasAdmin,
} from '../../services/reservaAdminService';

import {
  actualizarEstadoReserva,
} from '../../services/reservaService';

export default function GestionReservasScreen({ navigation }) {
  const [reservas, setReservas] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [fechaBusqueda, setFechaBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState(false);
  const [reservaProcesando, setReservaProcesando] = useState(null);

  const cargarReservas = async (refrescar = false) => {
    try {
      if (refrescar) {
        setActualizando(true);
      } else {
        setCargando(true);
      }

      setError(false);

      const resultado = await obtenerTodasLasReservasAdmin();
      setReservas(resultado);
    } catch (error) {
      console.error('ERROR AL CARGAR RESERVAS ADMIN:', error);
      setError(true);
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarReservas();
    }, [])
  );

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';

    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  };

  const formatearHora = (hora) => {
    if (!hora) return 'No disponible';
    return String(hora).substring(0, 5);
  };

  const obtenerEstado = (estado) => {
    if (estado === 'realizada') return 'Realizada';
    if (estado === 'cancelada') return 'Cancelada';
    return 'Pendiente';
  };

  const obtenerFechaActual = () => {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  };

  const reservasFiltradas = reservas.filter((reserva) => {
    if (filtro === 'hoy' && reserva.fecha !== obtenerFechaActual()) {
      return false;
    }

    if (
      filtro === 'pendientes' &&
      reserva.estado !== 'pendiente de realizar'
    ) {
      return false;
    }

    if (filtro === 'realizadas' && reserva.estado !== 'realizada') {
      return false;
    }

    if (filtro === 'canceladas' && reserva.estado !== 'cancelada') {
      return false;
    }

    if (fechaBusqueda.trim()) {
      const fechaReserva = formatearFecha(reserva.fecha)
        .replace(/\D/g, '');

      const fechaIngresada = fechaBusqueda.replace(/\D/g, '');

      if (!fechaReserva.includes(fechaIngresada)) {
        return false;
      }
    }

    return true;
  });

  const filtros = [
    { valor: 'hoy', texto: 'Hoy' },
    { valor: 'todas', texto: 'Todas' },
    { valor: 'pendientes', texto: 'Pendientes' },
    { valor: 'realizadas', texto: 'Realizadas' },
    { valor: 'canceladas', texto: 'Canceladas' },
  ];

  const cantidadPorEstado = (estado) => {
    if (estado === 'todas') return reservas.length;

    if (estado === 'hoy') {
      return reservas.filter(
        (reserva) => reserva.fecha === obtenerFechaActual()
      ).length;
    }

    if (estado === 'pendientes') {
      return reservas.filter(
        (reserva) => reserva.estado === 'pendiente de realizar'
      ).length;
    }

    if (estado === 'realizadas') {
      return reservas.filter(
        (reserva) => reserva.estado === 'realizada'
      ).length;
    }

    if (estado === 'canceladas') {
      return reservas.filter(
        (reserva) => reserva.estado === 'cancelada'
      ).length;
    }

    return 0;
  };

  const confirmarCambioEstado = (reserva, nuevoEstado) => {
    const esRealizada = nuevoEstado === 'realizada';

    Alert.alert(
      esRealizada ? 'Completar cita' : 'Cancelar cita',
      esRealizada
        ? `¿Confirmas que la cita de ${reserva.cliente_nombre} se realizó correctamente?`
        : `¿Estás seguro de que deseas cancelar la cita de ${reserva.cliente_nombre}?`,
      [
        {
          text: 'Volver',
          style: 'cancel',
        },
        {
          text: esRealizada ? 'Sí, completar' : 'Sí, cancelar',
          style: esRealizada ? 'default' : 'destructive',
          onPress: () => cambiarEstado(reserva, nuevoEstado),
        },
      ]
    );
  };

  const cambiarEstado = async (reserva, nuevoEstado) => {
    try {
      setReservaProcesando(reserva.id);

      const actualizado = await actualizarEstadoReserva(
        reserva.id,
        nuevoEstado
      );

      if (actualizado) {
        Alert.alert(
          'Operación completada',
          nuevoEstado === 'realizada'
            ? 'La cita se marcó como realizada correctamente.'
            : 'La cita se canceló correctamente.'
        );

        await cargarReservas(true);
      } else {
        Alert.alert(
          'No se pudo actualizar',
          'La reserva ya no está pendiente. Actualiza la lista para consultar su estado actual.'
        );

        await cargarReservas(true);
      }
    } catch (error) {
      console.error('ERROR AL ACTUALIZAR RESERVA:', error);

      Alert.alert(
        'Error',
        'No se pudo actualizar la reserva. Inténtalo nuevamente.'
      );
    } finally {
      setReservaProcesando(null);
    }
  };

  const renderEstado = (estado) => {
    let estiloEstado = styles.estadoPendiente;

    if (estado === 'realizada') {
      estiloEstado = styles.estadoRealizada;
    } else if (estado === 'cancelada') {
      estiloEstado = styles.estadoCancelada;
    }

    return (
      <View style={[styles.estado, estiloEstado]}>
        <Text style={styles.textoEstado}>
          {obtenerEstado(estado)}
        </Text>
      </View>
    );
  };

  const renderReserva = (reserva) => {
    const procesando = reservaProcesando === reserva.id;

    return (
      <View style={styles.tarjeta} key={reserva.id}>
        <View style={styles.encabezadoTarjeta}>
          <View style={styles.infoServicio}>
            <Text style={styles.etiquetaTarjeta}>SERVICIO</Text>
            <Text style={styles.servicio}>
              {reserva.servicio || 'Servicio no disponible'}
            </Text>
          </View>

          {renderEstado(reserva.estado)}
        </View>

        <View style={styles.separador} />

        <View style={styles.datos}>
          <View style={styles.filaDato}>
            <Text style={styles.iconoDato}>●</Text>
            <View style={styles.contenidoDato}>
              <Text style={styles.etiquetaDato}>Cliente</Text>
              <Text style={styles.dato}>
                {reserva.cliente_nombre}
              </Text>
              {reserva.cliente_telefono ? (
                <Text style={styles.datoSecundario}>
                  {reserva.cliente_telefono}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.filaDato}>
            <Text style={styles.iconoDato}>✂</Text>
            <View style={styles.contenidoDato}>
              <Text style={styles.etiquetaDato}>Barbero asignado</Text>
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
                {formatearHora(reserva.hora)}
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
            <Text style={styles.etiquetaPrecio}>
              PRECIO DE LA RESERVA
            </Text>
            <Text style={styles.precio}>
              Bs. {Number(reserva.precio || 0).toFixed(2)}
            </Text>
          </View>

          <Text style={styles.moneda}>BOB</Text>
        </View>

        <TouchableOpacity
          style={styles.botonDetalle}
          onPress={() =>
            navigation.navigate('DetalleReservaAdmin', {
              reserva,
            })
          }
          activeOpacity={0.8}
        >
          <Text style={styles.textoBotonDetalle}>
            VER DETALLE
          </Text>
        </TouchableOpacity>

        {reserva.estado === 'pendiente de realizar' && (
          <View style={styles.acciones}>
            <TouchableOpacity
              style={[
                styles.botonRealizada,
                procesando && styles.botonDeshabilitado,
              ]}
              onPress={() =>
                confirmarCambioEstado(reserva, 'realizada')
              }
              disabled={procesando}
              activeOpacity={0.8}
            >
              {procesando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBotonRealizada}>
                  MARCAR REALIZADA
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.botonCancelar,
                procesando && styles.botonDeshabilitado,
              ]}
              onPress={() =>
                confirmarCambioEstado(reserva, 'cancelada')
              }
              disabled={procesando}
              activeOpacity={0.8}
            >
              <Text style={styles.textoBotonCancelar}>
                CANCELAR CITA
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={styles.areaSegura}
      edges={['bottom', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() => cargarReservas(true)}
            tintColor="#F28C28"
            colors={['#F28C28']}
          />
        }
      >
        <View style={styles.encabezado}>
          <Text style={styles.marca}>BARBER HOUSE</Text>

          <Text style={styles.titulo}>Reservas y citas</Text>

          <Text style={styles.descripcion}>
            Administra las citas y consulta su información.
          </Text>
        </View>

        <View style={styles.resumen}>
          <View style={styles.resumenItem}>
            <Text style={styles.numeroResumen}>
              {reservas.length}
            </Text>
            <Text style={styles.textoResumen}>Total</Text>
          </View>

          <View style={styles.separadorResumen} />

          <View style={styles.resumenItem}>
            <Text style={styles.numeroResumen}>
              {cantidadPorEstado('pendientes')}
            </Text>
            <Text style={styles.textoResumen}>Pendientes</Text>
          </View>

          <View style={styles.separadorResumen} />

          <View style={styles.resumenItem}>
            <Text style={styles.numeroResumen}>
              {cantidadPorEstado('realizadas')}
            </Text>
            <Text style={styles.textoResumen}>Realizadas</Text>
          </View>
        </View>

        <View style={styles.seccionFiltros}>
          <Text style={styles.tituloSeccion}>
            BUSCAR POR FECHA
          </Text>

          <TextInput
            style={styles.inputFecha}
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#777777"
            value={fechaBusqueda}
            onChangeText={setFechaBusqueda}
            keyboardType="default"
            maxLength={10}
          />

          {fechaBusqueda.length > 0 && (
            <TouchableOpacity
              style={styles.botonLimpiar}
              onPress={() => setFechaBusqueda('')}
              activeOpacity={0.8}
            >
              <Text style={styles.textoBotonLimpiar}>
                LIMPIAR BÚSQUEDA
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.seccionFiltros}>
          <Text style={styles.tituloSeccion}>
            FILTRAR RESERVAS
          </Text>

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
                  {item.texto} ({cantidadPorEstado(item.valor)})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {cargando ? (
          <View style={styles.estadoContenedor}>
            <ActivityIndicator size="large" color="#F28C28" />
            <Text style={styles.textoEstadoPantalla}>
              Cargando reservas...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.vacio}>
            <Text style={styles.iconoVacio}>!</Text>

            <Text style={styles.tituloVacio}>
              No se pudieron cargar las reservas
            </Text>

            <Text style={styles.textoVacio}>
              Comprueba tu conexión e inténtalo nuevamente.
            </Text>

            <TouchableOpacity
              style={styles.botonReintentar}
              onPress={() => cargarReservas()}
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
              No hay reservas
            </Text>

            <Text style={styles.textoVacio}>
              {fechaBusqueda.trim()
                ? 'No se encontraron reservas para esa fecha.'
                : filtro === 'hoy'
                  ? 'No hay reservas registradas para hoy.'
                  : filtro === 'todas'
                    ? 'Todavía no existen reservas registradas.'
                    : 'No hay reservas en esta categoría.'}
            </Text>
          </View>
        ) : (
          reservasFiltradas.map(renderReserva)
        )}

        <Text style={styles.pie}>
          BARBER HOUSE · Administración
        </Text>
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
    paddingTop: 20,
    paddingBottom: 25,
  },
  encabezado: {
    marginBottom: 22,
  },
  marca: {
    color: '#F28C28',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 13,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descripcion: {
    color: '#A5A5A5',
    fontSize: 13,
    lineHeight: 20,
  },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#292929',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#383838',
    paddingVertical: 18,
    marginBottom: 28,
  },
  resumenItem: {
    flex: 1,
    alignItems: 'center',
  },
  numeroResumen: {
    color: '#F28C28',
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  textoResumen: {
    color: '#AAAAAA',
    fontSize: 11,
  },
  separadorResumen: {
    width: 1,
    height: 35,
    backgroundColor: '#444444',
  },
  seccionFiltros: {
    marginBottom: 18,
  },
  tituloSeccion: {
    color: '#888888',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.4,
    marginBottom: 13,
  },
  inputFecha: {
    backgroundColor: '#292929',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#383838',
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  botonLimpiar: {
    alignSelf: 'flex-end',
    marginTop: 9,
    paddingVertical: 5,
  },
  textoBotonLimpiar: {
    color: '#F28C28',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  filtros: {
    flexGrow: 0,
  },
  contenidoFiltros: {
    paddingRight: 5,
  },
  botonFiltro: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#292929',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#383838',
    marginRight: 8,
  },
  filtroActivo: {
    backgroundColor: '#F28C28',
    borderColor: '#F28C28',
  },
  textoFiltro: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '600',
  },
  textoFiltroActivo: {
    color: '#171717',
  },
  tarjeta: {
    backgroundColor: '#292929',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#383838',
    padding: 16,
    marginBottom: 16,
  },
  encabezadoTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoServicio: {
    flex: 1,
    marginRight: 10,
  },
  etiquetaTarjeta: {
    color: '#888888',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  servicio: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  estado: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  estadoPendiente: {
    backgroundColor: '#493719',
  },
  estadoRealizada: {
    backgroundColor: '#21452F',
  },
  estadoCancelada: {
    backgroundColor: '#4A2626',
  },
  textoEstado: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  separador: {
    height: 1,
    backgroundColor: '#414141',
    marginVertical: 15,
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
    fontSize: 17,
    width: 30,
    textAlign: 'center',
  },
  contenidoDato: {
    flex: 1,
  },
  etiquetaDato: {
    color: '#888888',
    fontSize: 11,
    marginBottom: 3,
  },
  dato: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  datoSecundario: {
    color: '#999999',
    fontSize: 11,
    marginTop: 3,
  },
  filaPrecio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#202020',
    borderRadius: 10,
    padding: 13,
    marginTop: 18,
  },
  etiquetaPrecio: {
    color: '#888888',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  precio: {
    color: '#F28C28',
    fontSize: 21,
    fontWeight: 'bold',
  },
  moneda: {
    color: '#888888',
    fontSize: 11,
    fontWeight: 'bold',
  },
  botonDetalle: {
    minHeight: 42,
    backgroundColor: '#383838',
    borderWidth: 1,
    borderColor: '#F28C28',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginTop: 15,
  },
  textoBotonDetalle: {
    color: '#F28C28',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.7,
  },
  acciones: {
    marginTop: 15,
    gap: 9,
  },
  botonRealizada: {
    minHeight: 43,
    backgroundColor: '#287443',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  textoBotonRealizada: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  botonCancelar: {
    minHeight: 43,
    backgroundColor: '#292929',
    borderWidth: 1,
    borderColor: '#A64A4A',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  textoBotonCancelar: {
    color: '#E47777',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  estadoContenedor: {
    alignItems: 'center',
    paddingVertical: 55,
  },
  textoEstadoPantalla: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 14,
  },
  vacio: {
    alignItems: 'center',
    backgroundColor: '#292929',
    borderRadius: 15,
    padding: 25,
    marginTop: 8,
  },
  iconoVacio: {
    color: '#F28C28',
    fontSize: 35,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tituloVacio: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  textoVacio: {
    color: '#999999',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
  },
  botonReintentar: {
    backgroundColor: '#F28C28',
    borderRadius: 8,
    paddingHorizontal: 22,
    paddingVertical: 11,
    marginTop: 18,
  },
  textoBotonReintentar: {
    color: '#171717',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pie: {
    color: '#666666',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 15,
  },
});
