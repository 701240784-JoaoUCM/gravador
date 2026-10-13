import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import {
  Video as VideoIcon,
  Square,
  Play,
  RotateCcw,
  UploadCloud,
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';

export default function VideoRecorder({ onVideoRecorded }) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  
  const [facing, setFacing] = useState('back');
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedVideoUri, setRecordedVideoUri] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const cameraRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const webVideoPreviewRef = useRef(null);
  const webMediaStreamRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    if (Platform.OS === 'web' && !recordedVideoUri) {
      startWebCamera();
    }
    return () => {
      if (Platform.OS === 'web') {
        stopWebCamera();
      }
    };
  }, [recordedVideoUri]);

  const startWebCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        webMediaStreamRef.current = stream;
        if (webVideoPreviewRef.current) {
          webVideoPreviewRef.current.srcObject = stream;
          webVideoPreviewRef.current.play();
        }
      }
    } catch {
      setStatusMessage('Permissão de câmera web não autorizada ou indisponível.');
    }
  };

  const stopWebCamera = () => {
    if (webMediaStreamRef.current) {
      webMediaStreamRef.current.getTracks().forEach((track) => track.stop());
      webMediaStreamRef.current = null;
    }
  };

  const formatTimer = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  const handleStartRecording = async () => {
    setRecordDuration(0);
    setStatusMessage('');

    if (Platform.OS === 'web') {
      try {
        if (!webMediaStreamRef.current) {
          await startWebCamera();
        }
        const stream = webMediaStreamRef.current;
        if (!stream) {
          Alert.alert('Erro', 'Fluxo de vídeo web não acessível.');
          return;
        }
        videoChunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm';
        
        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            videoChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(videoChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          setRecordedVideoUri(url);
          setRecordedBlob(blob);
          stopWebCamera();
        };

        recorder.start(500);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch {
        Alert.alert('Erro', 'Não foi possível inicializar a gravação de vídeo web.');
      }
      return;
    }

    if (cameraRef.current) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync({
          maxDuration: 600,
          quality: '720p'
        });
        if (video && video.uri) {
          setRecordedVideoUri(video.uri);
        }
      } catch {
        Alert.alert('Erro', 'Falha ao gravar vídeo nativo.');
      } finally {
        setIsRecording(false);
      }
    }
  };

  const handleStopRecording = () => {
    if (Platform.OS === 'web') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const handleReset = () => {
    setRecordedVideoUri(null);
    setRecordedBlob(null);
    setRecordDuration(0);
    setStatusMessage('');
  };

  const handleConfirmSave = () => {
    if (!recordedVideoUri) return;
    onVideoRecorded({
      uri: recordedVideoUri,
      blob: recordedBlob,
      name: `gravacao_${Date.now()}.${Platform.OS === 'web' ? 'webm' : 'mp4'}`,
      type: Platform.OS === 'web' ? 'video/webm' : 'video/mp4',
      durationSeconds: recordDuration
    });
    handleReset();
  };

  if (Platform.OS !== 'web') {
    if (!cameraPermission || !micPermission) {
      return (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Carregando permissões de câmera...</Text>
        </View>
      );
    }

    if (!cameraPermission.granted || !micPermission.granted) {
      return (
        <View style={styles.permissionContainer}>
          <AlertCircle size={48} color="#ef4444" style={styles.permissionIcon} />
          <Text style={styles.permissionTitle}>Permissão Necessária</Text>
          <Text style={styles.permissionText}>
            O aplicativo necessita de autorização de câmera e microfone para gravação de vídeo acadêmica.
          </Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={async () => {
              await requestCameraPermission();
              await requestMicPermission();
            }}
          >
            <Text style={styles.permissionBtnText}>Conceder Permissões</Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View style={styles.badgeContainer}>
          <View style={[styles.statusDot, isRecording && styles.statusDotRecording]} />
          <Text style={styles.badgeText}>
            {isRecording ? 'Gravando em tempo real' : recordedVideoUri ? 'Vídeo Pronto' : 'Câmera Pronta'}
          </Text>
        </View>
        <Text style={styles.timerText}>{formatTimer(recordDuration)}</Text>
      </View>

      <View style={styles.previewContainer}>
        {recordedVideoUri ? (
          Platform.OS === 'web' ? (
            <video
              src={recordedVideoUri}
              controls
              style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000000' }}
            />
          ) : (
            <Video
              source={{ uri: recordedVideoUri }}
              style={styles.nativeVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
            />
          )
        ) : Platform.OS === 'web' ? (
          <video
            ref={webVideoPreviewRef}
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#0f172a' }}
          />
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.cameraView}
            facing={facing}
            mode="video"
          />
        )}

        {statusMessage ? (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorOverlayText}>{statusMessage}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.controlsContainer}>
        {recordedVideoUri ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleReset}>
              <RotateCcw size={20} color="#0f172a" />
              <Text style={styles.secondaryBtnText}>Descartar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmSave}>
              <CheckCircle2 size={20} color="#ffffff" />
              <Text style={styles.primaryBtnText}>Salvar e Gerenciar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.recordRow}>
            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={styles.iconCircleBtn}
                onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
              >
                <RotateCcw size={22} color="#0f172a" />
              </TouchableOpacity>
            )}

            {!isRecording ? (
              <TouchableOpacity style={styles.recordStartBtn} onPress={handleStartRecording}>
                <View style={styles.recordStartInner} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.recordStopBtn} onPress={handleStopRecording}>
                <Square size={26} color="#ffffff" />
              </TouchableOpacity>
            )}

            <View style={{ width: 44 }} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6
  },
  statusDotRecording: {
    backgroundColor: '#ef4444'
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a'
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: '#0f172a'
  },
  previewContainer: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative'
  },
  cameraView: {
    flex: 1
  },
  nativeVideo: {
    flex: 1
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: 8,
    borderRadius: 8
  },
  errorOverlayText: {
    color: '#f8fafc',
    fontSize: 12,
    textAlign: 'center'
  },
  controlsContainer: {
    marginTop: 16,
    alignItems: 'center'
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20
  },
  iconCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  recordStartBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  recordStartInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ef4444'
  },
  recordStopBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9'
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a'
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563eb'
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff'
  },
  permissionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  permissionIcon: {
    marginBottom: 12
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8
  },
  permissionText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16
  },
  permissionBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12
  },
  permissionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  }
});
