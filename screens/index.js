// Pantallas del cliente.
export { default as InicioScreen } from './cliente/InicioScreen';
export { default as ReservasScreen } from './cliente/ReservasScreen';
export { default as BarberosScreen } from './cliente/BarberosScreen';
export { default as CatalogoScreen } from './cliente/CatalogoScreen';
export { default as DetalleServicioScreen } from './cliente/DetalleServicioScreen';
export { default as DetalleBarberoScreen } from './cliente/DetalleBarberoScreen';
export { default as FormularioReservaScreen } from './cliente/FormularioReservaScreen';
export { default as ConfirmacionReservaScreen } from './cliente/ConfirmacionReservaScreen';
export { default as CortePersonalizadoScreen } from './cliente/CortePersonalizadoScreen';

// Pantallas del barbero.
export { default as PanelBarberoScreen } from './barbero/PanelBarberoScreen';
export { default as AgendaBarberoScreen } from './barbero/AgendaBarberoScreen';
export { default as DetalleReservaBarberoScreen } from './barbero/DetalleReservaBarberoScreen';
export { default as HistorialBarberoScreen } from './barbero/HistorialBarberoScreen';

// Pantallas del administrador.
export { default as GestionUsuariosScreen } from './administrador/GestionUsuariosScreen';
export { default as GestionReservasScreen } from './administrador/GestionReservasScreen';
export { default as DetalleReservaAdminScreen } from './administrador/DetalleReservaAdminScreen';
export { default as PanelEstadisticasScreen } from './administrador/PanelEstadisticasScreen';

// Pantallas temporales que todavía no tienen implementación definitiva.

import { View, Text, StyleSheet } from 'react-native';

// Detalle de reserva del cliente.
export function DetalleReservaScreen() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Detalle de reserva</Text>
    </View>
  );
}

// Gestión de servicios.
export function GestionServiciosScreen() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Gestión de servicios</Text>
    </View>
  );
}

// Gestión de barberos.
export function GestionBarberosScreen() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Gestión de barberos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#171717',
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
