import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
} from '../../services/adminService';

const NARANJA = '#F28C28';
const FONDO = '#111111';
const TARJETA = '#202020';
const TEXTO = '#FFFFFF';
const GRIS = '#BDBDBD';

const ROLES = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'cliente', texto: 'Clientes' },
  { valor: 'barbero', texto: 'Barberos' },
  { valor: 'admin', texto: 'Administradores' },
];

const FORMULARIO_INICIAL = {
  nombre: '',
  correo: '',
  telefono: '',
  password: '',
  rol: 'cliente',
  ci: '',
  direccion: '',
  fecha_nacimiento: '',
  foto_url: '',
  especialidad: '',
};

export default function GestionUsuariosScreen() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [rol, setRol] = useState('todos');
  const [estado, setEstado] = useState('todos');

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({});

  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);

  // Esperar a que el usuario termine de escribir.
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setBusquedaAplicada(busqueda.trim());
    }, 400);

    return () => clearTimeout(temporizador);
  }, [busqueda]);

  // Actualizar un campo y quitar su error al corregirlo.
  const actualizarCampo = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));

    setErrores((actuales) => ({
      ...actuales,
      [campo]: '',
    }));
  };

  
function validarFormulario() {
  const nuevosErrores = {};

  const nombre = formulario.nombre.trim();
  const correo = formulario.correo.trim();
  const telefono = formulario.telefono.trim();
  const password = formulario.password;

  // Validar nombre.
  if (!nombre) {
    nuevosErrores.nombre = 'Ingresa el nombre completo.';
  } else if (nombre.length < 3) {
    nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres.';
  } else if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'-]+$/.test(nombre)) {
    nuevosErrores.nombre = 'El nombre contiene caracteres no válidos.';
  }

  // Validar correo.
  const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!correo) {
    nuevosErrores.correo = 'Ingresa el correo electrónico.';
  } else if (correo.length > 254 || !formatoCorreo.test(correo)) {
    nuevosErrores.correo = 'Ingresa un correo electrónico válido.';
  }

  // Validar teléfono: exactamente 8 dígitos.
  const numeroTelefono = telefono.replace(/\D/g, '');

  if (!telefono) {
    nuevosErrores.telefono = 'Ingresa el número de teléfono.';
  } else if (
    !/^[+0-9().\s-]+$/.test(telefono) ||
    numeroTelefono.length !== 8
  ) {
    nuevosErrores.telefono = 'El teléfono debe contener exactamente 8 dígitos.';
  }

  // Validar rol.
  if (!['cliente', 'barbero', 'admin'].includes(formulario.rol)) {
    nuevosErrores.rol = 'Selecciona un tipo de usuario válido.';
  }

  // Contraseña obligatoria al crear y opcional al editar.
  if (!usuarioEditar && !password) {
    nuevosErrores.password = 'Ingresa una contraseña.';
  } else if (password && password.length < 6) {
    nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres.';
  } else if (password && password.length > 72) {
    nuevosErrores.password = 'La contraseña no debe superar los 72 caracteres.';
  }

  // Validaciones para barberos.
  if (formulario.rol === 'barbero') {
    const ci = formulario.ci.trim();
    const direccion = formulario.direccion.trim();
    const fecha = formulario.fecha_nacimiento.trim();
    const especialidad = formulario.especialidad.trim();
    const foto = formulario.foto_url.trim();

    if (!ci) {
      nuevosErrores.ci = 'Ingresa el número de CI.';
    } else if (!/^[0-9]{5,15}$/.test(ci)) {
      nuevosErrores.ci = 'El CI debe contener entre 5 y 15 números.';
    }

    if (!direccion) {
      nuevosErrores.direccion = 'Ingresa la dirección del barbero.';
    } else if (direccion.length < 5) {
      nuevosErrores.direccion = 'La dirección es demasiado corta.';
    }

    if (!fecha) {
      nuevosErrores.fecha_nacimiento = 'Ingresa la fecha de nacimiento.';
    } else {
      const coincidencia = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);

      if (!coincidencia) {
        nuevosErrores.fecha_nacimiento = 'Utiliza el formato AAAA-MM-DD.';
      } else {
        const anio = Number(coincidencia[1]);
        const mes = Number(coincidencia[2]);
        const dia = Number(coincidencia[3]);

        const fechaComprobada = new Date(anio, mes - 1, dia);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const fechaValida =
          fechaComprobada.getFullYear() === anio &&
          fechaComprobada.getMonth() === mes - 1 &&
          fechaComprobada.getDate() === dia;

        if (!fechaValida) {
          nuevosErrores.fecha_nacimiento = 'La fecha no existe.';
        } else if (fechaComprobada >= hoy) {
          nuevosErrores.fecha_nacimiento = 'La fecha debe ser anterior a hoy.';
        }
      }
    }

    if (!especialidad) {
      nuevosErrores.especialidad = 'Ingresa la especialidad del barbero.';
    } else if (especialidad.length < 3) {
      nuevosErrores.especialidad = 'La especialidad debe tener al menos 3 caracteres.';
    }

    if (foto) {
      if (!/^https?:\/\/[^\s]+\.[^\s]+$/i.test(foto)) {
        nuevosErrores.foto_url = 'Ingresa una URL de imagen válida (https://...).';
      }
    }
  }

  setErrores(nuevosErrores);

  return Object.keys(nuevosErrores).length === 0;
}

  // Consultar usuarios en Supabase.
  const cargarUsuarios = useCallback(async (
    numeroPagina = 1,
    agregar = false
  ) => {
    try {
      if (agregar) {
        setCargandoMas(true);
      } else if (numeroPagina === 1) {
        setCargando(true);
      }

      const resultado = await listarUsuarios({
        pagina: numeroPagina,
        limite: 50,
        rol: rol === 'todos' ? undefined : rol,
        activo:
          estado === 'todos'
            ? undefined
            : estado === 'activos',
        buscar: busquedaAplicada,
      });

      setUsuarios((actuales) =>
        agregar
          ? [...actuales, ...resultado.usuarios]
          : resultado.usuarios
      );

      setPagina(resultado.pagina);
      setTotalPaginas(resultado.totalPaginas || 1);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);

      Alert.alert(
        'Error',
        error.message || 'No se pudieron cargar los usuarios.'
      );
    } finally {
      setCargando(false);
      setActualizando(false);
      setCargandoMas(false);
    }
  }, [rol, estado, busquedaAplicada]);

  useEffect(() => {
    cargarUsuarios(1);
  }, [cargarUsuarios]);

  // Abrir formulario para crear un usuario.
  function abrirNuevoUsuario() {
    setUsuarioEditar(null);
    setFormulario({ ...FORMULARIO_INICIAL });
    setErrores({});
    setModalVisible(true);
  }

  // Abrir formulario para editar un usuario.
  function abrirEdicion(usuario) {
    setUsuarioEditar(usuario);
    setErrores({});

    setFormulario({
      nombre: usuario.nombre || '',
      correo: usuario.correo || '',
      telefono: usuario.telefono || '',
      password: '',
      rol: usuario.rol,
      ci: usuario.ci || '',
      direccion: usuario.direccion || '',
      fecha_nacimiento: usuario.fecha_nacimiento || '',
      foto_url: usuario.foto_url || '',
      especialidad: usuario.especialidad || '',
    });

    setModalVisible(true);
  }

  // Crear o actualizar un usuario.
  async function guardarUsuario() {
    if (!validarFormulario()) {
      return;
    }

    const datos = {
      nombre: formulario.nombre.trim(),
      correo: formulario.correo.trim().toLowerCase(),
      telefono: formulario.telefono.trim(),
      rol: formulario.rol,
    };

    if (formulario.password) {
      datos.password = formulario.password;
    }

    // Los datos profesionales solo corresponden a barberos.
    if (formulario.rol === 'barbero') {
      datos.ci = formulario.ci.trim();
      datos.direccion = formulario.direccion.trim();
      datos.fecha_nacimiento = formulario.fecha_nacimiento.trim();
      datos.especialidad = formulario.especialidad.trim();
      datos.foto_url = formulario.foto_url.trim() || null;
    }

    try {
      setGuardando(true);

      if (usuarioEditar) {
        await actualizarUsuario({
          id: usuarioEditar.id,
          ...datos,
        });

        Alert.alert('Éxito', 'Usuario actualizado correctamente.');
      } else {
        await crearUsuario(datos);

        Alert.alert('Éxito', 'Usuario creado correctamente.');
      }

      setModalVisible(false);
      setErrores({});
      await cargarUsuarios(1);
    } catch (error) {
      console.error('Error al guardar usuario:', error);

      Alert.alert(
        'No se pudo guardar',
        error.message || 'Ocurrió un error al guardar el usuario.'
      );
    } finally {
      setGuardando(false);
    }
  }

  // Activar o inactivar una cuenta.
  function confirmarCambioEstado(usuario) {
    const nuevoEstado = !usuario.activo;

    Alert.alert(
      nuevoEstado ? 'Activar cuenta' : 'Inactivar cuenta',
      nuevoEstado
        ? `¿Deseas activar la cuenta de ${usuario.nombre}?`
        : `¿Deseas inactivar la cuenta de ${usuario.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: nuevoEstado ? 'Activar' : 'Inactivar',
          style: nuevoEstado ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await cambiarEstadoUsuario(
                usuario.id,
                nuevoEstado
              );

              await cargarUsuarios(1);

              Alert.alert(
                'Éxito',
                nuevoEstado
                  ? 'La cuenta fue activada.'
                  : 'La cuenta fue inactivada.'
              );
            } catch (error) {
              Alert.alert(
                'Error',
                error.message || 'No se pudo cambiar el estado.'
              );
            }
          },
        },
      ]
    );
  }

  // Cargar la siguiente página.
  function cargarMas() {
    if (pagina < totalPaginas && !cargandoMas) {
      cargarUsuarios(pagina + 1, true);
    }
  }

  function nombreRol(valor) {
    if (valor === 'admin') return 'Administrador';
    if (valor === 'barbero') return 'Barbero';
    return 'Cliente';
  }

  // Campo de texto con validación individual.
  function campo(titulo, propiedad, opciones = {}) {
    return (
      <View style={styles.grupoCampo}>
        <Text style={styles.etiqueta}>{titulo}</Text>

        <TextInput
          style={[
            styles.input,
            errores[propiedad] && styles.inputError,
          ]}
          value={formulario[propiedad]}
          onChangeText={(valor) =>
            actualizarCampo(propiedad, valor)
          }
          placeholder={opciones.placeholder || titulo}
          placeholderTextColor="#777777"
          keyboardType={opciones.teclado || 'default'}
          secureTextEntry={opciones.seguro || false}
          autoCapitalize={opciones.mayusculas || 'sentences'}
        />

        {errores[propiedad] ? (
          <Text style={styles.textoError}>
            {errores[propiedad]}
          </Text>
        ) : null}
      </View>
    );
  }

  // Selector del tipo de usuario.
  function selectorRol() {
    return (
      <View style={styles.grupoCampo}>
        <Text style={styles.etiqueta}>Tipo de usuario</Text>

        <View style={styles.opcionesRol}>
          {ROLES.filter((item) => item.valor !== 'todos').map((item) => (
            <TouchableOpacity
              key={item.valor}
              style={[
                styles.opcionRol,
                formulario.rol === item.valor && styles.opcionSeleccionada,
              ]}
              onPress={() => actualizarCampo('rol', item.valor)}
            >
              <Text
                style={[
                  styles.textoOpcionRol,
                  formulario.rol === item.valor &&
                    styles.textoOpcionSeleccionada,
                ]}
              >
                {item.texto}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {errores.rol ? (
          <Text style={styles.textoError}>{errores.rol}</Text>
        ) : null}
      </View>
    );
  }
    return (
    <SafeAreaView
      style={styles.contenedor}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() => {
              setActualizando(true);
              cargarUsuarios(1);
            }}
            tintColor={NARANJA}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.encabezado}>
          <View>
            <Text style={styles.titulo}>Usuarios</Text>
            <Text style={styles.subtitulo}>
              Administración de cuentas
            </Text>
          </View>

          <TouchableOpacity
            style={styles.botonNuevo}
            onPress={abrirNuevoUsuario}
          >
            <Text style={styles.textoBotonNuevo}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resumen}>
          <Text style={styles.numeroUsuarios}>
            {usuarios.length}
          </Text>
          <Text style={styles.textoResumen}>
            Usuarios cargados
          </Text>
        </View>

        <TextInput
          style={styles.busqueda}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por nombre, correo o CI..."
          placeholderTextColor="#888888"
          autoCapitalize="none"
        />

        <Text style={styles.tituloFiltro}>Tipo de cuenta</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtros}
        >
          {ROLES.map((item) => (
            <TouchableOpacity
              key={item.valor}
              style={[
                styles.filtro,
                rol === item.valor && styles.filtroActivo,
              ]}
              onPress={() => setRol(item.valor)}
            >
              <Text
                style={[
                  styles.textoFiltro,
                  rol === item.valor && styles.textoFiltroActivo,
                ]}
              >
                {item.texto}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.tituloFiltro}>Estado de la cuenta</Text>

        <View style={styles.filtros}>
          {[
            { valor: 'todos', texto: 'Todos' },
            { valor: 'activos', texto: 'Activos' },
            { valor: 'inactivos', texto: 'Inactivos' },
          ].map((item) => (
            <TouchableOpacity
              key={item.valor}
              style={[
                styles.filtro,
                estado === item.valor && styles.filtroActivo,
              ]}
              onPress={() => setEstado(item.valor)}
            >
              <Text
                style={[
                  styles.textoFiltro,
                  estado === item.valor && styles.textoFiltroActivo,
                ]}
              >
                {item.texto}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.seccionLista}>
          <Text style={styles.tituloLista}>Listado de usuarios</Text>

          {cargando ? (
            <ActivityIndicator
              size="large"
              color={NARANJA}
              style={styles.cargando}
            />
          ) : usuarios.length === 0 ? (
            <View style={styles.vacio}>
              <Text style={styles.textoVacio}>
                No se encontraron usuarios.
              </Text>
            </View>
          ) : (
            usuarios.map((usuario) => (
              <View style={styles.tarjetaUsuario} key={usuario.id}>
                <View style={styles.filaUsuario}>
                  <View style={styles.datosUsuario}>
                    <Text style={styles.nombreUsuario}>
                      {usuario.nombre}
                    </Text>

                    <Text style={styles.correoUsuario}>
                      {usuario.correo}
                    </Text>

                    <Text style={styles.telefonoUsuario}>
                      {usuario.telefono}
                    </Text>

                    {usuario.ci ? (
                      <Text style={styles.telefonoUsuario}>
                        CI: {usuario.ci}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.etiquetasUsuario}>
                    <Text style={styles.etiquetaRol}>
                      {nombreRol(usuario.rol)}
                    </Text>

                    <Text
                      style={[
                        styles.estadoUsuario,
                        usuario.activo
                          ? styles.estadoActivo
                          : styles.estadoInactivo,
                      ]}
                    >
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                </View>

                <View style={styles.botonesUsuario}>
                  <TouchableOpacity
                    style={styles.botonEditar}
                    onPress={() => abrirEdicion(usuario)}
                  >
                    <Text style={styles.textoBotonEditar}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.botonEstado,
                      usuario.activo
                        ? styles.botonInactivar
                        : styles.botonActivar,
                    ]}
                    onPress={() => confirmarCambioEstado(usuario)}
                  >
                    <Text style={styles.textoBotonEstado}>
                      {usuario.activo ? 'Inactivar' : 'Activar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {pagina < totalPaginas && !cargando && (
            <TouchableOpacity
              style={styles.botonCargarMas}
              onPress={cargarMas}
              disabled={cargandoMas}
            >
              {cargandoMas ? (
                <ActivityIndicator color={NARANJA} />
              ) : (
                <Text style={styles.textoCargarMas}>
                  Cargar más usuarios
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        statusBarTranslucent={false}
        onRequestClose={() => {
          setModalVisible(false);
          setErrores({});
        }}
      >
        <SafeAreaView
          style={styles.modalContenedor}
          edges={['top', 'bottom', 'left', 'right']}
        >
          <KeyboardAvoidingView
            style={styles.modalContenedor}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <View style={styles.encabezadoModal}>
              <Text style={styles.tituloModal}>
                {usuarioEditar ? 'Editar usuario' : 'Nuevo usuario'}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setErrores({});
                }}
              >
                <Text style={styles.cerrarModal}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.formulario}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {campo('Nombre completo', 'nombre')}

              {campo('Correo electrónico', 'correo', {
                teclado: 'email-address',
                mayusculas: 'none',
              })}

              {campo('Teléfono', 'telefono', {
                teclado: 'phone-pad',
              })}

              {campo(
                usuarioEditar
                  ? 'Nueva contraseña (opcional)'
                  : 'Contraseña',
                'password',
                {
                  seguro: true,
                  mayusculas: 'none',
                }
              )}

              {selectorRol()}

              {formulario.rol === 'barbero' && (
                <>
                  <Text style={styles.tituloAdicional}>
                    Información profesional
                  </Text>

                  {campo('Número de CI', 'ci', {
                    teclado: 'numeric',
                    mayusculas: 'none',
                  })}

                  {campo('Dirección', 'direccion')}

                  {campo(
                    'Fecha de nacimiento (AAAA-MM-DD)',
                    'fecha_nacimiento',
                    {
                      placeholder: 'Ejemplo: 1998-05-20',
                      mayusculas: 'none',
                    }
                  )}

                  {campo('Especialidad', 'especialidad')}

                  {campo('URL de fotografía (opcional)', 'foto_url', {
                    mayusculas: 'none',
                    teclado: 'url',
                  })}
                </>
              )}

              <TouchableOpacity
                style={[
                  styles.botonGuardar,
                  guardando && styles.botonDeshabilitado,
                ]}
                onPress={guardarUsuario}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator color="#171717" />
                ) : (
                  <Text style={styles.textoGuardar}>
                    {usuarioEditar
                      ? 'GUARDAR CAMBIOS'
                      : 'CREAR USUARIO'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: FONDO,
  },
  contenido: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 42,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  titulo: {
    color: TEXTO,
    fontSize: 27,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: GRIS,
    fontSize: 14,
    marginTop: 5,
  },
  botonNuevo: {
    backgroundColor: NARANJA,
    borderRadius: 9,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  textoBotonNuevo: {
    color: FONDO,
    fontWeight: 'bold',
  },
  resumen: {
    backgroundColor: '#202020',
    borderRadius: 15,
    padding: 19,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#383838',
  },
  numeroUsuarios: {
    color: NARANJA,
    fontSize: 27,
    fontWeight: 'bold',
  },
  textoResumen: {
    color: GRIS,
    marginTop: 3,
  },
  busqueda: {
    backgroundColor: '#202020',
    color: TEXTO,
    borderRadius: 12,
    padding: 15,
    fontSize: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#383838',
  },
  tituloFiltro: {
    color: TEXTO,
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 10,
  },
  filtros: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 19,
  },
  filtro: {
    backgroundColor: TARJETA,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  filtroActivo: {
    backgroundColor: NARANJA,
  },
  textoFiltro: {
    color: GRIS,
    fontSize: 13,
    fontWeight: '600',
  },
  textoFiltroActivo: {
    color: FONDO,
  },
  seccionLista: {
    marginTop: 5,
  },
  tituloLista: {
    color: TEXTO,
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  cargando: {
    marginVertical: 35,
  },
  vacio: {
    backgroundColor: TARJETA,
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
  },
  textoVacio: {
    color: GRIS,
  },
  tarjetaUsuario: {
    backgroundColor: '#202020',
    padding: 17,
    borderRadius: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#383838',
  },
  filaUsuario: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  datosUsuario: {
    flex: 1,
  },
  nombreUsuario: {
    color: TEXTO,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  correoUsuario: {
    color: GRIS,
    fontSize: 13,
    marginBottom: 4,
  },
  telefonoUsuario: {
    color: '#999999',
    fontSize: 12,
    marginTop: 3,
  },
  etiquetasUsuario: {
    alignItems: 'flex-end',
    gap: 8,
  },
  etiquetaRol: {
    color: NARANJA,
    fontSize: 11,
    fontWeight: 'bold',
  },
  estadoUsuario: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 12,
    overflow: 'hidden',
  },
  estadoActivo: {
    color: '#75D69A',
    backgroundColor: '#183D2A',
  },
  estadoInactivo: {
    color: '#FF8585',
    backgroundColor: '#482222',
  },
  botonesUsuario: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 17,
    borderTopWidth: 1,
    borderTopColor: '#414141',
    paddingTop: 13,
  },
  botonEditar: {
    flex: 1,
    borderWidth: 1,
    borderColor: NARANJA,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  textoBotonEditar: {
    color: NARANJA,
    fontWeight: 'bold',
  },
  botonEstado: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  botonInactivar: {
    backgroundColor: '#55302A',
  },
  botonActivar: {
    backgroundColor: '#245239',
  },
  textoBotonEstado: {
    color: TEXTO,
    fontWeight: 'bold',
  },
  botonCargarMas: {
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  textoCargarMas: {
    color: NARANJA,
    fontWeight: 'bold',
  },
  modalContenedor: {
    flex: 1,
    backgroundColor: FONDO,
  },
  encabezadoModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#393939',
  },
  tituloModal: {
    color: TEXTO,
    fontSize: 21,
    fontWeight: 'bold',
  },
  cerrarModal: {
    color: NARANJA,
    fontWeight: 'bold',
  },
  formulario: {
    padding: 20,
    paddingBottom: 45,
  },
  grupoCampo: {
    marginBottom: 17,
  },
  etiqueta: {
    color: GRIS,
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#202020',
    color: TEXTO,
    borderRadius: 11,
    padding: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#3B3B3B',
  },
  inputError: {
    borderColor: '#FF4545',
    borderWidth: 1.5,
  },
  textoError: {
    color: '#FF5555',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 3,
    fontWeight: '500',
  },
  opcionesRol: {
    flexDirection: 'row',
    gap: 8,
  },
  opcionRol: {
    flex: 1,
    backgroundColor: TARJETA,
    padding: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  opcionSeleccionada: {
    backgroundColor: NARANJA,
  },
  textoOpcionRol: {
    color: GRIS,
    fontSize: 12,
    fontWeight: 'bold',
  },
  textoOpcionSeleccionada: {
    color: FONDO,
  },
  tituloAdicional: {
    color: NARANJA,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 15,
  },
  botonGuardar: {
    backgroundColor: NARANJA,
    padding: 16,
    borderRadius: 9,
    alignItems: 'center',
    marginTop: 12,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoGuardar: {
    color: FONDO,
    fontWeight: 'bold',
    fontSize: 14,
  },
});