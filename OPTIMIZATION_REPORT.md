# Báo cáo tối ưu và đo lại — 10.000 bài tập

Ngày: 13/10/2026. Artifact baseline được giữ nguyên.

## Kỹ thuật áp dụng

1. **React.memo + useCallback:** giữ memo của AssignmentCard; handler hoàn thành, xóa, mở sửa ổn định tại AssignmentList, truyền qua itemData được useMemo. Handler ghim dùng action Zustand ổn định. Không memo hóa mọi closure nút DOM khi không cần thiết.
2. **useDebounce 300 ms + useMemo:** input cập nhật tức thì, query debounce mới đi vào hook lọc đã có useMemo. Cleanup timeout khi đổi giá trị/unmount. Sắp xếp ghim được useMemo và dùng Set thay includes trong comparator.
3. **react-window FixedSizeList:** viewport 600 px, overscan 3, key theo ID; hàng 180 px desktop / 310 px ở màn hình <=1100 px. Ellipsis tiêu đề dài tránh chồng hàng. Cuộn về đầu khi query debounce/bộ lọc thay đổi. Một modal sửa nằm ngoài hàng ảo để không mất khi cuộn.
4. **React.lazy + Suspense:** nút Thống kê mở màn hình trong dashboard, module import động và có Spin fallback. Cùng Redux Provider, thống kê tổng/hoàn thành/quá hạn/theo môn bằng useMemo. Đây là màn hình trong dashboard, không có URL route riêng.

## Điều kiện đo

Windows, Intel i5-1235U, 12 logical processors, RAM khoảng 15,69 GiB; Node 22.12.0; Chrome headless 155.0.8059.40; Lighthouse 12.8.2.

Query benchmark=10000 tự nạp dữ liệu, giữ độ trễ API 650 ms. Route thường vẫn nạp 4 bài.

Profiler development: viewport 1365x768, ô trống → `0`, 3 lần, chờ 2 giây sau nhập bao gồm debounce. Bộ đếm thân AssignmentCard kết hợp callback React.Profiler quanh AssignmentList; không phải export DevTools Flamegraph. Ghi cả commit input, debounce và state bộ đếm, không tính mount ban đầu.

Lighthouse production Navigation, Performance: **Mobile thực tế** 412x823, simulated throttling, CPU 4x, RTT 150 ms. Tham số preset desktop trong script trước không có hiệu lực như mong đợi khi gọi Node API; configSettings JSON xác nhận Mobile. Script đã khai báo formFactor mobile rõ ràng. Thông tin Desktop trong báo cáo cũ chỉ là ý định, không phải cấu hình đo thực tế.

Script truyền Page trực tiếp cho Lighthouse để giữ trang audit và kiểm tra data-total-count=10000. Với virtualization, số dữ liệu khác số DOM card.

## Bảng trước/sau

| Chỉ tiêu | Trước | Sau |
| --- | ---: | ---: |
| Bài tập trong dữ liệu | 10.000 | 10.000 |
| Card trong DOM tại đầu danh sách, viewport Profiler | 10.000 | 7 |
| Render AssignmentCard khi nhập, lần 1/2/3 | 0 / 0 / 0 | 0 / 0 / 0 |
| Commit mỗi lần | 2 | 5 |
| Tổng actualDuration lần 1 (ms) | 1856,0 | 133,0 |
| Tổng actualDuration lần 2 (ms) | 1445,1 | 81,6 |
| Tổng actualDuration lần 3 (ms) | 261,0 | 82,8 |
| Trung vị actualDuration (ms) | 1445,1 | 82,8 |
| Lighthouse Performance hợp lệ /100 | Không có: timeout | 21 / 25 / 23; trung vị **23** |

Trung vị thời gian render subtree giảm khoảng **94,3%** trong mẫu này, không phải cải thiện end-to-end/production. Debounce thêm 300 ms chờ ngoài actualDuration. Baseline biến động lớn, chỉ 3 mẫu; môi trường không cách ly hoàn toàn. Không bảo đảm tỷ lệ này trên mọi máy.

