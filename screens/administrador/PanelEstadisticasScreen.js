import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { obtenerEstadisticasAdmin } from '../../services/reservaService';

// Imágenes de la identidad de BARBER HOUSE.
const imagenes = {
  barberia: require('../../assets/inicio.png'),
  barberos: require('../../assets/barberos.png'),
  ingresos: require('../../assets/ganancias.png'),
  servicios: require('../../assets/ganancias.png'),
};

const PERIODOS = [
  { valor: 'hoy', texto: 'Hoy' },
  { valor: 'semana', texto: 'Semana' },
  { valor: 'mes', texto: 'Mes' },
  { valor: 'todo', texto: 'Todo' },
];

const DINERO = (cantidad) =>
  `Bs. ${Number(cantidad || 0).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fechaLocal = (fecha) => {
  if (!fecha) return null;

  const partes = fecha.split('-').map(Number);

  if (partes.length !== 3 || partes.some(Number.isNaN)) {
    return null;
  }

  return new Date(partes[0], partes[1] - 1, partes[2]);
};

const inicioDelDia = (fecha) =>
  new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

const obtenerReservasDelPeriodo = (reservas, periodo) => {
  const hoy = inicioDelDia(new Date());

  return reservas.filter((reserva) => {
    const fecha = fechaLocal(reserva.fecha);

    if (!fecha) return false;

    if (periodo === 'hoy') {
      return fecha.getTime() === hoy.getTime();
    }

    if (periodo === 'semana') {
      const diaSemana = (hoy.getDay() + 6) % 7;
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - diaSemana);

      return fecha >= lunes && fecha <= hoy;
    }

    if (periodo === 'mes') {
      return (
        fecha.getMonth() === hoy.getMonth() &&
        fecha.getFullYear() === hoy.getFullYear()
      );
    }

    return fecha <= hoy;
  });
};

const obtenerDatosGrafico = (reservas, periodo) => {
  const hoy = inicioDelDia(new Date());
  let grupos = [];

  if (periodo === 'hoy') {
    grupos = [
      {
        inicio: hoy,
        fin: hoy,
        etiqueta: 'Hoy',
      },
    ];
  } else if (periodo === 'semana') {
    const diaSemana = (hoy.getDay() + 6) % 7;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diaSemana);

    grupos = Array.from({ length: 7 }, (_, indice) => {
      const fecha = new Date(lunes);
      fecha.setDate(lunes.getDate() + indice);

      return {
        inicio: fecha,
        fin: fecha,
        etiqueta: fecha.toLocaleDateString('es-BO', {
          weekday: 'short',
        }),
      };
    });
  } else if (periodo === 'mes') {
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const cantidadSemanas = Math.ceil(
      (hoy.getDate() + primerDia.getDay() - 1) / 7
    );

    grupos = Array.from({ length: cantidadSemanas }, (_, indice) => {
      const inicio = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        indice * 7 + 1
      );

      const fin = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        Math.min((indice + 1) * 7, hoy.getDate())
      );

      return {
        inicio,
        fin,
        etiqueta: `Sem. ${indice + 1}`,
      };
    });
  } else {
    grupos = Array.from({ length: 6 }, (_, indice) => {
      const diferencia = 5 - indice;
      const inicio = new Date(
        hoy.getFullYear(),
        hoy.getMonth() - diferencia,
        1
      );

      const fin = new Date(
        hoy.getFullYear(),
        hoy.getMonth() - diferencia + 1,
        0
      );

      return {
        inicio,
        fin,
        etiqueta: inicio.toLocaleDateString('es-BO', {
          month: 'short',
        }),
      };
    });
  }

  return grupos.map((grupo) => {
    const total = reservas.reduce((suma, reserva) => {
      const fecha = fechaLocal(reserva.fecha);

      if (!fecha || fecha < grupo.inicio || fecha > grupo.fin) {
        return suma;
      }

      return suma + Number(reserva.precio || 0);
    }, 0);

    return {
      ...grupo,
      total,
    };
  });
};

export default function PanelEstadisticasScreen() {
  const [reservas, setReservas] = useState([]);
  const [periodo, setPeriodo] = useState('mes');
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState(false);

  const cargarEstadisticas = async (refrescar = false) => {
    try {
      if (refrescar) {
        setActualizando(true);
      } else {
        setCargando(true);
      }

      setError(false);

      const resultado = await obtenerEstadisticasAdmin();
      setReservas(resultado);
    } catch (error) {
      console.error('ERROR AL CARGAR ESTADISTICAS:', error);
      setError(true);
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarEstadisticas();
    }, [])
  );

  const reservasPeriodo = useMemo(
    () => obtenerReservasDelPeriodo(reservas, periodo),
    [reservas, periodo]
  );

  const resumen = useMemo(() => {
    const ingresos = reservasPeriodo.reduce(
      (total, reserva) => total + Number(reserva.precio || 0),
      0
    );

    return {
      ingresos,
      barberia: ingresos * 0.30,
      barberos: ingresos * 0.70,
      citas: reservasPeriodo.length,
    };
  }, [reservasPeriodo]);

  const gananciasBarberos = useMemo(() => {
    const agrupados = {};

    reservasPeriodo.forEach((reserva) => {
      const id = reserva.barbero_id;
      const nombre = reserva.barbero_nombre || 'Barbero';
      const precio = Number(reserva.precio || 0);

      if (!agrupados[id]) {
        agrupados[id] = {
          id,
          nombre,
          citas: 0,
          ingresos: 0,
        };
      }

      agrupados[id].citas += 1;
      agrupados[id].ingresos += precio;
    });

    return Object.values(agrupados)
      .map((barbero) => ({
        ...barbero,
        ganancia: barbero.ingresos * 0.70,
      }))
      .sort((a, b) => b.ganancia - a.ganancia);
  }, [reservasPeriodo]);

  const serviciosPopulares = useMemo(() => {
    const agrupados = {};

    reservasPeriodo.forEach((reserva) => {
      const nombre = reserva.servicio || 'Servicio sin nombre';

      if (!agrupados[nombre]) {
        agrupados[nombre] = {
          nombre,
          cantidad: 0,
          ingresos: 0,
        };
      }

      agrupados[nombre].cantidad += 1;
      agrupados[nombre].ingresos += Number(reserva.precio || 0);
    });

    return Object.values(agrupados)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [reservasPeriodo]);

  const datosGrafico = useMemo(
    () => obtenerDatosGrafico(reservasPeriodo, periodo),
    [reservasPeriodo, periodo]
  );

  const maximoGrafico = Math.max(
    ...datosGrafico.map((dato) => dato.total),
    1
  );

  const maximoBarbero = Math.max(
    ...gananciasBarberos.map((barbero) => barbero.ganancia),
    1
  );

  const maximoServicio = Math.max(
    ...serviciosPopulares.map((servicio) => servicio.cantidad),
    1
  );

  if (cargando) {
    return (
      <SafeAreaView style={styles.areaSegura}>
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#E58A2B" />
          <Text style={styles.textoCarga}>
            Cargando estadísticas...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.areaSegura}>
        <View style={styles.centrado}>
          <Text style={styles.tituloError}>
            No se pudieron cargar las estadísticas
          </Text>

          <Text style={styles.textoError}>
            Comprueba tu conexión e inténtalo nuevamente.
          </Text>

          <TouchableOpacity
            style={styles.botonReintentar}
            onPress={() => cargarEstadisticas()}
          >
            <Text style={styles.textoBotonReintentar}>
              VOLVER A INTENTAR
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.areaSegura}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() => cargarEstadisticas(true)}
            tintColor="#E58A2B"
            colors={['#E58A2B']}
          />
        }
      >
        {/* Encabezado */}
        <View style={styles.encabezado}>
          <View style={styles.filaMarca}>
            <View style={styles.lineaMarca} />
            <Text style={styles.marca}>BARBER HOUSE</Text>
          </View>

          <Text style={styles.titulo}>
            Estadísticas
          </Text>

          <Text style={styles.descripcion}>
            Resumen del rendimiento y los ingresos del negocio.
          </Text>
        </View>

        {/* Selector de período */}
        <View style={styles.seccionPeriodo}>
          <Text style={styles.etiquetaSeccion}>
            PERÍODO
          </Text>

          <View style={styles.filtros}>
            {PERIODOS.map((item) => (
              <TouchableOpacity
                key={item.valor}
                style={[
                  styles.filtro,
                  periodo === item.valor && styles.filtroActivo,
                ]}
                onPress={() => setPeriodo(item.valor)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.textoFiltro,
                    periodo === item.valor && styles.textoFiltroActivo,
                  ]}
                >
                  {item.texto}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ingresos principales */}
        <View style={styles.tarjetaPrincipal}>
          <View style={styles.encabezadoPrincipal}>
            <View>
              <Text style={styles.etiquetaPrincipal}>
                INGRESOS TOTALES
              </Text>
              <Text style={styles.periodoPrincipal}>
                {PERIODOS.find((item) => item.valor === periodo)?.texto}
              </Text>
            </View>

            <View style={styles.imagenPrincipal}>
              <Image
                source={imagenes.ingresos}
                style={styles.imagenIcono}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.ingresoPrincipal}>
            {DINERO(resumen.ingresos)}
          </Text>

          <View style={styles.divisorPrincipal} />

          <View style={styles.piePrincipal}>
            <Text style={styles.textoPiePrincipal}>
              Reservas registradas
            </Text>

            <Text style={styles.numeroCitas}>
              {resumen.citas}
            </Text>
          </View>
        </View>

        {/* Distribución de ingresos */}
        <View style={styles.tarjetasResumen}>
          <View style={styles.tarjetaResumen}>
            <View style={styles.encabezadoResumen}>
              <Image
                source={imagenes.barberia}
                style={styles.imagenResumen}
                resizeMode="contain"
              />
              <Text style={styles.porcentajeResumen}>30%</Text>
            </View>

            <Text style={styles.etiquetaResumen}>
              BARBERÍA
            </Text>

            <Text style={styles.valorResumen}>
              {DINERO(resumen.barberia)}
            </Text>

            <Text style={styles.detalleResumen}>
              Participación del negocio
            </Text>
          </View>

          <View style={styles.tarjetaResumen}>
            <View style={styles.encabezadoResumen}>
              <Image
                source={imagenes.barberos}
                style={styles.imagenResumen}
                resizeMode="contain"
              />
              <Text style={styles.porcentajeResumen}>70%</Text>
            </View>

            <Text style={styles.etiquetaResumen}>
              BARBEROS
            </Text>

            <Text style={styles.valorResumen}>
              {DINERO(resumen.barberos)}
            </Text>

            <Text style={styles.detalleResumen}>
              Participación del equipo
            </Text>
          </View>
        </View>

        {/* Gráfico de ingresos */}
        <View style={styles.tarjetaSeccion}>
          <View style={styles.encabezadoSeccion}>
            <View style={styles.tituloConImagen}>
              <View style={styles.barraLateral} />
              <View>
                <Text style={styles.tituloTarjeta}>
                  Ingresos
                </Text>
                <Text style={styles.subtituloTarjeta}>
                  Evolución durante el período
                </Text>
              </View>
            </View>

            <Image
              source={imagenes.ingresos}
              style={styles.imagenSeccion}
              resizeMode="contain"
            />
          </View>

          {resumen.ingresos === 0 ? (
            <Text style={styles.sinDatos}>
              No hay ingresos registrados en este período.
            </Text>
          ) : (
            <View style={styles.grafico}>
              {datosGrafico.map((dato, indice) => {
                const altura = dato.total > 0
                  ? Math.max((dato.total / maximoGrafico) * 125, 5)
                  : 3;

                return (
                  <View style={styles.columnaGrafico} key={indice}>
                    <Text style={styles.valorGrafico}>
                      {dato.total > 0
                        ? dato.total.toFixed(0)
                        : ''}
                    </Text>

                    <View style={styles.areaBarra}>
                      <View
                        style={[
                          styles.barraGrafico,
                          { height: altura },
                          dato.total === 0 && styles.barraVacia,
                        ]}
                      />
                    </View>

                    <Text style={styles.etiquetaGrafico}>
                      {dato.etiqueta}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={styles.notaGrafico}>
            Importes expresados en bolivianos (Bs).
          </Text>
        </View>

        {/* Ganancias por barbero */}
        <View style={styles.tarjetaSeccion}>
          <View style={styles.encabezadoSeccion}>
            <View style={styles.tituloConImagen}>
              <View style={styles.barraLateral} />
              <View>
                <Text style={styles.tituloTarjeta}>
                  Rendimiento por barbero
                </Text>
                <Text style={styles.subtituloTarjeta}>
                  Distribución de ganancias del 70%
                </Text>
              </View>
            </View>

            <Image
              source={imagenes.barberos}
              style={styles.imagenSeccion}
              resizeMode="contain"
            />
          </View>

          {gananciasBarberos.length === 0 ? (
            <Text style={styles.sinDatos}>
              Todavía no hay ganancias para mostrar.
            </Text>
          ) : (
            gananciasBarberos.map((barbero, indice) => (
              <View style={styles.itemRanking} key={barbero.id}>
                <View style={styles.filaRanking}>
                  <View style={styles.numeroRanking}>
                    <Text style={styles.textoNumeroRanking}>
                      {String(indice + 1).padStart(2, '0')}
                    </Text>
                  </View>

                  <View style={styles.infoRanking}>
                    <Text style={styles.nombreRanking}>
                      {barbero.nombre}
                    </Text>

                    <Text style={styles.detalleRanking}>
                      {barbero.citas}{' '}
                      {barbero.citas === 1 ? 'cita' : 'citas'}
                    </Text>
                  </View>

                  <Text style={styles.gananciaRanking}>
                    {DINERO(barbero.ganancia)}
                  </Text>
                </View>

                <View style={styles.fondoProgreso}>
                  <View
                    style={[
                      styles.progreso,
                      {
                        width: `${(barbero.ganancia / maximoBarbero) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Servicios más solicitados */}
        <View style={styles.tarjetaSeccion}>
          <View style={styles.encabezadoSeccion}>
            <View style={styles.tituloConImagen}>
              <View style={styles.barraLateral} />
              <View>
                <Text style={styles.tituloTarjeta}>
                  Servicios más solicitados
                </Text>
                <Text style={styles.subtituloTarjeta}>
                  Clasificación por cantidad de citas
                </Text>
              </View>
            </View>

            <Image
              source={imagenes.servicios}
              style={styles.imagenSeccion}
              resizeMode="contain"
            />
          </View>

          {serviciosPopulares.length === 0 ? (
            <Text style={styles.sinDatos}>
              No hay servicios realizados en este período.
            </Text>
          ) : (
            serviciosPopulares.map((servicio, indice) => (
              <View style={styles.itemServicio} key={servicio.nombre}>
                <View style={styles.filaServicio}>
                  <View style={styles.numeroServicio}>
                    <Text style={styles.textoNumeroServicio}>
                      {String(indice + 1).padStart(2, '0')}
                    </Text>
                  </View>

                  <View style={styles.infoServicio}>
                    <Text style={styles.nombreServicio}>
                      {servicio.nombre}
                    </Text>

                    <Text style={styles.detalleRanking}>
                      {servicio.cantidad}{' '}
                      {servicio.cantidad === 1 ? 'cita' : 'citas'}
                    </Text>
                  </View>

                  <Text style={styles.ingresoServicio}>
                    {DINERO(servicio.ingresos)}
                  </Text>
                </View>

                <View style={styles.fondoProgreso}>
                  <View
                    style={[
                      styles.progreso,
                      {
                        width: `${(servicio.cantidad / maximoServicio) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Nota final */}
        <View style={styles.notaFinal}>
          <Text style={styles.tituloNotaFinal}>
            Información del reporte
          </Text>

          <Text style={styles.textoNotaFinal}>
            Los cálculos respetan los precios registrados en cada reserva
            y la distribución establecida: 30% para la barbería y 70%
            para los barberos.
          </Text>
        </View>

        <Text style={styles.pie}>
          BARBER HOUSE  /  ADMINISTRACIÓN
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: '#141414',
  },

  contenido: {
    paddingHorizontal: 19,
    paddingTop: 22,
    paddingBottom: 35,
  },

  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: '#141414',
  },

  textoCarga: {
    color: '#A5A5A5',
    fontSize: 13,
    marginTop: 15,
  },

  encabezado: {
    marginBottom: 27,
  },

  filaMarca: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  lineaMarca: {
    width: 22,
    height: 2,
    backgroundColor: '#E58A2B',
    marginRight: 9,
  },

  marca: {
    color: '#E58A2B',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2.5,
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: 'bold',
    letterSpacing: 0.2,
    marginBottom: 7,
  },

  descripcion: {
    color: '#929292',
    fontSize: 13,
    lineHeight: 19,
  },

  seccionPeriodo: {
    marginBottom: 19,
  },

  etiquetaSeccion: {
    color: '#858585',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 11,
  },

  filtros: {
    flexDirection: 'row',
    backgroundColor: '#222222',
    borderRadius: 9,
    padding: 4,
    borderWidth: 1,
    borderColor: '#303030',
  },

  filtro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 6,
  },

  filtroActivo: {
    backgroundColor: '#E58A2B',
  },

  textoFiltro: {
    color: '#A5A5A5',
    fontSize: 11,
    fontWeight: '600',
  },

  textoFiltroActivo: {
    color: '#171717',
    fontWeight: 'bold',
  },

  tarjetaPrincipal: {
    backgroundColor: '#222222',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#353535',
    padding: 19,
    marginBottom: 12,
  },

  encabezadoPrincipal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  etiquetaPrincipal: {
    color: '#A5A5A5',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.3,
    marginBottom: 5,
  },

  periodoPrincipal: {
    color: '#777777',
    fontSize: 11,
  },

  imagenPrincipal: {
    width: 43,
    height: 43,
    borderRadius: 9,
    backgroundColor: '#34271C',
    justifyContent: 'center',
    alignItems: 'center',
  },

  imagenIcono: {
    width: 26,
    height: 26,
  },

  ingresoPrincipal: {
    color: '#E58A2B',
    fontSize: 31,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },

  divisorPrincipal: {
    height: 1,
    backgroundColor: '#383838',
    marginVertical: 17,
  },

  piePrincipal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  textoPiePrincipal: {
    color: '#999999',
    fontSize: 11,
  },

  numeroCitas: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  tarjetasResumen: {
    flexDirection: 'row',
    gap: 11,
    marginBottom: 19,
  },

  tarjetaResumen: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#222222',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#353535',
    padding: 13,
  },

  encabezadoResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  imagenResumen: {
    width: 29,
    height: 29,
  },

  porcentajeResumen: {
    color: '#E58A2B',
    fontSize: 13,
    fontWeight: 'bold',
  },

  etiquetaResumen: {
    color: '#A0A0A0',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.7,
    marginBottom: 8,
  },

  valorResumen: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  detalleResumen: {
    color: '#777777',
    fontSize: 9,
    lineHeight: 13,
  },

  tarjetaSeccion: {
    backgroundColor: '#202020',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#353535',
    padding: 16,
    marginBottom: 14,
  },

  encabezadoSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  tituloConImagen: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  barraLateral: {
    width: 3,
    height: 32,
    backgroundColor: '#E58A2B',
    borderRadius: 2,
    marginRight: 11,
  },

  tituloTarjeta: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  subtituloTarjeta: {
    color: '#888888',
    fontSize: 10,
  },

  imagenSeccion: {
    width: 31,
    height: 31,
    marginLeft: 10,
  },

  grafico: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 165,
    paddingTop: 12,
  },

  columnaGrafico: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    minWidth: 0,
  },

  valorGrafico: {
    color: '#BBBBBB',
    fontSize: 9,
    marginBottom: 5,
  },

  areaBarra: {
    height: 130,
    width: '55%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  barraGrafico: {
    width: '100%',
    maxWidth: 25,
    backgroundColor: '#E58A2B',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  barraVacia: {
    backgroundColor: '#414141',
  },

  etiquetaGrafico: {
    color: '#A0A0A0',
    fontSize: 9,
    marginTop: 8,
    textTransform: 'capitalize',
  },

  notaGrafico: {
    color: '#777777',
    fontSize: 10,
    marginTop: 15,
  },

  sinDatos: {
    color: '#999999',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 23,
    lineHeight: 19,
  },

  itemRanking: {
    marginBottom: 20,
  },

  filaRanking: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  numeroRanking: {
    width: 31,
    height: 31,
    borderRadius: 6,
    backgroundColor: '#30271F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  textoNumeroRanking: {
    color: '#E58A2B',
    fontSize: 10,
    fontWeight: 'bold',
  },

  infoRanking: {
    flex: 1,
    marginRight: 8,
  },

  nombreRanking: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },

  detalleRanking: {
    color: '#888888',
    fontSize: 10,
  },

  gananciaRanking: {
    color: '#E58A2B',
    fontSize: 11,
    fontWeight: 'bold',
  },

  fondoProgreso: {
    height: 5,
    backgroundColor: '#3A3A3A',
    borderRadius: 5,
    overflow: 'hidden',
  },

  progreso: {
    height: '100%',
    backgroundColor: '#E58A2B',
    borderRadius: 5,
  },

  itemServicio: {
    marginBottom: 19,
  },

  filaServicio: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  numeroServicio: {
    width: 31,
    height: 31,
    borderRadius: 6,
    backgroundColor: '#30271F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  textoNumeroServicio: {
    color: '#E58A2B',
    fontWeight: 'bold',
    fontSize: 10,
  },

  infoServicio: {
    flex: 1,
    marginRight: 8,
  },

  nombreServicio: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },

  ingresoServicio: {
    color: '#E58A2B',
    fontSize: 10,
    fontWeight: 'bold',
  },

  notaFinal: {
    backgroundColor: '#202020',
    borderWidth: 1,
    borderColor: '#353535',
    borderRadius: 9,
    padding: 15,
    marginTop: 2,
  },

  tituloNotaFinal: {
    color: '#E58A2B',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  textoNotaFinal: {
    color: '#999999',
    fontSize: 10,
    lineHeight: 17,
  },

  pie: {
    color: '#626262',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 24,
  },

  tituloError: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 9,
  },

  textoError: {
    color: '#999999',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  botonReintentar: {
    backgroundColor: '#E58A2B',
    borderRadius: 7,
    paddingHorizontal: 24,
    paddingVertical: 13,
    marginTop: 21,
  },

  textoBotonReintentar: {
    color: '#171717',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
