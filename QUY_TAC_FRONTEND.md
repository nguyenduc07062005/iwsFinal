# Quy tắc Thiết kế & Lập trình Frontend (StudyVault)

Tài liệu này quy chuẩn hóa phong cách thiết kế (Premium, Hiện đại, Sạch sẽ) và các tiêu chuẩn viết code frontend cho dự án **StudyVault**. Bất kỳ ai tham gia phát triển dự án bắt buộc phải tuân theo các quy tắc này để đảm bảo tính nhất quán và thẩm mỹ của toàn hệ thống.

---

## 1. Công nghệ sử dụng (Tech Stack)

- **Framework**: React 18 + Vite
- **Ngôn ngữ**: TypeScript
- **Styling**: Tailwind CSS (sử dụng `@tailwindcss` v4) + Vanilla CSS (Global style)
- **Animation**: `motion/react` (Framer Motion chuẩn mới)
- **Icons**: `lucide-react`
- **Routing**: `react-router-dom`

---

## 2. Bảng màu & Typography (Colors & Fonts)

### Typography
- **Font chữ chính**: `Plus Jakarta Sans` (đã import ở `index.css`).
- Đặc điểm: Form chữ tròn, hiện đại, dễ đọc, phù hợp cho giao diện giáo dục cao cấp.
- Trọng lượng (Weights): Thường dùng `font-medium` (500), `font-bold` (700) và `font-extrabold` (800) cho tiêu đề.

### Bảng màu (Color Palette)
Cấu hình màu tuân theo tone **Ivory / Terracotta / Copper / Charcoal** (đã định nghĩa trong `index.css`):
- **Base (Nền)**:
  - `--color-base-50`: `#faf9f6` (Ivory - Nền trắng ngà siêu sang, thay thế cho trắng tinh).
  - `--color-base-100`: `#f5f2eb`
- **Brand (Thương hiệu)**:
  - `--color-brand-50`, `--color-brand-100`: Dùng cho nền nút/icon nhạt.
  - `--color-brand-500`: `#e2725b` (Terracotta - Cam gạch, dùng cho nhấn, selection).
  - `--color-brand-600`: `#cc6652`
  - `--color-brand-900`: `#8c4238` (Dùng cho nút bấm chính hoặc khối màu tối nổi bật).
- **Accent (Nhấn)**:
  - `--color-accent`: `#b87333` (Copper - Màu đồng).
- **Text (Chữ)**:
  - `--color-dark`: `#2d2c2f` (Charcoal - Xám than, không dùng đen tuyền `#000` để đỡ gắt mắt).
  - Thường dùng qua class: `text-slate-500` (mô tả), `text-slate-800` (tiêu đề).

---

## 3. Phong cách Thiết kế Cốt lõi (Design System)

Phong cách của project là **Bento Grid + Glassmorphism + Cao cấp (Premium)**.

### a. Hiệu ứng Kính (Glassmorphism)
Sử dụng class `.glass` (đã cấu hình trong `index.css`) thay vì nền trắng thông thường cho các khối nội dung nổi lên trên nền hệ thống.
- **Quy tắc**: Thêm class `glass` đi kèm `rounded-3xl` hoặc `rounded-[2rem]` và `shadow-sm`.
- Tránh lạm dụng: Rất tốt cho bảng, thẻ (card), popup, sidebar.

### b. Góc bo tròn (Border Radius)
Tuyệt đối không dùng góc vuông hoặc bo quá ít. Mọi thứ phải mềm mại:
- **Card, Khối Bento**: `rounded-3xl`, `rounded-[2rem]`.
- **Nút bấm, Tags**: `rounded-full`, `rounded-xl`.
- **Icon bọc trong khối**: `rounded-xl`, `rounded-2xl`.

### c. Chuyển động (Animations & Interactions)
Ứng dụng phải có sức sống (Dynamic):
- **Hover Button / Card**: Luôn có transition.
  - Vd Card: `transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`
  - Nút bấm: `transform transition-transform hover:scale-105` hoặc `hover:-translate-y-1`
- **Framer Motion**: Các khối nội dung xuất hiện (mount) **phải** được bọc bởi `<motion.div>` để tạo hiệu ứng mượt.
- **Trôi nổi (Float)**: Chữ to hoặc một số khối điểm nhấn có thể dùng class `.animate-float`.

