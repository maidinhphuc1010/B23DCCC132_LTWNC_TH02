# Baseline hiệu năng và xác minh bài 1

Ngày đo: 2026-10-13

## Môi trường

- Node.js: 22.12.0 (dự án khai báo Node 16.x)
- TypeScript: 4.9.5
- React: 17.0.2
- Redux Toolkit: 1.9.7
- React Redux: 8.1.3

## Kết quả kiểm tra

| Kiểm tra | Kết quả | Thời gian / ghi chú |
| --- | --- | --- |
| `npx tsc --noEmit --pretty false` | Không đạt toàn dự án | 154.0 giây; còn 10 lỗi legacy ngoài `features/assignments` |
| TypeScript riêng phần assignments | Đạt | Không còn lỗi tại `src/features/assignments` hoặc `src/pages/TrangChu` |
| `npm run build` | Không chạy được | `esbuild.exe` thiếu tại `node_modules/esbuild-loader/node_modules/esbuild/esbuild.exe` |
| API tải dữ liệu mẫu | 650 ms cố định | Theo `fetchAssignmentsApi`; chưa phải đo mạng thật |

## Phạm vi CRUD đã xác minh bằng code

- Thêm: `addAssignment`, form có validation bắt buộc môn học, tên và hạn nộp.
- Sửa: `updateAssignment`, nút Sửa mở form đã điền dữ liệu hiện tại.
- Xóa: nút Xóa có hộp thoại xác nhận.
- Hoàn thành/bỏ hoàn thành: `toggleAssignment`, có hộp thoại xác nhận.
- Tải lỗi: thunk chuyển trạng thái `failed` và hiển thị thông báo lỗi.

## Giới hạn

Chưa thực hiện được kiểm tra runtime trên trình duyệt và Lighthouse trong phiên này vì build bị chặn bởi executable esbuild thiếu trong `node_modules`. Cần cài lại dependencies bằng Node 16.x (ví dụ `npm ci`) rồi chạy `npm run start:dev` để kiểm tra thủ công route `/dashboard` và đo FCP/LCP/interaction bằng DevTools Lighthouse.