Memo đã có trước nên query giữ nguyên tập kết quả không render lại card ở cả hai phiên bản. Lợi ích là giới hạn DOM/mount và giảm công việc danh sách, không phải giảm từ 10.000 render xuống 0 mỗi phím. Số commit tăng do debounce không có nghĩa tổng công việc tăng.

Baseline Lighthouse có điểm thô 30 nhưng PROTOCOL_TIMEOUT ở CSSUsage và không xác minh được dữ liệu. **Không dùng 30 để kết luận điểm giảm 7 hoặc tính phần trăm cải thiện.** Chưa có baseline hợp lệ để so sánh điểm.

## Lighthouse sau tối ưu

| Lần | Điểm | FCP ms | LCP ms | Speed Index ms | TBT ms | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 21 | 8286 | 10786 | 8516 | 3047 | 0,1510 |
| 2 | 25 | 7192 | 8836 | 7192 | 1948 | 0,1533 |
| 3 | 23 | 7503 | 9836 | 7503 | 2511 | 0,1511 |

Cả ba audit không runtimeError, warnings rỗng, xác nhận 10.000 bài sau audit. Điểm vẫn thấp: tối ưu danh sách không tự động giải quyết tải bundle/layout toàn ứng dụng. Chưa xác định toàn bộ nguyên nhân chỉ từ bảng này.

## Kiểm tra và giới hạn

- Build production và development compile thành công; node --check hai script và git diff --check đạt.
- Chrome: 9 kiểm tra đạt: 10.000 dữ liệu với <20 DOM card; debounce không lọc ngay; tìm bài cuối; mở/đóng sửa; cuộn tới cuối; thống kê 10.000 tổng/1.429 hoàn thành/5 môn; quay lại danh sách giữ dữ liệu; mobile virtualization; route thường 4 bài.
- Lần test đầu timeout vì script thao tác trước khi animation đóng modal kết thúc; đã chờ modal ẩn và chạy lại đạt.
- TypeScript toàn dự án chưa đạt, lỗi tại Loading, OIDCBounder, OneSignalBounder, models/tienich/caidat. Log không báo lỗi trong file bài tập sửa lần này. Không sửa module ngoài phạm vi.
- Chưa kiểm thử tự động đầy đủ sửa/lưu, xóa, hoàn thành, ghim hoặc keyboard accessibility. Thống kê giữ quy tắc isOverdue hiện có, không thay đổi logic hạn nộp.

## Artifact

Workspace: `C:\Users\DELL\Desktop\WEB NÂNG CAO\B23DCCC132_LTWNC_TH01`.

Baseline: `C:\Users\DELL\Desktop\WEB NÂNG CAO\B23DCCC132_LTWNC_TH01\baseline-results`.

Kết quả mới (Profiler JSON/PNG, Lighthouse HTML/JSON 3 lần, test JSON, ảnh mobile): `C:\Users\DELL\Desktop\WEB NÂNG CAO\B23DCCC132_LTWNC_TH01\optimized-results`.

Script đo: `C:\Users\DELL\Desktop\WEB NÂNG CAO\B23DCCC132_LTWNC_TH01\scripts\measure-baseline.cjs`.
Script test: `C:\Users\DELL\Desktop\WEB NÂNG CAO\B23DCCC132_LTWNC_TH01\scripts\test-assignments.cjs`.

Chạy dev port 8000 hoặc phục vụ dist port 8001. BASELINE_TOOLS trỏ node_modules chứa lighthouse/puppeteer-core trong npm cache. Script đo nhận profiler hoặc lighthouse; script test không nhận đối số. MEASUREMENT_OUTPUT đổi thư mục artifact, mặc định optimized-results. Không thêm dependency ứng dụng. Script hiện kiểm tra virtualization, không dùng nguyên bản để đo phiên bản chưa virtualization.
