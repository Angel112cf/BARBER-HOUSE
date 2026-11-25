import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export default function CampoTexto({
  etiqueta,
  valor,
  cambiarValor,
  placeholder,
  seguro = false,
  teclado = 'default',
  error = '',
  mostrarOjo = false,
}) {
  const [mostrarPassword, setMostrarPassword] = useState(false);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>

      <View
        style={[
          styles.contenedorInput,
          error ? styles.inputError : null,
        ]}
      >
        <TextInput
          style={styles.input}
          value={valor}
          onChangeText={cambiarValor}
          placeholder={placeholder}
          placeholderTextColor="#888888"
          secureTextEntry={seguro && !mostrarPassword}
          keyboardType={teclado}
          autoCapitalize={
            teclado === 'email-address' ? 'none' : 'sentences'
          }
        />

        {seguro && mostrarOjo && (
          <TouchableOpacity
            style={styles.botonOjo}
            onPress={() => setMostrarPassword(!mostrarPassword)}
            activeOpacity={0.7}
          >
            <Text style={styles.iconoOjo}>
              {mostrarPassword ? '◉' : '◎'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={styles.textoError}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginBottom: 14,
  },
  etiqueta: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 7,
  },
  contenedorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#292929',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 9,
  },
  inputError: {
    borderColor: '#E53935',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    padding: 12,
    fontSize: 15,
  },
  botonOjo: {
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  iconoOjo: {
    color: '#F28C28',
    fontSize: 22,
    fontWeight: 'bold',
  },
  textoError: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 2,
  },
});
