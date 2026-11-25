import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Image,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UsuarioProvider } from './context/UsuarioContext';

import SplashScreen from './screens/auth/SplashScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegistroScreen from './screens/auth/RegistroScreen';

// Panel inicial independiente del administrador.
import PanelAdminScreen from './screens/administrador/PanelAdminScreen';

// Detalle individual de una reserva para administración.
import DetalleReservaAdminScreen from './screens/administrador/DetalleReservaAdminScreen';

import {
  InicioScreen,
  CatalogoScreen,
  BarberosScreen,
  ReservasScreen,
  DetalleServicioScreen,
  CortePersonalizadoScreen,
  DetalleBarberoScreen,
  FormularioReservaScreen,
  ConfirmacionReservaScreen,
  DetalleReservaScreen,
  PanelBarberoScreen,
  AgendaBarberoScreen,
  DetalleReservaBarberoScreen,
  HistorialBarberoScreen,
  GestionServiciosScreen,
  GestionBarberosScreen,
  GestionUsuariosScreen,
  GestionReservasScreen,
  PanelEstadisticasScreen,
} from './screens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Estilos generales de los encabezados BARBER HOUSE.
const opcionesStack = {
  headerStyle: {
    backgroundColor: '#171717',
  },
  headerTintColor: '#F28C28',
  headerTitleStyle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 17,
  },
  headerTitleAlign: 'center',
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: '#171717',
  },
};

// Iconos originales del panel del cliente.
const iconos = {
  Inicio: require('./assets/inicio.png'),
  Catalogo: require('./assets/catalogo.png'),
  Barberos: require('./assets/barberos.png'),
  Reservas: require('./assets/mis-citas.png'),
};

function ClienteTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarStyle: [
          styles.barraNavegacion,
          {
            height: 75 + insets.bottom,
            paddingBottom: insets.bottom + 10,
            paddingTop: 6,
          },
        ],

        tabBarActiveTintColor: '#F28C28',
        tabBarInactiveTintColor: '#888888',
        tabBarLabelStyle: styles.textoPestana,

        tabBarIcon: ({ focused }) => {
          const icono = iconos[route.name];

          return (
            <Image
              source={icono}
              style={[
                styles.iconoPestana,
                {
                  opacity: focused ? 1 : 0.55,
                  tintColor: focused ? '#F28C28' : '#888888',
                },
              ]}
              resizeMode="contain"
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={InicioScreen}
      />

      <Tab.Screen
        name="Catalogo"
        component={CatalogoScreen}
        options={{ title: 'Catálogo' }}
      />

      <Tab.Screen
        name="Barberos"
        component={BarberosScreen}
      />

      <Tab.Screen
        name="Reservas"
        component={ReservasScreen}
        options={{ title: 'Mis citas' }}
      />
    </Tab.Navigator>
  );
}

function BarberoStack() {
  return (
    <Stack.Navigator screenOptions={opcionesStack}>
      <Stack.Screen
        name="PanelBarbero"
        component={PanelBarberoScreen}
        options={{ title: 'Panel del barbero' }}
      />

      <Stack.Screen
        name="AgendaBarbero"
        component={AgendaBarberoScreen}
        options={{ title: 'Agenda y solicitudes' }}
      />

      <Stack.Screen
        name="DetalleReservaBarbero"
        component={DetalleReservaBarberoScreen}
        options={{ title: 'Detalle de la reserva' }}
      />

      <Stack.Screen
        name="HistorialBarbero"
        component={HistorialBarberoScreen}
        options={{ title: 'Historial del barbero' }}
      />
    </Stack.Navigator>
  );
}

function AdministradorStack() {
  return (
    <Stack.Navigator
      screenOptions={opcionesStack}
    >
      <Stack.Screen
        name="PanelAdmin"
        component={PanelAdminScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="GestionServicios"
        component={GestionServiciosScreen}
        options={{ title: 'Gestión de servicios' }}
      />

      <Stack.Screen
        name="GestionBarberos"
        component={GestionBarberosScreen}
        options={{ title: 'Gestión de barberos' }}
      />

      <Stack.Screen
        name="GestionUsuarios"
        component={GestionUsuariosScreen}
        options={{ title: 'Gestión de usuarios' }}
      />

      <Stack.Screen
        name="GestionReservas"
        component={GestionReservasScreen}
        options={{ title: 'Gestión de reservas' }}
      />

      <Stack.Screen
        name="DetalleReservaAdmin"
        component={DetalleReservaAdminScreen}
        options={{ title: 'Detalle de la reserva' }}
      />

      <Stack.Screen
        name="PanelEstadisticas"
        component={PanelEstadisticasScreen}
        options={{ title: 'Estadísticas y ganancias' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <UsuarioProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={opcionesStack}
        >
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              title: 'BARBER HOUSE',
            }}
          />

          <Stack.Screen
            name="Registro"
            component={RegistroScreen}
            options={{
              title: 'Crear cuenta',
            }}
          />

          <Stack.Screen
            name="ClienteTabs"
            component={ClienteTabs}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="CortePersonalizado"
            component={CortePersonalizadoScreen}
            options={{ title: 'Corte personalizado' }}
          />

          <Stack.Screen
            name="DetalleServicio"
            component={DetalleServicioScreen}
            options={{ title: 'Detalle del servicio' }}
          />

          <Stack.Screen
            name="DetalleBarbero"
            component={DetalleBarberoScreen}
            options={{ title: 'Perfil del barbero' }}
          />

          <Stack.Screen
            name="FormularioReserva"
            component={FormularioReservaScreen}
            options={{ title: 'Nueva reserva' }}
          />

          <Stack.Screen
            name="ConfirmacionReserva"
            component={ConfirmacionReservaScreen}
            options={{ title: 'Confirmación' }}
          />

          <Stack.Screen
            name="DetalleReserva"
            component={DetalleReservaScreen}
            options={{ title: 'Detalle de reserva' }}
          />

          <Stack.Screen
            name="BarberoStack"
            component={BarberoStack}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="AdministradorStack"
            component={AdministradorStack}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </UsuarioProvider>
  );
}

const styles = StyleSheet.create({
  barraNavegacion: {
    backgroundColor: '#111111',
    borderTopColor: '#292929',
    borderTopWidth: 1,
    height: 65,
    paddingTop: 6,
  },

  textoPestana: {
    fontSize: 11,
    fontWeight: '600',
  },

  iconoPestana: {
    width: 24,
    height: 24,
  },
});
