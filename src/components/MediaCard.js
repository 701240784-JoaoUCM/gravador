import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import {
  Video as VideoIcon,
  Image as ImageIcon,
  FileText,
  Trash2,
  Cloud,
  HardDrive,
  Play
} from 'lucide-react-native';

export default function MediaCard({ item, onPress, onDelete }) {
  const isCloud = !!item.url;
  const isVideo = item.type === 'video';
  const isImage = item.type === 'image';
  const isPdf = item.type === 'pdf';

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => onPress(item)}>
      <View style={styles.previewContainer}>
        {isImage ? (
          <Image
            source={{ uri: item.url || item.uri }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : isVideo ? (
          <View style={styles.videoPlaceholder}>
            <VideoIcon size={32} color="#2563eb" />
            <View style={styles.playBadge}>
              <Play size={14} color="#ffffff" fill="#ffffff" />
            </View>
          </View>
        ) : (
          <View style={styles.pdfPlaceholder}>
            <FileText size={32} color="#dc2626" />
            <Text style={styles.pdfBadgeText}>PDF</Text>
          </View>
        )}

        <View style={styles.sourceBadge}>
          {isCloud ? (
            <View style={styles.cloudTag}>
              <Cloud size={12} color="#2563eb" />
              <Text style={styles.cloudTagText}>Nuvem</Text>
            </View>
          ) : (
            <View style={styles.localTag}>
              <HardDrive size={12} color="#16a34a" />
              <Text style={styles.localTagText}>Local</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title || item.filename || 'Sem título'}
          </Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
          >
            <Trash2 size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description || item.filename || 'Item adicionado ao catálogo acadêmico.'}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {item.type ? item.type.toUpperCase() : 'MÍDIA'}
            {item.size_bytes ? ` • ${formatSize(item.size_bytes)}` : ''}
          </Text>
          <Text style={styles.metaDate}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  previewContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#f8fafc',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  thumbnail: {
    width: '100%',
    height: '100%'
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eff6ff'
  },
  playBadge: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  pdfPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef2f2'
  },
  pdfBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
    marginTop: 2
  },
  sourceBadge: {
    position: 'absolute',
    top: 6,
    left: 6
  },
  cloudTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8
  },
  cloudTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2563eb'
  },
  localTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8
  },
  localTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16a34a'
  },
  detailsContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 8
  },
  deleteBtn: {
    padding: 4
  },
  description: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    marginVertical: 4
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8'
  },
  metaDate: {
    fontSize: 11,
    color: '#94a3b8'
  }
});
