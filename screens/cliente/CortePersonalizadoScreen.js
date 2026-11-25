import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { obtenerCortePersonalizado } from '../../services/catalogoService';

export default function CortePersonalizadoScreen({ navigation }) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargarCortePersonalizado() {
      try {
        const corte = await obtenerCortePersonalizado();

        // Abrir el detalle con el registro real de Supabase.
        navigation.replace('DetalleServicio', {
          corte,
          cortePersonalizado: true,
        });
      } catch (error) {
        console.error('Error al cargar corte personalizado:', error);
        setError(error.message || 'No se pudo cargar el servicio.');
      } finally {
        setCargando(false);
      }
    }

    cargarCortePersonalizado();
  }, [navigation]);

  if (cargando) {
    return (
      <View style={styles.contenedor}>
        <ActivityIndicator size="large" color="#F28C28" />
        <Text style={styles.texto}>
          Preparando corte personalizado...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>
        Servicio no disponible
      </Text>

      <Text style={styles.texto}>
        {error}
      </Text>

      <TouchableOpacity
        style={styles.boton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.textoBoton}>
          VOLVER AL CATÁLOGO
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  texto: {
    color: '#AAAAAA',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 21,
  },
  boton: {
    backgroundColor: '#F28C28',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 9,
    marginTop: 25,
  },
  textoBoton: {
    color: '#171717',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
