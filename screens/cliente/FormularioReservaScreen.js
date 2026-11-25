import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { supabase } from '../../services/supabase';

import {
  obtenerHorariosDisponibles,
  registrarReserva,
  cancelarReserva,
  actualizarImagenReferenciaReserva,
} from '../../services/reservaService';

export default function FormularioReservaScreen({ navigation, route }) {
  // Conservamos todos los datos recibidos desde las pantallas anteriores.
  const datosReserva = route.params || {};

  const {
    barbero,
    corte,
    modalidad,
    incluyeBarba,
    precioBase,
    precio,
  } = datosReserva;

  const [fecha, setFecha] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [consultando, setConsultando] = useState(false);
  const [fechaConsultada, setFechaConsultada] = useState('');
  const [registrando, setRegistrando] = useState(false);

  // Convertir DD/MM/AAAA a AAAA-MM-DD y comprobar que exista.
  function convertirFecha(fechaIngresada) {
    if (!/^(\d{2})\/(\d{2})\/(\d{4})$/.test(fechaIngresada)) {
      return null;
    }

    const [dia, mes, anio] = fechaIngresada.split('/').map(Number);
    const comprobacion = new Date(anio, mes - 1, dia);

    if (
      comprobacion.getFullYear() !== anio ||
      comprobacion.getMonth() !== mes - 1 ||
      comprobacion.getDate() !== dia
    ) {
      return null;
    }

    return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  // Subir la fotografía a una carpeta identificada por la reserva.
  async function subirImagenReferencia(uri, reservaId) {
    const extensionEncontrada = uri.match(/\.(jpg|jpeg|png|webp)(?:\?|$)/i);
    const extension = extensionEncontrada
      ? extensionEncontrada[1].toLowerCase()
      : 'jpg';

    const tipoContenido = extension === 'png'
      ? 'image/png'
      : extension === 'webp'
        ? 'image/webp'
        : 'image/jpeg';

    const rutaArchivo = `${reservaId}/referencia.${extension}`;

    const respuesta = await fetch(uri);
    const archivo = await respuesta.arrayBuffer();

    const { error } = await supabase.storage
      .from('referencias-reservas')
      .upload(rutaArchivo, archivo, {
        contentType: tipoContenido,
        upsert: false,
      });

    if (error) throw error;

    return rutaArchivo;
  }

  // Consultar la disponibilidad directamente en Supabase.
  const consultarHorarios = async () => {
    if (!barbero?.id || !corte) {
      Alert.alert(
        'Datos incompletos',
        'Faltan los datos del barbero o del servicio seleccionado.'
      );
      return;
    }

    const fechaISO = convertirFecha(fecha);

    if (!fechaISO) {
      Alert.alert(
        'Fecha incorrecta',
        'Ingresa una fecha válida con el formato DD/MM/AAAA.'
      );
      return;
    }

    setConsultando(true);
    setHorarios([]);
    setHoraSeleccionada('');
    setFechaConsultada('');

    try {
      const resultado = await obtenerHorariosDisponibles(
        barbero.id,
        fechaISO
      );

      setHorarios(resultado);
      setFechaConsultada(fechaISO);

      if (resultado.length === 0) {
        Alert.alert(
          'Sin horarios disponibles',
          'No hay horarios para la fecha seleccionada.'
        );
      }
   
    
    } catch (error) {
      if (error.message?.includes('No puedes consultar fechas pasadas')) {
        Alert.alert(
          'Fecha no válida',
          'No puedes consultar fechas pasadas. Selecciona una fecha válida.'
        );
      } else if (error.message?.includes('próximos 30 días')) {
        Alert.alert(
          'Fecha fuera de límite',
          'Solo puedes consultar horarios dentro de los próximos 30 días.'
        );
      } else {
        console.error('ERROR AL CONSULTAR HORARIOS:', error);

        Alert.alert(
          'No se pudo consultar',
          error.message || 'Ocurrió un problema al consultar los horarios.'
        );
      }
    } finally {
      setConsultando(false);
    }


  };

  // Registrar la reserva y guardar la fotografía si corresponde.
  const continuar = async () => {
    if (!horaSeleccionada || !fechaConsultada) {
      Alert.alert(
        'Selecciona un horario',
        'Primero debes consultar y seleccionar un horario disponible.'
      );
      return;
    }

    if (
      modalidad === 'domicilio' &&
      (
        datosReserva.latitud == null ||
        datosReserva.longitud == null ||
        !datosReserva.direccion
      )
    ) {
      Alert.alert(
        'Ubicación incompleta',
        'Debes seleccionar una ubicación y proporcionar una dirección para el servicio a domicilio.'
      );
      return;
    }

    if (
      datosReserva.cortePersonalizado &&
      !datosReserva.imagenReferencia
    ) {
      Alert.alert(
        'Imagen necesaria',
        'Debes seleccionar una fotografía de referencia para tu corte personalizado.'
      );
      return;
    }

    const corteId = corte?.id ?? corte?.corte_id;

    if (!corteId || !barbero?.id) {
      Alert.alert(
        'Datos incompletos',
        'No se encontró el identificador del corte o del barbero.'
      );
      return;
    }

    setRegistrando(true);

    let reservaId = null;
    let rutaImagenSubida = null;
    let clienteId = null;

    try {
      // Obtener el usuario autenticado.
      const { data: usuarioData, error: errorUsuario } =
        await supabase.auth.getUser();

      if (errorUsuario) throw errorUsuario;

      const usuario = usuarioData.user;

      if (!usuario) {
        throw new Error('No hay una sesión de usuario activa.');
      }

      clienteId = usuario.id;

      // Crear primero la reserva sin guardar la ruta de la imagen.
      const nuevaReserva = {
        cliente_id: usuario.id,
        barbero_id: barbero.id,
        corte_id: corteId,
        servicio: datosReserva.cortePersonalizado
          ? 'Corte personalizado'
          : corte.nombre,
        fecha: fechaConsultada,
        hora: horaSeleccionada,
        modalidad: modalidad,
        precio_base: Number(precioBase),
        precio: Number(precio),
        incluye_barba: Boolean(incluyeBarba),
        estado: 'pendiente de realizar',
        latitud: modalidad === 'domicilio'
          ? datosReserva.latitud
          : null,
        longitud: modalidad === 'domicilio'
          ? datosReserva.longitud
          : null,
        direccion_referencia: modalidad === 'domicilio'
          ? datosReserva.direccion
          : null,
        imagen_referencia: null,
      };

      const resultado = await registrarReserva(nuevaReserva);

      if (!resultado?.id) {
        throw new Error(
          'No se recibió el identificador de la reserva registrada.'
        );
      }

      reservaId = resultado.id;

            // Subir la fotografía y guardar su ruta en la reserva.
        if (datosReserva.cortePersonalizado) {
          rutaImagenSubida = await subirImagenReferencia(
            datosReserva.imagenReferencia,
            reservaId
          );

          await actualizarImagenReferenciaReserva(
            reservaId,
            rutaImagenSubida
          );
        }

      // Enviar el UUID generado a la pantalla de confirmación.
      navigation.navigate('ConfirmacionReserva', {
        reservaId,
      });
    } catch (error) {
      console.error('ERROR AL REGISTRAR RESERVA:', error);

      // Intentar eliminar la fotografía si ya se había subido.
      if (rutaImagenSubida) {
        const { error: errorEliminar } = await supabase.storage
          .from('referencias-reservas')
          .remove([rutaImagenSubida]);

        if (errorEliminar) {
          console.error(
            'NO SE PUDO ELIMINAR LA IMAGEN:',
            errorEliminar
          );
        }
      }

      // Cancelar la reserva si el proceso quedó incompleto.
      if (reservaId && clienteId) {
        try {
          await cancelarReserva(reservaId, clienteId);
        } catch (errorCancelacion) {
          console.error(
            'NO SE PUDO CANCELAR LA RESERVA INCOMPLETA:',
            errorCancelacion
          );
        }
      }

      Alert.alert(
        'No se pudo registrar la reserva',
        error.message || 'Ocurrió un problema al guardar tu reserva.'
      );
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
    >
      <Text style={styles.titulo}>Programar reserva</Text>

      <View style={styles.tarjeta}>
        <Text style={styles.subtitulo}>Resumen de tu servicio</Text>

        <Text style={styles.etiqueta}>Corte seleccionado</Text>
        <Text style={styles.valor}>
          {datosReserva.cortePersonalizado
            ? 'Corte personalizado'
            : corte?.nombre || 'No disponible'}
        </Text>

        <Text style={styles.etiqueta}>Barbero</Text>
        <Text style={styles.valor}>
          {barbero?.nombre || 'No disponible'}
        </Text>

        <Text style={styles.etiqueta}>Modalidad</Text>
        <Text style={styles.valor}>
          {modalidad === 'domicilio' ? 'A domicilio' : 'En local'}
        </Text>

        <Text style={styles.etiqueta}>Servicio de barba</Text>
        <Text style={styles.valor}>
          {incluyeBarba ? 'Incluido' : 'No incluido'}
        </Text>

        <View style={styles.separador} />

        <View style={styles.filaTotal}>
          <Text style={styles.totalEtiqueta}>Total a pagar</Text>
          <Text style={styles.total}>
            Bs. {Number(precio || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.subtitulo}>Fecha y hora</Text>

        <Text style={styles.etiqueta}>Fecha de la reserva</Text>

        <TextInput
          style={styles.input}
          placeholder="DD/MM/AAAA"
          placeholderTextColor="#888888"
          value={fecha}
          onChangeText={(valor) => {
            setFecha(valor);
            setHorarios([]);
            setHoraSeleccionada('');
            setFechaConsultada('');
          }}
          keyboardType="default"
          maxLength={10}
        />

        <TouchableOpacity
          style={[
            styles.botonConsultar,
            consultando && styles.botonDeshabilitado,
          ]}
          onPress={consultarHorarios}
          disabled={consultando}
        >
          {consultando ? (
            <ActivityIndicator color="#171717" />
          ) : (
            <Text style={styles.textoBotonConsultar}>
              CONSULTAR HORARIOS
            </Text>
          )}
        </TouchableOpacity>

        {fechaConsultada ? (
          <>
            <Text style={styles.etiquetaHorarios}>
              Horarios para la fecha seleccionada
            </Text>

            <View style={styles.listaHorarios}>
              {horarios.map((item) => {
                const hora = String(item.hora).substring(0, 5);
                const disponible = item.disponible;
                const seleccionado = horaSeleccionada === hora;

                return (
                  <TouchableOpacity
                    key={hora}
                    style={[
                      styles.botonHora,
                      !disponible && styles.horaOcupada,
                      seleccionado && styles.horaSeleccionada,
                    ]}
                    disabled={!disponible}
                    onPress={() => setHoraSeleccionada(hora)}
                  >
                    <Text
                      style={[
                        styles.textoHora,
                        !disponible && styles.textoHoraOcupada,
                        seleccionado && styles.textoHoraSeleccionada,
                      ]}
                    >
                      {hora}
                    </Text>

                    <Text
                      style={[
                        styles.estadoHora,
                        !disponible && styles.textoHoraOcupada,
                        seleccionado && styles.textoHoraSeleccionada,
                      ]}
                    >
                      {!disponible
                        ? 'Ocupado'
                        : seleccionado
                          ? 'Seleccionado'
                          : 'Disponible'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : null}

        <Text style={styles.ayuda}>
          Horarios de atención:
          {'\n'}Mañana: 08:00 a 12:00
          {'\n'}Tarde: 15:00 a 22:00
          {'\n\n'}La disponibilidad se consulta directamente en BARBER HOUSE.
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.boton,
          (!horaSeleccionada || registrando) &&
            styles.botonDeshabilitado,
        ]}
        onPress={continuar}
        disabled={!horaSeleccionada || registrando}
      >
        {registrando ? (
          <ActivityIndicator color="#171717" />
        ) : (
          <Text style={styles.textoBoton}>
            CONTINUAR A CONFIRMACIÓN
          </Text>
        )}
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
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  tarjeta: {
    backgroundColor: '#292929',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
  },
  subtitulo: {
    color: '#F28C28',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  etiqueta: {
    color: '#AAAAAA',
    fontSize: 13,
    marginBottom: 5,
  },
  valor: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 14,
  },
  separador: {
    height: 1,
    backgroundColor: '#444444',
    marginVertical: 12,
  },
  filaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalEtiqueta: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  total: {
    color: '#F28C28',
    fontSize: 21,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#555555',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 16,
    padding: 13,
    marginBottom: 15,
  },
  botonConsultar: {
    backgroundColor: '#F28C28',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  textoBotonConsultar: {
    color: '#171717',
    fontSize: 14,
    fontWeight: 'bold',
  },
  etiquetaHorarios: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  listaHorarios: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  botonHora: {
    width: '30%',
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#F28C28',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  horaOcupada: {
    borderColor: '#555555',
    backgroundColor: '#242424',
  },
  horaSeleccionada: {
    backgroundColor: '#F28C28',
    borderColor: '#F28C28',
  },
  textoHora: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  estadoHora: {
    color: '#AAAAAA',
    fontSize: 10,
    marginTop: 4,
  },
  textoHoraOcupada: {
    color: '#777777',
  },
  textoHoraSeleccionada: {
    color: '#171717',
  },
  ayuda: {
    color: '#AAAAAA',
    fontSize: 13,
    lineHeight: 21,
  },
  boton: {
    backgroundColor: '#F28C28',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 5,
  },
  botonDeshabilitado: {
    backgroundColor: '#555555',
  },
  textoBoton: {
    color: '#171717',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
