import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { useUsuario } from '../../context/UsuarioContext';
import { cerrarSesion as cerrarSesionAuth } from '../../services/authService';

const anchoPantalla = Dimensions.get('window').width;
const anchoCarrusel = anchoPantalla - 40;

const logo = require('../../assets/logo.png');

const imagenes = [
  require('../../assets/imagen-1.jpg'),
  require('../../assets/imagen-2.jpg'),
  require('../../assets/imagen-3.jpg'),
  require('../../assets/imagen-4.jpg'),
];

const iconos = {
  inicio: require('../../assets/inicio.png'),
  catalogo: require('../../assets/catalogo.png'),
  barberos: require('../../assets/barberos.png'),
  citas: require('../../assets/mis-citas.png'),
};

export default function InicioScreen({ navigation }) {
  const { usuario } = useUsuario();

  const carruselRef = useRef(null);
  const [indiceActual, setIndiceActual] = useState(0);

  // Cambia automáticamente las imágenes del carrusel.
  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActual((indiceAnterior) => {
        const siguiente = (indiceAnterior + 1) % imagenes.length;

        carruselRef.current?.scrollTo({
          x: siguiente * anchoCarrusel,
          animated: true,
        });

        return siguiente;
      });
    }, 3500);

    return () => clearInterval(intervalo);
  }, []);

  // Actualiza el indicador cuando el usuario desliza manualmente.
  const cambiarImagen = (evento) => {
    const desplazamiento = evento.nativeEvent.contentOffset.x;
    const nuevoIndice = Math.round(desplazamiento / anchoCarrusel);

    setIndiceActual(nuevoIndice);
  };

    // Cierra la sesión y vuelve a la pantalla de Login.
    const cerrarSesion = () => {
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
            onPress: async () => {
              try {
                await cerrarSesionAuth();

                navigation.getParent()?.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } catch (error) {
                Alert.alert(
                  'Error',
                  'No se pudo cerrar la sesión. Inténtalo nuevamente.'
                );
              }
            },
          },
        ]
      );
    };

  const accesos = [
    {
      nombre: 'Inicio',
      imagen: iconos.inicio,
      pantalla: 'Inicio',
    },
          {
        nombre: 'Catálogo',
        imagen: iconos.catalogo,
        pantalla: 'Catalogo',
      },
    {
      nombre: 'Barberos',
      imagen: iconos.barberos,
      pantalla: 'Barberos',
    },
          {
        nombre: 'Mis citas',
        imagen: iconos.citas,
        pantalla: 'Reservas',
      },
  ];

  return (
    <SafeAreaView style={styles.areaSegura} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.contenedor}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* LOGO Y NOMBRE DE LA EMPRESA */}
        <View style={styles.encabezado}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />

          <Text style={styles.nombreEmpresa}>BARBER HOUSE</Text>
          <Text style={styles.subtituloEmpresa}>
            ESTILO Y PERSONALIDAD
          </Text>
        </View>

        {/* BIENVENIDA */}
        <View style={styles.bienvenida}>
          <Text style={styles.textoBienvenida}>Bienvenido,</Text>

          <Text style={styles.nombreCliente}>
            {usuario?.nombre || 'Cliente'}
          </Text>

          <Text style={styles.descripcionBienvenida}>
            Tu estilo comienza aquí. Descubre nuestros servicios y
            encuentra el look que mejor representa tu personalidad.
          </Text>
        </View>

        {/* ACCESOS RÁPIDOS CON LOS ICONOS DE LAS PESTAÑAS */}
        <Text style={styles.tituloSeccion}>EXPLORA BARBER HOUSE</Text>

        <View style={styles.contenedorAccesos}>
          {accesos.map((acceso) => (
            <TouchableOpacity
              key={acceso.nombre}
              style={styles.acceso}
              onPress={() => navigation.navigate(acceso.pantalla)}
              activeOpacity={0.75}
            >
              <View style={styles.fondoIcono}>
                <Image
                  source={acceso.imagen}
                  style={styles.iconoAcceso}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.nombreAcceso}>
                {acceso.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CARRUSEL DE IMÁGENES */}
        <View style={styles.seccionCarrusel}>
          <Text style={styles.tituloSeccion}>NUESTRO ESTILO</Text>

          <ScrollView
            ref={carruselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={cambiarImagen}
            decelerationRate="fast"
          >
            {imagenes.map((imagen, index) => (
              <Image
                key={index}
                source={imagen}
                style={styles.imagenCarrusel}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          <View style={styles.indicadores}>
            {imagenes.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicador,
                  indiceActual === index && styles.indicadorActivo,
                ]}
              />
            ))}
          </View>
        </View>

        {/* UBICACIÓN DE BARBER HOUSE */}
        <View style={styles.seccionUbicacion}>
          <Text style={styles.tituloSeccion}>VISÍTANOS</Text>

          <Text style={styles.textoUbicacion}>
            Encuéntranos en el centro de Tarija.
          </Text>

          <View style={styles.contenedorMapa}>
            <MapView
              style={styles.mapa}
              initialRegion={{
                latitude: -21.5355,
                longitude: -64.7296,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
              scrollEnabled={true}
              zoomEnabled={true}
              rotateEnabled={true}
              pitchEnabled={true}
              toolbarEnabled={false}
              showsUserLocation={false}
              showsMyLocationButton={false}
              moveOnMarkerPress={false}
            >
              <Marker
                coordinate={{
                  latitude: -21.5355,
                  longitude: -64.7296,
                }}
                title="BARBER HOUSE"
                description="Te esperamos para renovar tu estilo."
                pinColor="#F28C28"
                draggable={false}
              />
            </MapView>
          </View>

          <View style={styles.etiquetaUbicacion}>
            <Text style={styles.iconoUbicacion}>●</Text>
            <Text style={styles.direccionUbicacion}>
              Centro de Tarija · Bolivia
            </Text>
          </View>
        </View>

        {/* CERRAR SESIÓN */}
        <TouchableOpacity
          style={styles.botonCerrarSesion}
          onPress={cerrarSesion}
          activeOpacity={0.8}
        >
          <Text style={styles.textoCerrarSesion}>
            CERRAR SESIÓN
          </Text>
        </TouchableOpacity>

        <Text style={styles.pie}>
          BARBER HOUSE · TU ESTILO, NUESTRA PASIÓN
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: '#292929',
  },
  contenedor: {
    flex: 1,
    backgroundColor: '#292929',
  },
  contenido: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 35,
  },
  encabezado: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logo: {
    width: 105,
    height: 105,
    marginBottom: 8,
  },
  nombreEmpresa: {
    color: '#F28C28',
    fontSize: 25,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  subtituloEmpresa: {
    color: '#AAAAAA',
    fontSize: 10,
    letterSpacing: 3,
    marginTop: 5,
  },
  bienvenida: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 20,
    marginBottom: 27,
    borderLeftWidth: 4,
    borderLeftColor: '#F28C28',
  },
  textoBienvenida: {
    color: '#AAAAAA',
    fontSize: 15,
  },
  nombreCliente: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 10,
  },
  descripcionBienvenida: {
    color: '#CCCCCC',
    fontSize: 13,
    lineHeight: 21,
  },
  tituloSeccion: {
    color: '#F28C28',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  contenedorAccesos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  acceso: {
    alignItems: 'center',
    width: '23%',
  },
  fondoIcono: {
    width: 62,
    height: 62,
    backgroundColor: '#292929',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444444',
  },
  iconoAcceso: {
    width: 34,
    height: 34,
  },
  nombreAcceso: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 9,
    textAlign: 'center',
  },
  seccionCarrusel: {
    marginBottom: 30,
  },
  imagenCarrusel: {
    width: anchoCarrusel,
    height: 195,
    borderRadius: 14,
    marginRight: 0,
  },
  indicadores: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 13,
    gap: 7,
  },
  indicador: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#666666',
  },
  indicadorActivo: {
    width: 22,
    backgroundColor: '#F28C28',
  },
  seccionUbicacion: {
    marginBottom: 30,
  },
  textoUbicacion: {
    color: '#CCCCCC',
    fontSize: 13,
    marginBottom: 13,
  },
  contenedorMapa: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#444444',
  },
  mapa: {
    width: '100%',
    height: '100%',
  },
  etiquetaUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  iconoUbicacion: {
    color: '#F28C28',
    fontSize: 13,
    marginRight: 9,
  },
  direccionUbicacion: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  botonCerrarSesion: {
    backgroundColor: '#292929',
    borderWidth: 1,
    borderColor: '#F28C28',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 22,
  },
  textoCerrarSesion: {
    color: '#F28C28',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  pie: {
    color: '#777777',
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
