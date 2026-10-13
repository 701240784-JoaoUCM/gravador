import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  RefreshControl
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  UploadCloud,
  FilePlus,
  RefreshCw,
  Video as VideoIcon,
  Layers,
  Sparkles
} from 'lucide-react-native';

import VideoRecorder from './src/components/VideoRecorder';
import MediaCard from './src/components/MediaCard';
import MediaTabs from './src/components/MediaTabs';
import MediaViewerModal from './src/components/MediaViewerModal';
import { fetchMediaList, uploadMediaFile, deleteMediaItem } from './src/services/mediaService';
import {
  getLocalMediaList,
  saveLocalMediaItem,
  removeLocalMediaItem
} from './src/services/storageService';

export default function App() {
  const [activeTab, setActiveTab] = useState('all');
  const [mediaItems, setMediaItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  const loadAllMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const localItems = await getLocalMediaList();
      let serverItems = [];
      try {
        serverItems = await fetchMediaList('all');
      } catch {
        serverItems = [];
      }

      const combinedMap = new Map();
      localItems.forEach((item) => combinedMap.set(item.id, item));
      serverItems.forEach((item) => combinedMap.set(item.id, item));

      const merged = Array.from(combinedMap.values());
      merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      setMediaItems(merged);
    } catch {
      Alert.alert('Aviso', 'Erro ao sincronizar catálogo de mídias.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllMedia();
  }, [loadAllMedia]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAllMedia();
  };

  const handleVideoRecorded = async (videoData) => {
    setIsUploading(true);
    const localId = `local-${Date.now()}`;
    const newLocalItem = {
      id: localId,
      title: 'Gravação de Vídeo',
      description: `Vídeo gravado pelo app (${videoData.durationSeconds || 0}s)`,
      type: 'video',
      uri: videoData.uri,
      blob: videoData.blob,
      filename: videoData.name,
      created_at: new Date().toISOString()
    };

    await saveLocalMediaItem(newLocalItem);
    await loadAllMedia();

    try {
      const uploaded = await uploadMediaFile({
        uri: videoData.uri,
        blob: videoData.blob,
        name: videoData.name,
        type: videoData.type,
        title: 'Gravação de Vídeo',
        description: `Gravação direta em alta resolução (${videoData.durationSeconds || 0}s)`
      });

      await removeLocalMediaItem(localId);
      await saveLocalMediaItem(uploaded);
      await loadAllMedia();
      Alert.alert('Sucesso', 'Vídeo gravado e sincronizado com a nuvem!');
    } catch {
      Alert.alert(
        'Salvo Localmente',
        'O vídeo foi salvo no dispositivo. Não foi possível enviar para a nuvem no momento.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: false,
        multiple: false
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      let inferredType = 'image';
      const ext = (asset.name || '').split('.').pop().toLowerCase();
      const mime = (asset.mimeType || '').toLowerCase();

      if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext) || mime.includes('video')) {
        inferredType = 'video';
      } else if (['pdf'].includes(ext) || mime.includes('pdf')) {
        inferredType = 'pdf';
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext) || mime.includes('image')) {
        inferredType = 'image';
      }

      setIsUploading(true);

      let fileBlob = null;
      if (Platform.OS === 'web' && asset.file) {
        fileBlob = asset.file;
      }

      try {
        const uploaded = await uploadMediaFile({
          uri: asset.uri,
          blob: fileBlob,
          name: asset.name,
          type: asset.mimeType || (inferredType === 'pdf' ? 'application/pdf' : 'application/octet-stream'),
          title: asset.name,
          description: `Importado via seletor de arquivos (${inferredType.toUpperCase()})`
        });

        await saveLocalMediaItem(uploaded);
        await loadAllMedia();
        Alert.alert('Sucesso', `Arquivo "${asset.name}" enviado para a nuvem com sucesso!`);
      } catch {
        const localId = `local-doc-${Date.now()}`;
        const fallbackItem = {
          id: localId,
          title: asset.name,
          description: 'Arquivo importado e salvo localmente',
          type: inferredType,
          uri: asset.uri,
          size_bytes: asset.size,
          filename: asset.name,
          created_at: new Date().toISOString()
        };
        await saveLocalMediaItem(fallbackItem);
        await loadAllMedia();
        Alert.alert(
          'Armazenado Localmente',
          'Arquivo adicionado ao gerenciador local (servidor indisponível no momento).'
        );
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível selecionar o arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteItem = async (item) => {
    const executeDelete = async () => {
      try {
        if (item.url) {
          try {
            await deleteMediaItem(item.id);
          } catch {}
        }
        await removeLocalMediaItem(item.id);
        await loadAllMedia();
      } catch {
        Alert.alert('Erro', 'Falha ao remover mídia.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Deseja realmente excluir "${item.title || item.filename}"?`)) {
        executeDelete();
      }
    } else {
      Alert.alert(
        'Confirmar Exclusão',
        `Deseja realmente excluir "${item.title || item.filename}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: executeDelete }
        ]
      );
    }
  };

  const handleOpenMedia = (item) => {
    setSelectedMedia(item);
    setViewerVisible(true);
  };

  const filteredItems = mediaItems.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'cloud') return !!item.url;
    return item.type === activeTab;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Sparkles size={20} color="#2563eb" />
            <Text style={styles.title}>MediaHub Pro</Text>
          </View>
          <Text style={styles.subtitle}>
            Gravador de Vídeo e Gerenciador Multimídia Acadêmico
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={handlePickDocument}
            disabled={isUploading}
          >
            <FilePlus size={20} color="#2563eb" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {isUploading && (
        <View style={styles.uploadingBanner}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.uploadingText}>Realizando upload multipart seguro...</Text>
        </View>
      )}

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MediaCard item={item} onPress={handleOpenMedia} onDelete={handleDeleteItem} />
        )}
        ListHeaderComponent={
          <>
            <VideoRecorder onVideoRecorded={handleVideoRecorded} />
            <MediaTabs activeTab={activeTab} onSelectTab={setActiveTab} />
          </>
        }
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.emptyContainer}>
              <Layers size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Nenhuma mídia nesta categoria</Text>
              <Text style={styles.emptySubtitle}>
                Grave um novo vídeo acima ou importe ficheiros PDF, imagens e vídeos.
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />

      <MediaViewerModal
        visible={viewerVisible}
        media={selectedMedia}
        onClose={() => {
          setViewerVisible(false);
          setSelectedMedia(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10
  },
  actionIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  uploadingBanner: {
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderColor: '#bfdbfe'
  },
  uploadingText: {
    fontSize: 13,
    color: '#1d499b',
    fontWeight: '600'
  },
  listContent: {
    paddingBottom: 40
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 12,
    marginBottom: 4
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280
  }
});
