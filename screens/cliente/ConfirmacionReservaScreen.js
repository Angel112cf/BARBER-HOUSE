import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { obtenerReservaPorId } from '../../services/reservaService';

export default function ConfirmacionReservaScreen({ navigation, route }) {
  const reservaId = route.params?.reservaId;

  const [reserva, setReserva] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarReserva() {
      try {
        if (!reservaId) {
          setError(true);
          return;
        }

        const resultado = await obtenerReservaPorId(reservaId);

        if (activo && resultado) {
          setReserva(resultado);
        } else if (activo) {
          setError(true);
        }
      } catch (err) {
        console.error('ERROR AL CONSULTAR RESERVA:', err);

        if (activo) {
          setError(true);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarReserva();

    return () => {
      activo = false;
    };
  }, [reservaId]);

  const volverInicio = () => {
    navigation.navigate('ClienteTabs', {
      screen: 'Inicio',
    });
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#F28C28" />
        <Text style={styles.textoCargando}>
          Consultando tu reserva...
        </Text>
      </View>
    );
  }

  if (error || !reserva) {
    return (
      <View style={styles.centro}>
        <Text style={styles.titulo}>
          No se pudo consultar la reserva
        </Text>

        <Text style={styles.texto}>
          No encontramos los datos de la reserva registrada.
        </Text>

        <TouchableOpacity
          style={styles.boton}
          onPress={volverInicio}
        >
          <Text style={styles.textoBoton}>
            VOLVER AL INICIO
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
    >
      <View style={styles.iconoConfirmacion}>
        <Text style={styles.check}>✓</Text>
      </View>

      <Text style={styles.titulo}>
        ¡Reserva registrada!
      </Text>

      <Text style={styles.descripcion}>
        Tu solicitud de reserva se guardó correctamente.
      </Text>

      <View style={styles.tarjeta}>
        <Text style={styles.subtitulo}>
          Detalle de la reserva
        </Text>

        <View style={styles.fila}>
          <Text style={styles.etiqueta}>Número de reserva</Text>
          <Text style={styles.valor}>
            #{reserva.id}
          </Text>
        </View>

        <View style={styles.fila}>
          <Text style={styles.etiqueta}>Cliente</Text>
          <Text style={styles.valor}>
            {reserva.cliente}
          </Text>
        </View>

        <View style={styles.fila}>
          <Text style={styles.etiqueta}>Servicio</Text>
          <Text style={styles.valor}>
            {reserva.servicio}
          </Text>
        </View>

        <View style={styles.fila}>
          <Text style={styles.etiqueta}>Barbero</Text>
          <Text style={styles.valor}>
            {reserva.barbero_nombre}
          </Text>
        </View>

        <View style={styles.fila}>
          <Text style={styles.etiqueta}>Fecha</Text>
          <Text style={styles.valor}>
            {reserva.fecha}
          </Text>
        </View>

        <View style={styles.fila}>
          <Text style={styles.etiqueta}>Hora</Text>
          <Text style={styles.valor}>
            {String(reserva.hora).substring(0, 5)}
          </Text>
        </View>

        <View style={styles.fila}>
          <Text style={styles.etiqueta}>Modalidad</Text>
          <Text style={styles.valor}>
            {reserva.modalidad === 'domicilio'
              ? 'A domicilio'
              : 'En local'}
          </Text>
        </View>

        <View style={styles.fila}>
          <Text style={styles.etiqueta}>Estado</Text>
          <Text style={styles.estado}>
            {reserva.estado}
          </Text>
        </View>

        <View style={styles.separador} />

        <View style={styles.fila}>
          <Text style={styles.totalEtiqueta}>Total</Text>
          <Text style={styles.total}>
            Bs. {Number(reserva.precio || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.boton}
        onPress={volverInicio}
      >
        <Text style={styles.textoBoton}>
          VOLVER AL INICIO
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#171717',
  },
  contenido: {
    padding: 20,
    paddingBottom: 35,
    alignItems: 'center',
  },
  centro: {
    flex: 1,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  iconoConfirmacion: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: '#F28C28',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  check: {
    color: '#171717',
    fontSize: 45,
    fontWeight: 'bold',
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  descripcion: {
    color: '#AAAAAA',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
  },
  tarjeta: {
    width: '100%',
    backgroundColor: '#292929',
    borderRadius: 14,
    padding: 18,
    marginBottom: 22,
  },
  subtitulo: {
    color: '#F28C28',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    gap: 12,
  },
  etiqueta: {
    color: '#AAAAAA',
    fontSize: 14,
    flex: 1,
  },
  valor: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  estado: {
    color: '#F28C28',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
  },
  separador: {
    height: 1,
    backgroundColor: '#444444',
    marginVertical: 8,
  },
  totalEtiqueta: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  total: {
    color: '#F28C28',
    fontSize: 21,
    fontWeight: 'bold',
  },
  boton: {
    width: '100%',
    backgroundColor: '#F28C28',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBoton: {
    color: '#171717',
    fontSize: 14,
    fontWeight: 'bold',
  },
  texto: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 15,
  },
  textoCargando: {
    color: '#FFFFFF',
    marginTop: 15,
  },
});
