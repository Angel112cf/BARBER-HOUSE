import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { obtenerHistorialPorBarbero } from '../../services/reservaService';

export default function HistorialBarberoScreen() {
  const [historial, setHistorial] = useState([]);
  const [periodo, setPeriodo] = useState('hoy');

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  // Cargar los servicios del barbero para calcular sus ganancias.
  const cargarHistorial = async () => {
    try {
      const { data: usuario, error } = await supabase.auth.getUser();

      if (error) throw error;

      if (!usuario.user) {
        throw new Error('No se encontró una sesión activa.');
      }

      const datos = await obtenerHistorialPorBarbero(usuario.user.id);

      setHistorial(datos.reservas || []);
    } catch (error) {
      console.error('Error al cargar ganancias:', error);

      Alert.alert(
        'Error',
        error.message || 'No se pudieron cargar las ganancias.'
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarHistorial();
    }, [])
  );

  const actualizar = () => {
    setActualizando(true);
    cargarHistorial();
  };

  // Obtener la fecha actual en formato AAAA-MM-DD.
  const obtenerFechaHoy = () => {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  };

  // Obtener el rango de fechas del período seleccionado.
  const obtenerRangoPeriodo = () => {
    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    const dia = fechaActual.getDate();

    if (periodo === 'hoy') {
      const hoy = obtenerFechaHoy();

      return {
        inicio: hoy,
        fin: hoy,
      };
    }

    if (periodo === 'semana') {
      const diaSemana = fechaActual.getDay();
      const diferenciaLunes = diaSemana === 0 ? 6 : diaSemana - 1;

      const lunes = new Date(anio, mes, dia - diferenciaLunes);
      const domingo = new Date(anio, mes, dia - diferenciaLunes + 6);

      const formatear = (fecha) => {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
      };

      return {
        inicio: formatear(lunes),
        fin: formatear(domingo),
      };
    }

    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);

    const formatear = (fecha) => {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    };

    return {
      inicio: formatear(primerDia),
      fin: formatear(ultimoDia),
    };
  };

  // Calcular las ganancias únicamente con servicios realizados
  // dentro del período seleccionado.
  const rango = obtenerRangoPeriodo();

  const serviciosDelPeriodo = historial.filter((item) => {
    return (
      item.estado === 'realizada' &&
      item.fecha >= rango.inicio &&
      item.fecha <= rango.fin
    );
  });

  const gananciaBruta = serviciosDelPeriodo.reduce(
    (total, item) => total + Number(item.precio || 0),
    0
  );

  const comisionBarberia = gananciaBruta * 0.30;
  const gananciaNeta = gananciaBruta * 0.70;
  const cantidadServicios = serviciosDelPeriodo.length;

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#F28C28" />

        <Text style={styles.textoCargando}>
          Cargando ganancias...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <ScrollView
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
            tintColor="#F28C28"
            colors={['#F28C28']}
          />
        }
      >
        {/* Encabezado */}
        <View style={styles.encabezado}>
          <Text style={styles.marca}>BARBER HOUSE</Text>

          <Text style={styles.titulo}>Mis ganancias</Text>

          <Text style={styles.subtitulo}>
            Consulta tus ingresos según el período seleccionado.
          </Text>
        </View>

        {/* Filtros de ganancias */}
        <Text style={styles.tituloPeriodo}>
          Período de ganancias
        </Text>

        <View style={styles.contenedorPeriodos}>
          {[
            { valor: 'hoy', texto: 'Hoy' },
            { valor: 'semana', texto: 'Esta semana' },
            { valor: 'mes', texto: 'Este mes' },
          ].map((opcion) => (
            <TouchableOpacity
              key={opcion.valor}
              style={[
                styles.botonPeriodo,
                periodo === opcion.valor && styles.botonPeriodoActivo,
              ]}
              onPress={() => setPeriodo(opcion.valor)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.textoPeriodo,
                  periodo === opcion.valor && styles.textoPeriodoActivo,
                ]}
              >
                {opcion.texto}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Resumen principal de ganancias */}
        <View style={styles.tarjetaPrincipal}>
          <Text style={styles.etiquetaPrincipal}>
            MI GANANCIA NETA
          </Text>

          <Text style={styles.gananciaPrincipal}>
            Bs {gananciaNeta.toFixed(2)}
          </Text>

          <Text style={styles.textoPrincipal}>
            Dinero correspondiente al 70% de tus servicios realizados.
          </Text>

          <View style={styles.lineaNaranja} />

          <View style={styles.cantidadServicios}>
            <Text style={styles.numeroServicios}>
              {cantidadServicios}
            </Text>

            <Text style={styles.textoServicios}>
              SERVICIOS REALIZADOS
            </Text>
          </View>
        </View>

        {/* Resumen económico */}
        <View style={styles.tarjetaResumen}>
          <Text style={styles.tituloResumen}>
            Resumen económico
          </Text>

          <View style={styles.filaResumen}>
            <View>
              <Text style={styles.etiqueta}>GANANCIA BRUTA</Text>

              <Text style={styles.descripcionResumen}>
                Total generado por tus servicios
              </Text>
            </View>

            <Text style={styles.bruta}>
              Bs {gananciaBruta.toFixed(2)}
            </Text>
          </View>

          <View style={styles.separador} />

          <View style={styles.filaResumen}>
            <View>
              <Text style={styles.etiqueta}>COMISIÓN BARBERÍA</Text>

              <Text style={styles.descripcionResumen}>
                Participación del 30%
              </Text>
            </View>

            <Text style={styles.comision}>
              Bs {comisionBarberia.toFixed(2)}
            </Text>
          </View>

          <View style={styles.separador} />

          <View style={styles.filaResumen}>
            <View>
              <Text style={styles.etiqueta}>MI PARTE</Text>

              <Text style={styles.descripcionResumen}>
                Participación del 70%
              </Text>
            </View>

            <Text style={styles.neta}>
              Bs {gananciaNeta.toFixed(2)}
            </Text>
          </View>
        </View>

      </ScrollView>
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
  lista: {
    paddingTop: 20,
    paddingBottom: 35,
    flexGrow: 1,
  },

  // Encabezado.
  encabezado: {
    marginBottom: 20,
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

  // Filtros de período.
  tituloPeriodo: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 12,
  },
  contenedorPeriodos: {
    flexDirection: 'row',
    marginBottom: 17,
  },
  botonPeriodo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#39312A',
    borderRadius: 12,
    paddingVertical: 12,
    marginRight: 7,
  },
  botonPeriodoActivo: {
    backgroundColor: '#F28C28',
    borderColor: '#F28C28',
  },
  textoPeriodo: {
    color: '#BBBBBB',
    fontSize: 11,
    fontWeight: '800',
  },
  textoPeriodoActivo: {
    color: '#111111',
  },

  // Ganancia principal.
  tarjetaPrincipal: {
    backgroundColor: '#292019',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#75451F',
    padding: 20,
    marginBottom: 17,
  },
  etiquetaPrincipal: {
    color: '#F5B477',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  gananciaPrincipal: {
    color: '#F28C28',
    fontSize: 35,
    fontWeight: '900',
    marginTop: 10,
  },
  textoPrincipal: {
    color: '#D5C2B0',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },
  lineaNaranja: {
    height: 2,
    backgroundColor: '#F28C28',
    marginTop: 20,
    marginBottom: 15,
  },
  cantidadServicios: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numeroServicios: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    marginRight: 10,
  },
  textoServicios: {
    color: '#D5C2B0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Resumen económico.
  tarjetaResumen: {
    backgroundColor: '#1D1D1D',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#39312A',
    padding: 18,
    marginBottom: 20,
  },
  tituloResumen: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 18,
  },
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etiqueta: {
    color: '#F28C28',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  descripcionResumen: {
    color: '#999999',
    fontSize: 11,
    marginTop: 5,
  },
  bruta: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  comision: {
    color: '#E5A0A0',
    fontSize: 15,
    fontWeight: '800',
  },
  neta: {
    color: '#F28C28',
    fontSize: 16,
    fontWeight: '900',
  },
  separador: {
    height: 1,
    backgroundColor: '#393939',
    marginVertical: 16,
  },
});
