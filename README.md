# AI Short Video Creator - Demo Application

Ứng dụng demo để tạo video ngắn tự động bằng AI, dựa trên đặc tả trong PLAN.md.

## Tổng quan dự án

AI Short Video Creator là ứng dụng web cho phép người dùng tạo video ngắn tự động bằng AI. Ứng dụng cung cấp quy trình từng bước:

1. Chọn chủ đề hoặc tìm kiếm từ các chủ đề xu hướng
2. Tạo và tùy chỉnh kịch bản
3. Chọn và tùy chỉnh giọng đọc
4. Chọn hình nền hoặc video
5. Chỉnh sửa và tùy chỉnh video cuối cùng
6. Xuất và chia sẻ

## Công nghệ sử dụng

- **Frontend Framework**: Next.js (React)
- **Styling**: TailwindCSS
- **State Management**: React Context API
- **Mock Data**: TypeScript interfaces và mock data

## Hướng dẫn cài đặt và chạy dự án

### Yêu cầu cơ bản
- [Node.js](https://nodejs.org/) phiên bản 18.x hoặc cao hơn
- npm (đi kèm với Node.js) hoặc [Yarn](https://yarnpkg.com/)

### Các bước cài đặt

1. Clone repository (hoặc giải nén file nếu bạn đã tải về):

```bash
git clone <repository-url>
cd video-creator-app
```

2. Cài đặt các dependencies:

```bash
npm install
# hoặc
yarn install
```

3. Chạy development server:

```bash
npm run dev
# hoặc
yarn dev
```

4. Mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

### Build cho môi trường production

```bash
npm run build
npm run start
# hoặc
yarn build
yarn start
```

### Mẹo xử lý lỗi

Nếu gặp lỗi khi cài đặt hoặc chạy ứng dụng:

1. Đảm bảo bạn đang sử dụng phiên bản Node.js được hỗ trợ (18.x hoặc cao hơn)
2. Xóa thư mục node_modules và file package-lock.json, sau đó chạy lại `npm install`
3. Nếu có lỗi liên quan đến TypeScript, chạy `npx tsc --noEmit` để kiểm tra lỗi
4. Nếu có lỗi về routing, kiểm tra file `next.config.js` và cấu trúc thư mục `pages`

## Thông tin đăng nhập demo

Bạn có thể sử dụng thông tin đăng nhập sau để thử chức năng đăng nhập:

- **Email**: demo@example.com
- **Password**: password

## Các trang và tính năng

### Trang chủ
- Hiển thị chủ đề xu hướng
- Giới thiệu tính năng ứng dụng
- Nút kêu gọi hành động

### Quy trình tạo video
1. **Chọn chủ đề**: Chọn từ các chủ đề xu hướng hoặc nhập chủ đề của riêng bạn
2. **Tạo kịch bản**: Kịch bản được tạo bởi AI mà bạn có thể chỉnh sửa
3. **Chọn giọng đọc**: Chọn từ các giọng đọc khác nhau và tùy chỉnh cài đặt
4. **Chọn hình nền**: Chọn hình ảnh cho nền video của bạn

### Bảng điều khiển
- Xem tất cả video bạn đã tạo
- Tùy chọn để chỉnh sửa, xóa và chia sẻ video
- Chỉ báo trạng thái cho quá trình xử lý video

## Ghi chú triển khai

- Đây là demo phía client với dữ liệu mẫu và API giả lập
- Không thực hiện xử lý hoặc tạo video thực tế
- Giao diện người dùng và quy trình hoạt động đầy đủ để minh họa khái niệm

## Bước tiếp theo cho phiên bản sản phẩm

1. Tích hợp với API backend thực tế cho việc xử lý video
2. Triển khai xác thực người dùng và quản lý tài khoản
3. Thêm tính năng chỉnh sửa video với trình chỉnh sửa video thực tế
4. Triển khai lưu trữ video và phân phối CDN
5. Thêm phân tích và khả năng chia sẻ
