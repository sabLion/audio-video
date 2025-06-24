import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Button, Image, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Audio } from 'expo-av';

export default function App() {
  const [temPermissaoCamera, setTemPermissaoCamera] = useState(null);
  const [temPermissaoAudio, setTemPermissaoAudio] = useState(null);

  const cameraRef = useRef(null);
  const [uriDaImagem, setUriDaImagem] = useState(null);
  const [cameraPronta, setCameraPronta] = useState(false);
  const [tipoCamera, setTipoCamera] = useState(CameraType.back); // NOVO

  const [gravacao, setGravacao] = useState(null);
  const [som, setSom] = useState(null);
  const [uriDaGravacao, setUriDaGravacao] = useState(null);

  useEffect(() => {
    (async () => {
      const statusCamera = await Camera.requestCameraPermissionsAsync();
      setTemPermissaoCamera(statusCamera.status === 'granted');

      const statusAudio = await Audio.requestPermissionsAsync();
      setTemPermissaoAudio(statusAudio.status === 'granted');
    })();
  }, []);

  useEffect(() => {
    return som
      ? () => {
          som.unloadAsync();
        }
      : undefined;
  }, [som]);

  async function iniciarGravacao() {
    try {
      if (!temPermissaoAudio) {
        Alert.alert("Erro", "Permissão de áudio não concedida.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setGravacao(recording);
    } catch (err) {
      console.error('Erro ao iniciar gravação', err);
    }
  }

  async function pararGravacao() {
    if (!gravacao) return;
    setGravacao(undefined);
    await gravacao.stopAndUnloadAsync();
    const uri = gravacao.getURI();
    setUriDaGravacao(uri);
  }

  async function reproduzirSom() {
    if (!uriDaGravacao) {
      Alert.alert('Aviso', 'Nenhum áudio foi gravado ainda.');
      return;
    }

    const { sound } = await Audio.Sound.createAsync({ uri: uriDaGravacao });
    setSom(sound);
    await sound.playAsync();
  }

  async function tirarFoto() {
    if (cameraRef.current && cameraPronta) {
      try {
        const foto = await cameraRef.current.takePictureAsync();
        setUriDaImagem(foto.uri);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível tirar a foto.');
      }
    } else {
      Alert.alert('Aviso', 'A câmera não está pronta.');
    }
  }

  function resetarFoto() {
    setUriDaImagem(null);
  }

  function trocarCamera() {
    setTipoCamera(
      tipoCamera === CameraType.back ? CameraType.front : CameraType.back
    );
  }

  if (temPermissaoCamera === null || temPermissaoAudio === null) {
    return <View style={styles.centralizado}><Text>Solicitando permissões...</Text></View>;
  }
  if (!temPermissaoCamera) {
    return <View style={styles.centralizado}><Text>Acesso à câmera negado.</Text></View>;
  }
  if (!temPermissaoAudio) {
    return <View style={styles.centralizado}><Text>Acesso ao microfone negado.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>📝 Meu Diário Multimídia 📸</Text>

      <View style={styles.secao}>
        <Text style={styles.tituloSecao}>Fotografia</Text>
        {uriDaImagem ? (
          <View style={styles.containerMidia}>
            <Image source={{ uri: uriDaImagem }} style={styles.previaImagem} />
            <Button title="Tirar Outra Foto" onPress={resetarFoto} color="#1E90FF" />
          </View>
        ) : (
          <View style={styles.containerMidia}>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              type={tipoCamera}
              onCameraReady={() => setCameraPronta(true)}
            />
            <View style={styles.espacoBotao} />
            <Button title="Tirar Foto" onPress={tirarFoto} disabled={!cameraPronta} />
            <View style={styles.espacoBotao} />
            <Button title="Trocar Câmera" onPress={trocarCamera} />
          </View>
        )}
      </View>

      <View style={styles.secao}>
        <Text style={styles.tituloSecao}>Nota de Voz</Text>
        <Button
          title={gravacao ? 'Parando Gravação...' : 'Gravar Áudio'}
          onPress={gravacao ? pararGravacao : iniciarGravacao}
          color={gravacao ? '#FF4500' : '#32CD32'}
        />
        <View style={styles.espacoBotao} />
        <Button
          title="Reproduzir Gravação"
          onPress={reproduzirSom}
          disabled={!uriDaGravacao || !!gravacao}
        />
        {uriDaGravacao && !gravacao && (
          <Text style={styles.textoStatus}>Áudio pronto para tocar!</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  centralizado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  secao: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tituloSecao: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
    color: '#444',
  },
  containerMidia: {
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previaImagem: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 15,
  },
  espacoBotao: {
    height: 10,
  },
  textoStatus: {
    marginTop: 10,
    color: 'green',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});