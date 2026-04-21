export type FileType = 'pdf' | 'word' | 'excel' | 'powerpoint' | 'image' | 'other';

export interface Document {
  id: string;
  name: string;
  type: FileType;
  size: string;
  subject: string;
  tags: string[];
  updatedAt: string;
  isFavorite: boolean;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  fileCount: number;
  updatedAt: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
  storageUsed: string;
  storageLimit: string;
}
