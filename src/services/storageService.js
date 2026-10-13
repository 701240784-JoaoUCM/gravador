import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_STORAGE_KEY = '@app_local_media_registry_v1';

export const getLocalMediaList = async () => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveLocalMediaItem = async (item) => {
  try {
    const current = await getLocalMediaList();
    const updated = [item, ...current.filter((i) => i.id !== item.id)];
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};

export const removeLocalMediaItem = async (id) => {
  try {
    const current = await getLocalMediaList();
    const updated = current.filter((i) => i.id !== id);
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};
