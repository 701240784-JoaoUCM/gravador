import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  Platform,
  Linking
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { X, Download, FileText, ExternalLink } from 'lucide-react-native';

export default function MediaViewerModal({ visible, media, onClose }) {
  if (!visible || !media) return null;

  const handleOpenExternal = async () => {
    if (media.url) {
      if (Platform.OS === 'web') {
        window.open(media.url, '_blank');
      } else {
        await Linking.openURL(media.url);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.contentCard}>
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.title} numberOfLines={1}>
                {media.title || media.filename || 'Visualizador de Mídia'}
              </Text>
              <Text style={styles.typeBadge}>
                {media.type ? media.type.toUpperCase() : 'ARQUIVO'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {media.type === 'image' && (
              <Image
                source={{ uri: media.url || media.uri }}
                style={styles.imageViewer}
                resizeMode="contain"
              />
            )}

            {media.type === 'video' && (
              Platform.OS === 'web' ? (
                <video
                  src={media.url || media.uri}
                  controls
                  autoPlay
                  style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000000' }}
                />
              ) : (
                <Video
                  source={{ uri: media.url || media.uri }}
                  style={styles.videoPlayer}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                />
              )
            )}

            {media.type === 'pdf' && (
              Platform.OS === 'web' ? (
                <iframe
                  src={media.url || media.uri}
                  title="PDF Viewer"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <View style={styles.pdfFallback}>
                  <FileText size={64} color="#2563eb" />
                  <Text style={styles.pdfFallbackTitle}>Documento PDF Acadêmico</Text>
                  <Text style={styles.pdfFallbackDesc}>
                    {media.filename || 'relatorio.pdf'}
                  </Text>
                  <TouchableOpacity style={styles.pdfOpenBtn} onPress={handleOpenExternal}>
                    <ExternalLink size={18} color="#ffffff" />
                    <Text style={styles.pdfOpenBtnText}>Abrir no Leitor do Sistema</Text>
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText} numberOfLines={1}>
              {media.description || 'Armazenado no Servidor / Cloud'}
            </Text>
            {media.url && (
              <TouchableOpacity style={styles.linkBtn} onPress={handleOpenExternal}>
                <ExternalLink size={16} color="#2563eb" />
                <Text style={styles.linkBtnText}>Abrir URL</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  contentCard: {
    width: '100%',
    maxWidth: 820,
    height: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc'
  },
  headerInfo: {
    flex: 1,
    marginRight: 12
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 2
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  body: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center'
  },
  imageViewer: {
    width: '100%',
    height: '100%'
  },
  videoPlayer: {
    width: '100%',
    height: '100%'
  },
  pdfFallback: {
    backgroundColor: '#ffffff',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  pdfFallbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 6
  },
  pdfFallbackDesc: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center'
  },
  pdfOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12
  },
  pdfOpenBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff'
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
    marginRight: 10
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  linkBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb'
  }
});