### d. Nửa viền, nửa bóng (Borders x Shadows)
- Cố gắng giữ giao diện mỏng nhẹ: Không dùng bóng đổ đen quá gắt (`shadow-lg` đen xì). Dùng bóng mịn (`shadow-sm`, `shadow-md`, `shadow-2xl` cho popup to).
- Khuyến khích kết hợp border mỏng: `border border-slate-100` kết hợp `shadow-sm` cho các card trắng; `border-white` kết hợp cho khối class `.glass`.

### e. Thiết kế Nút bấm (Button Design)
- **Nút chính (Primary)**: Thường có dạng bo tròn hoàn toàn (Pill) hoặc bo góc mạnh.
  - *Ví dụ*: `bg-brand-900 text-white rounded-full font-bold shadow-lg hover:bg-brand-600`
- **Nút Gradient**: Viết gradient qua class Tailwind: `bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-full`.
- **Nút phụ (Secondary/Tertiary)**: Nền trong hoặc xám nhạt (`bg-slate-50`), text màu sẫm hoặc xám slate.
- **Icon nổi bật**: Bọc icon vào trong một div vuông bo góc có màu nền pastel: `bg-blue-50 text-blue-500 w-12 h-12 rounded-2xl flex items-center justify-center`.

---

## 4. Cấu trúc và Quy tắc Viết Code Component

- **Sử dụng `cn()` utility**: 
  Nối chuỗi class Tailwind gọn gàng bằng hàm `cn()` ở file `lib/utils.ts`. 
  *Tuyệt đối không cộng chuỗi kiểu old-school (VD: `className={"btn " + (isActive ? "active" : "")}`).*
  
  ```tsx
  import { cn } from '../lib/utils';
  
  <div className={cn(
    "p-4 rounded-xl transition-colors",
    isActive ? "bg-brand-500 text-white" : "bg-slate-50 text-slate-500"
  )}>
  ```

- **Sử dụng Icons từ Lucide**:
  - Đồng bộ cùng một thư viện icon duy nhất: `lucide-react`. Đừng mix với FontAwesome hay HeroIcons.
  - Vd: `<FolderClosed size={24} className="text-slate-400" />`

- **Tách Component (Componentization)**:
  - Bất cứ khối UI nào tái sử dụng từ 2 lần trở lên phải đưa vào `src/components/`.
  - Giữ cho files `src/pages/...` chỉ chứa logic View/Layout chung, chi tiết component nên được tách nhỏ ra.

- **Responsive**: 
  - Code luôn phải đảm bảo Mobile-first (mặc định cho điện thoại), sau đó dùng `sm:`, `md:`, `lg:` để điều chỉnh layout. 
  - Dùng CSS Grid cho bento card (`grid-cols-1 md:grid-cols-3 lg:grid-cols-4`).

---

## 5. Ví dụ Mẫu Code Tham Khảo (Code Templates)

### 5.1 Khối Card Chuẩn (Bento Style & Glass)
```tsx
<motion.div
  whileHover={{ y: -5 }}
  className="glass rounded-3xl p-6 border border-white/40 shadow-sm cursor-pointer group relative overflow-hidden"
>
  <div className="absolute inset-0 bg-brand-50 opacity-0 group-hover:opacity-10 transition-opacity -z-10"></div>
  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-brand-500 mb-4 group-hover:scale-110 transition-transform">
    <Icon size={24} />
  </div>
  <h3 className="text-xl font-bold text-slate-800">Tiêu đề Card</h3>
  <p className="text-sm text-slate-500 mt-2">Mô tả ngắn gọn, chi tiết về khối này.</p>
</motion.div>
```

### 5.2 Animations khi load trang
Sử dụng `motion.div` để fade-in các nội dung khi rẽ nhánh URL. Đừng để nội dung giật cục văng vào mặt user.

```tsx
<motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  <YourContent />
</motion.div>
```

## Tổng Kết
Một chữ **"Wow!"** là mục tiêu cho dự án này. Đừng chấp nhận các UI vuông vức nghèo nàn, màu sắc đơn điệu hay component đứng im như tượng. Luôn nghĩ đến: **Góc bo sâu, màu ngà Ivory, cam đất Terracotta sang trọng, chuyển động mượt, và bóng đổ nhẹ.**
