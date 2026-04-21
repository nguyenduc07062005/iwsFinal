import { Document, Folder, User } from './types';

export const MOCK_USER: User = {
  id: '1',
  name: 'Sinh Viên',
  email: 'sinhvien@example.com',
  avatar: 'https://ui-avatars.com/api/?name=Sinh+Vien&background=random',
  role: 'user',
  storageUsed: '2.4 GB',
  storageLimit: '5 GB',
};

export const MOCK_FOLDERS: Folder[] = [
  {
    id: 'f1',
    name: 'Đồ án tốt nghiệp 2024',
    fileCount: 24,
    updatedAt: 'Hôm qua',
    color: 'blue',
  },
  {
    id: 'f2',
    name: 'Tài liệu tham khảo React',
    fileCount: 8,
    updatedAt: 'Tuần trước',
    color: 'green',
  },
  {
    id: 'f3',
    name: 'Kỹ năng mềm',
    fileCount: 5,
    updatedAt: '2 ngày trước',
    color: 'purple',
  },
];

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'd1',
    name: 'Slide_AI_Chuong_1_Tong_Quan.pdf',
    type: 'pdf',
    size: '2.4 MB',
    subject: 'Trí tuệ nhân tạo',
    tags: ['Lý thuyết'],
    updatedAt: 'Hôm nay',
    isFavorite: false,
    folderId: 'f1',
  },
  {
    id: 'd2',
    name: 'Bao_Cao_BTL_Nhom_5_Final.docx',
    type: 'word',
    size: '1.8 MB',
    subject: 'Thiết kế Web',
    tags: ['Quan trọng'],
    updatedAt: 'Hôm qua',
    isFavorite: true,
    folderId: 'f2',
  },
  {
    id: 'd3',
    name: 'Bang_Diem_Du_Kien.xlsx',
    type: 'excel',
    size: '45 KB',
    subject: 'Cá nhân',
    tags: [],
    updatedAt: 'Hôm qua',
    isFavorite: false,
  },
  {
    id: 'd4',
    name: 'Thuyet_Trinh_Giua_Ky.pptx',
    type: 'powerpoint',
    size: '5.2 MB',
    subject: 'Kỹ năng mềm',
    tags: ['Slide'],
    updatedAt: '3 ngày trước',
    isFavorite: false,
    folderId: 'f3',
  },
];
