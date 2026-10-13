import { API_BASE_URL } from '../config/api';

export const fetchMediaList = async (type = 'all') => {
  const query = type && type !== 'all' ? `?type=${type}` : '';
  const response = await fetch(`${API_BASE_URL}/media${query}`);
  if (!response.ok) {
    throw new Error('Falha ao carregar mídias do servidor');
  }
  return await response.json();
};

export const uploadMediaFile = async ({ uri, name, type, title, description, blob }) => {
  const formData = new FormData();
  
  if (blob) {
    formData.append('file', blob, name || 'upload_file');
  } else {
    formData.append('file', {
      uri,
      name: name || 'upload_file',
      type: type || 'application/octet-stream'
    });
  }

  if (title) formData.append('title', title);
  if (description) formData.append('description', description);

  const response = await fetch(`${API_BASE_URL}/media/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Falha ao realizar o upload');
  }

  return await response.json();
};

export const deleteMediaItem = async (id) => {
  const response = await fetch(`${API_BASE_URL}/media/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Falha ao excluir item');
  }
  return await response.json();
};
