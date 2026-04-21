# Frontend Component Map — StudyVault

## 1. Mục tiêu
Tài liệu này chốt bản đồ component để refactor frontend theo hướng chuyên nghiệp, dễ maintain, và đồng bộ UI.

---

## 2. Nguyên tắc tổ chức component
- Component tái sử dụng >= 2 lần phải tách riêng
- `pages/` chỉ chứa logic page-level và composition
- `components/ui/` chỉ chứa component nguyên tử và tái sử dụng rộng
- `components/common/` chứa component dùng ở nhiều feature nhưng không hoàn toàn nguyên tử
- `features/` chứa UI gắn với nghiệp vụ cụ thể
- Dùng `cn()` utility để nối class
- Không lặp class dài ở nhiều nơi nếu có thể trừu tượng hóa

---

## 3. Cấu trúc mục tiêu

```text
src/
  app/
    router/
    providers/
  components/
    ui/
    common/
  layouts/
  features/
    auth/
    documents/
    folders/
    favorites/
    summary/
  pages/
  lib/
  hooks/
  types/
```

---

## 4. UI Components nền bắt buộc
Các component sau phải được tạo sớm ở Phase 1:

### `components/ui/`
- `AppButton`
- `AppInput`
- `AppTextarea`
- `AppSelect`
- `AppCard`
- `AppModal`
- `AppBadge`
- `AppPagination`
- `AppEmptyState`
- `AppSkeleton`
- `AppLoader`
- `AppFieldError`
- `AppSection`

### Vai trò
- thống nhất button style
- thống nhất input/form style
- thống nhất card nền glass/premium
- thống nhất empty/loading state
- thống nhất modal xác nhận hành động

---

## 5. Common Components
### `components/common/`
- `PageHeader`
- `SectionHeader`
- `ConfirmDialog`
- `SearchBar`
- `SortControl`
- `FilterBar`
- `UserMenu`
- `TopNavbar`
- `SidebarShell`
- `DocumentToolbar`

---

## 6. Layout Components
### `layouts/`
- `PublicLayout`
- `AuthLayout`
- `AppShell`
- `DetailLayout`

### Nhiệm vụ
- chia khung trang rõ ràng
- không để page tự dựng lại header/sidebar nhiều lần
- kiểm soát responsive nhất quán

---

## 7. Feature Components

## 7.1. Auth Feature
### `features/auth/`
- `LoginForm`
- `RegisterForm`
- `ForgotPasswordForm`
- `ResetPasswordForm`
- `AuthHeroPanel` (nếu cần)

## 7.2. Document Feature
### `features/documents/`
- `DocumentList`
- `DocumentCard`
- `DocumentTable`
- `DocumentUploadModal`
- `RenameDocumentModal`
- `DeleteDocumentDialog`
- `DocumentFilters`
- `DocumentPaginationBar`

## 7.3. Folder Feature
### `features/folders/`
- `FolderTree`
- `FolderItem`
- `CreateFolderModal`
- `RenameFolderModal`
- `MoveFolderModal`
- `DeleteFolderDialog`

## 7.4. Favorites Feature
### `features/favorites/`
- `FavoriteDocumentList`

## 7.5. Summary Feature
### `features/summary/`
- `SummaryPanel`
- `SummaryCard`
- `SummaryActionBar`
- `SummaryErrorState`
- `SummaryLoadingState`

---

## 8. Page responsibilities
### `pages/`
- `HomePage`
- `LoginPage`
- `RegisterPage`
- `ForgotPasswordPage`
- `ResetPasswordPage`
- `WorkspacePage`
- `FavoritesPage`
- `DocumentDetailPage`
- `ProfilePage`

> Mỗi page chỉ nên ghép layout + feature components + gọi hooks cần thiết.

---

## 9. Hooks và utilities cần có
### `hooks/`
- `useAuth`
- `useDocuments`
- `useFolders`
- `useSummary`
- `usePaginationState`
- `useQueryFilters`

### `lib/`
- `utils.ts` chứa `cn()`
- formatter cho date/file size
- constants cho sort/filter options

---

## 10. Những file cần refactor mạnh
Các file monolithic hiện có không được tiếp tục phình to.
Ưu tiên refactor:
- `App.tsx`
- các page auth gộp nhiều nhiệm vụ
- các page document/detail nếu đang ôm cả toolbar + content + summary + state trong một file

---

## 11. Definition of Done
Component map được coi là khóa khi:
- đã có danh mục component nền
- page nào cũng biết phải dùng layout nào và feature component nào
- việc code phase sau không còn làm theo kiểu “tự nghĩ ra component tại chỗ” nữa
