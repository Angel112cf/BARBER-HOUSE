import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  obtenerTiposRostro,
  obtenerCortesPorRostro,
} from '../../services/catalogoService';

const imagenPersonalizada = require('../../assets/personal.png');

export default function CatalogoScreen({ navigation }) {
  const [tiposRostro, setTiposRostro] = useState([]);
  const [rostroSeleccionado, setRostroSeleccionado] = useState(null);
  const [cortes, setCortes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [cargandoCortes, setCargandoCortes] = useState(false);

  // Cargar las categorías de rostros desde Supabase.
  useEffect(() => {
    async function cargarTiposRostro() {
      try {
        const datos = await obtenerTiposRostro();

        setTiposRostro(datos);

        if (datos.length > 0) {
          setRostroSeleccionado(datos[0].id);
        }
      } catch (error) {
        console.error('Error al cargar tipos de rostro:', error);
      } finally {
        setCargando(false);
      }
    }

    cargarTiposRostro();
  }, []);

  // Cargar los cortes correspondientes al rostro seleccionado.
  useEffect(() => {
    async function cargarCortes() {
      if (!rostroSeleccionado) {
        setCortes([]);
        return;
      }

      try {
        setCargandoCortes(true);

        const datos = await obtenerCortesPorRostro(
          rostroSeleccionado,
          busqueda
        );

        setCortes(datos);
      } catch (error) {
        console.error('Error al cargar cortes:', error);
        setCortes([]);
      } finally {
        setCargandoCortes(false);
      }
    }

    cargarCortes();
  }, [rostroSeleccionado, busqueda]);

  // Mostrar cada corte del catálogo.
  function renderCorte({ item }) {
    return (
      <TouchableOpacity
        style={styles.tarjeta}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('DetalleServicio', {
            corte: item,
          })
        }
      >
        <View style={styles.imagenContenedor}>
          {item.imagen_url ? (
            <Image
              source={{ uri: item.imagen_url }}
              style={styles.imagenCorte}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.imagenTexto}>
              BARBER HOUSE
            </Text>
          )}

          <View style={styles.etiquetaImagen}>
            <Text style={styles.textoEtiquetaImagen}>
              BARBER HOUSE
            </Text>
          </View>
        </View>

        <View style={styles.contenidoTarjeta}>
          <Text style={styles.nombreCorte}>{item.nombre}</Text>

          <Text style={styles.descripcion} numberOfLines={2}>
            {item.descripcion}
          </Text>

          <View style={styles.divisorTarjeta} />

          <View style={styles.pieTarjeta}>
            <View>
              <Text style={styles.etiquetaPrecio}>PRECIO</Text>
              <Text style={styles.precio}>
                Bs. {Number(item.precio).toFixed(2)}
              </Text>
            </View>

            <View style={styles.botonDetalle}>
              <Text style={styles.textoBotonDetalle}>
                VER DETALLES
              </Text>
              <Text style={styles.flechaDetalle}>›</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (cargando) {
    return (
      <SafeAreaView style={styles.areaSegura}>
        <View style={styles.cargando}>
          <ActivityIndicator size="large" color="#F28C28" />
          <Text style={styles.textoCargando}>
            Cargando catálogo...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Contenido superior de la lista.
  const encabezadoLista = (
    <View>
      <View style={styles.encabezado}>
        <Text style={styles.marca}>BARBER HOUSE</Text>

        <Text style={styles.titulo}>
          Nuestro catálogo
        </Text>

        <Text style={styles.subtitulo}>
          Encuentra el corte ideal para tu estilo y tipo de rostro.
        </Text>
      </View>

      {/* CORTE PERSONALIZADO */}
      <TouchableOpacity
        style={styles.botonPersonalizado}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('CortePersonalizado')
        }
      >
        <View style={styles.contenedorImagenPersonal}>
          <Image
            source={imagenPersonalizada}
            style={styles.imagenPersonal}
            resizeMode="contain"
          />
        </View>

        <View style={styles.contenidoPersonalizado}>
          <Text style={styles.etiquetaPersonalizada}>
            SERVICIO ESPECIAL
          </Text>

          <Text style={styles.tituloPersonalizado}>
            Corte personalizado
          </Text>

          <Text style={styles.descripcionPersonalizado}>
            Comparte tu referencia y solicita el estilo que deseas.
          </Text>
        </View>

        <Text style={styles.flechaPersonalizado}>›</Text>
      </TouchableOpacity>

      {/* BÚSQUEDA */}
      <Text style={styles.etiquetaSeccion}>
        BUSCAR UN CORTE
      </Text>

      <View style={styles.contenedorBusqueda}>
        <Text style={styles.iconoBusqueda}>⌕</Text>

        <TextInput
          style={styles.busqueda}
          placeholder="Ej. Fade, Quiff, Mullet..."
          placeholderTextColor="#888888"
          value={busqueda}
          onChangeText={setBusqueda}
        />

        {busqueda.length > 0 && (
          <TouchableOpacity
            onPress={() => setBusqueda('')}
            style={styles.botonLimpiar}
          >
            <Text style={styles.textoLimpiar}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CATEGORÍAS */}
      <Text style={styles.etiquetaSeccion}>
        TIPO DE ROSTRO
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categorias}
        contentContainerStyle={styles.categoriasContenido}
      >
        {tiposRostro.map((rostro) => {
          const seleccionado = rostroSeleccionado === rostro.id;

          return (
            <TouchableOpacity
              key={rostro.id}
              style={[
                styles.categoria,
                seleccionado && styles.categoriaActiva,
              ]}
              onPress={() => setRostroSeleccionado(rostro.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.textoCategoria,
                  seleccionado && styles.textoCategoriaActivo,
                ]}
              >
                {rostro.nombre}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* RESULTADOS */}
      <View style={styles.resultadosEncabezado}>
        <View>
          <Text style={styles.tituloResultados}>
            Cortes recomendados
          </Text>

          <Text style={styles.subtituloResultados}>
            Selecciona un estilo para conocer sus detalles.
          </Text>
        </View>

        <View style={styles.contador}>
          <Text style={styles.cantidad}>
            {cortes.length}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={styles.areaSegura}
      edges={['top', 'left', 'right']}
    >
      <FlatList
        style={styles.contenedor}
        data={cortes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCorte}
        ListHeaderComponent={encabezadoLista}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.lista}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          cargandoCortes ? (
            <View style={styles.cargandoCortes}>
              <ActivityIndicator size="large" color="#F28C28" />
              <Text style={styles.textoCargando}>
                Buscando cortes...
              </Text>
            </View>
          ) : (
            <View style={styles.vacio}>
              <Text style={styles.vacioTitulo}>
                No encontramos cortes
              </Text>

              <Text style={styles.vacioTexto}>
                Prueba con otro nombre o selecciona otra categoría.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          cortes.length > 0 && cargandoCortes ? (
            <ActivityIndicator
              size="small"
              color="#F28C28"
              style={styles.indicadorActualizacion}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: '#171717',
  },
  contenedor: {
    flex: 1,
    backgroundColor: '#171717',
  },
  lista: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },

  // ENCABEZADO
  encabezado: {
    marginBottom: 22,
  },
  marca: {
    color: '#F28C28',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 7,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#AAAAAA',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  // CORTE PERSONALIZADO
  botonPersonalizado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#292929',
    borderWidth: 1,
    borderColor: '#F28C28',
    borderRadius: 15,
    padding: 13,
    marginBottom: 27,
  },
  contenedorImagenPersonal: {
    width: 65,
    height: 65,
    borderRadius: 12,
    backgroundColor: '#383838',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagenPersonal: {
    width: 48,
    height: 48,
  },
  contenidoPersonalizado: {
    flex: 1,
    marginLeft: 13,
  },
  etiquetaPersonalizada: {
    color: '#F28C28',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  tituloPersonalizado: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  descripcionPersonalizado: {
    color: '#AAAAAA',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },
  flechaPersonalizado: {
    color: '#F28C28',
    fontSize: 29,
    marginLeft: 7,
  },

  // BÚSQUEDA
  etiquetaSeccion: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.3,
    marginBottom: 10,
  },
  contenedorBusqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#292929',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#414141',
    paddingHorizontal: 13,
    marginBottom: 23,
    height: 49,
  },
  iconoBusqueda: {
    color: '#F28C28',
    fontSize: 25,
    marginRight: 9,
  },
  busqueda: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 10,
  },
  botonLimpiar: {
    paddingHorizontal: 5,
  },
  textoLimpiar: {
    color: '#AAAAAA',
    fontSize: 23,
  },

  // CATEGORÍAS
  categorias: {
    marginBottom: 24,
  },
  categoriasContenido: {
    gap: 9,
    paddingBottom: 3,
  },
  categoria: {
    backgroundColor: '#292929',
    borderRadius: 20,
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#414141',
  },
  categoriaActiva: {
    backgroundColor: '#F28C28',
    borderColor: '#F28C28',
  },
  textoCategoria: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: '600',
  },
  textoCategoriaActivo: {
    color: '#171717',
    fontWeight: 'bold',
  },

  // RESULTADOS
  resultadosEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tituloResultados: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtituloResultados: {
    color: '#888888',
    fontSize: 11,
    marginTop: 5,
  },
  contador: {
    backgroundColor: '#292929',
    borderRadius: 20,
    minWidth: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F28C28',
  },
  cantidad: {
    color: '#F28C28',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // TARJETAS DE CORTES
  tarjeta: {
    backgroundColor: '#292929',
    borderRadius: 15,
    marginBottom: 17,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  imagenContenedor: {
    width: '100%',
    height: 205,
    backgroundColor: '#343434',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagenCorte: {
    width: '100%',
    height: '100%',
  },
  imagenTexto: {
    color: '#777777',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  etiquetaImagen: {
    position: 'absolute',
    bottom: 11,
    left: 11,
    backgroundColor: 'rgba(23, 23, 23, 0.85)',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  textoEtiquetaImagen: {
    color: '#F28C28',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  contenidoTarjeta: {
    padding: 15,
  },
  nombreCorte: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  descripcion: {
    color: '#AAAAAA',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  divisorTarjeta: {
    height: 1,
    backgroundColor: '#414141',
    marginTop: 15,
    marginBottom: 13,
  },
  pieTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etiquetaPrecio: {
    color: '#888888',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  precio: {
    color: '#F28C28',
    fontSize: 18,
    fontWeight: 'bold',
  },
  botonDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F28C28',
    borderRadius: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  textoBotonDetalle: {
    color: '#171717',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  flechaDetalle: {
    color: '#171717',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 5,
  },

  // ESTADOS
  vacio: {
    alignItems: 'center',
    paddingVertical: 45,
    paddingHorizontal: 20,
  },
  vacioTitulo: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  vacioTexto: {
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    lineHeight: 19,
  },
  cargando: {
    flex: 1,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cargandoCortes: {
    paddingVertical: 35,
  },
  textoCargando: {
    color: '#AAAAAA',
    marginTop: 12,
    fontSize: 13,
  },
  indicadorActualizacion: {
    marginVertical: 15,
  },
});
