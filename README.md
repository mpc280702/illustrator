# VectorTracer Pro for Adobe Illustrator

Plugin / Panel gắn thanh công cụ giúp tự động hóa quá trình chuyển ảnh Raster (JPG, PNG, WebP...) thành Vector sắc nét trong Adobe Illustrator.

---

## 🌟 2 Chế độ sử dụng

### Chế độ 1: Panel gắn cố định vào thanh công cụ bên phải (Khuyên dùng)
Panel sẽ nằm cố định ở cột công cụ bên phải (cùng vị trí với Layers, Properties, Artboards...) và luôn tự động hiển thị mỗi khi bạn mở Illustrator.

1. **Khởi động lại Adobe Illustrator** (để Illustrator nhận diện panel vừa được tích hợp vào hệ thống).
2. Vào menu trên cùng: **Window** > **Extensions** > chọn **VectorTracer Pro**.
3. Khi bảng hiện ra, bạn **kéo thả tab tên "VectorTracer Pro" vào thanh công cụ bên phải** (nơi chứa các icon Layers, Properties...).
4. Từ bây giờ trở đi, mỗi lần mở Illustrator, panel sẽ luôn nằm sẵn ở đó để sử dụng tức thì.

---

### Chế độ 2: Hộp thoại Script nhanh
Dành cho ai thích mở dạng cửa sổ popup:
- Nhấn phím tắt **`Ctrl + F12`** trong Illustrator > chọn file [`VectorTracerPro.jsx`](file:///e:/MP/VectorTracerPro/VectorTracerPro.jsx).
- Hoặc cài đặt vào menu **File > Scripts** bằng cách click chuột phải vào [`install.ps1`](file:///e:/MP/VectorTracerPro/install.ps1) > chọn **Run with PowerShell** (chạy quyền Admin).

---

## 🚀 Tính năng nổi bật
- **Embed tự động**: Tự nhận diện và nhúng ảnh ngoài (Linked / Placed Items).
- **5 Presets tối ưu**: Logo phẳng, Hoạt hình, Ảnh chi tiết cao, Đen trắng Silhouette, Nét vẽ Sketch.
- **Tùy biến màu sắc**: Thanh trượt Max Colors từ 2 đến 64 màu.
- **Ignore White Background**: Tự động loại bỏ hoàn toàn nền trắng.
- **Auto Expand & Ungroup**: Rã vector và rã nhóm tức thì để chỉnh sửa ngay.
- **Lọc rác hạt nhỏ**: Tự động dọn dẹp các mảnh vụn vector li ti (< 4 px²).
