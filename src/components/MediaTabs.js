import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Layers, Video, Image, FileText, Cloud } from 'lucide-react-native';

const TABS = [
  { id: 'all', label: 'Todos', icon: Layers },
  { id: 'video', label: 'Vídeos', icon: Video },
  { id: 'image', label: 'Fotos', icon: Image },
  { id: 'pdf', label: 'PDFs', icon: FileText },
  { id: 'cloud', label: 'Nuvem', icon: Cloud }
];

export default function MediaTabs({ activeTab, onSelectTab }) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComp = tab.icon;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => onSelectTab(tab.id)}
            >
              <IconComp size={16} color={isActive ? '#ffffff' : '#64748b'} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 8
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f1f5f9'
  },
  tabBtnActive: {
    backgroundColor: '#2563eb'
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b'
  },
  tabTextActive: {
    color: '#ffffff'
  }
});
