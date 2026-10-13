## Cập nhật đo tự động ngày 13/10/2026

Phần cập nhật này thay thế trạng thái chưa đo Profiler bên dưới. Không thực hiện tối ưu danh sách.

### Môi trường và phương pháp

- Windows; CPU Intel Core i5-1235U, 12 logical processors, RAM khoảng 15,69 GiB.
- Node 22.12.0; Chrome headless 155.0.8059.40; Lighthouse 12.8.2.
- Công cụ trình duyệt dùng từ npm cache ngoài dự án, không thêm dependency ứng dụng.
- Thêm query `benchmark=10000` để API mẫu trả 10.000 bài tập sau cùng độ trễ 650 ms; route bình thường vẫn trả 4 bài tập. Dữ liệu được tạo lại sau navigation, không phụ thuộc thao tác bấm nút.
- Profiler: development server, viewport 1365 × 768, React `<Profiler>` quanh AssignmentList kết hợp bộ đếm lời gọi thân AssignmentCard đã có. JSON là dữ liệu callback API Profiler, **không phải export React DevTools** và không cung cấp Flamegraph từng card.
- Lighthouse: production build, Desktop preset, Navigation, Performance. Production không gắn wrapper Profiler.

### Kết quả Profiler thực đo

Kịch bản mỗi lần: chờ mount 10.000 card; xóa tìm kiếm ngoài khoảng ghi; reset dữ liệu ghi; nhập một ký tự `0`; lấy các commit sau nhập. Không gộp mount ban đầu vào số render tìm kiếm.

| Lần | Query | Card hiển thị | Render AssignmentCard sau nhập | Commit Profiler | Tổng actualDuration (ms) |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | trống → `0` | 10.000 | 0 | 2 | 1856,0 |
| 2 | trống → `0` | 10.000 | 0 | 2 | 1445,1 |
| 3 | trống → `0` | 10.000 | 0 | 2 | 261,0 |

Trung vị tổng actualDuration: 1445,1 ms. Đây là thời gian render subtree trong development, không phải thời gian phản hồi phím, thời gian commit DOM hay thông số production. Biến động lớn giữa các lần; không dùng ba mẫu này để khẳng định thời gian ổn định. Không bật CPU/network throttling cho phép đo Profiler.

Cả ba lần bộ đếm và payload commit đều ghi 0 render card. AssignmentCard hiện dùng memo và assignment giữ tham chiếu khi lọc. Tuy vậy, component danh sách vẫn cập nhật; lọc, sắp xếp, tạo element và reconciliation vẫn có chi phí. Kết quả chỉ áp dụng cho query không làm thay đổi tập kết quả; không suy rộng sang xóa/mount lại card.

### Kết quả Lighthouse: chưa có điểm hợp lệ

Đã chạy audit production. Artifact trả điểm thô 0,30 (30/100), nhưng đồng thời trả lỗi:

```text
PROTOCOL_TIMEOUT
Waiting for DevTools protocol response has exceeded the allotted time.
Method: CSS.startRuleUsageTracking
Artifact: CSSUsage
```

Không xác nhận được số card sau audit (`cardsAfterAudit: null`). Server cũng redirect từ `/dashboard?benchmark=10000` sang `/dashboard/?benchmark=10000`. Script đã từ chối audit và dừng, không chạy tiếp hai lần còn lại.

**Không báo 30/100 là baseline Performance chính thức. Điểm Performance hợp lệ vẫn chưa đo được.** Cần chạy lại audit thành công, dùng URL có dấu `/` cuối và xác minh fixture trong lần audit. Timeout là giới hạn của lần chạy này, chưa đủ căn cứ quy nguyên nhân cho riêng ứng dụng hoặc phần cứng.

### Bằng chứng và chạy lại

Thư mục artifact tuyệt đối:
`C:\Users\DELL\Desktop\WEB NÂNG CAO\B23DCCC132_LTWNC_TH01\baseline-results`

- `profiler.json`: ba lần đo và thông tin từng commit.
- `profiler.png`: ảnh giao diện sau đo.
- `lighthouse-1.html`, `lighthouse-1.json`: audit lỗi được giữ lại để kiểm tra.
- `lighthouse-summary.json`: tóm tắt điểm thô, lỗi và việc không xác minh được card.

Script: `C:\Users\DELL\Desktop\WEB NÂNG CAO\B23DCCC132_LTWNC_TH01\scripts\measure-baseline.cjs`.
Đặt biến môi trường BASELINE_TOOLS tới thư mục node_modules ngoài dự án chứa lighthouse và puppeteer-core. Script nhận đối số `profiler` (localhost:8000) hoặc `lighthouse` (localhost:8001). Cần khởi động development server cho Profiler hoặc server phục vụ dist cho Lighthouse trước khi chạy. Script tự mở/đóng Chrome, nhập tìm kiếm, xuất artifact và báo lỗi nếu điều kiện không đạt. Lần chạy lại ghi đè artifact cùng tên; sao lưu trước nếu cần giữ lịch sử.

Kiểm tra đã thực hiện: build production thành công, development compile thành công, kiểm tra cú pháp script bằng `node --check`, đo thực trên Chrome, kiểm tra diff whitespace. Chưa có kết quả TypeScript/lint toàn dự án; không tuyên bố đã chạy các kiểm tra đó.

---


# Báo cáo baseline — danh sách 10.000 bài tập

## Trạng thái: chưa hoàn tất phép đo thực tế

Ngày kiểm tra: 13/10/2026. Không thực hiện tối ưu hoặc thay đổi logic ứng dụng trong đợt kiểm tra này. Đây là biên bản kiểm tra và quy trình đo, **không phải báo cáo số liệu Profiler/Lighthouse đã hoàn tất**.

| Chỉ tiêu yêu cầu | Kết quả thực đo |
| --- | --- |
| AssignmentCard render khi gõ tìm kiếm | Chưa có bản ghi React Profiler |
| Lighthouse Performance /100 | Chưa có audit hợp lệ với 10.000 bài tập |

Không dùng số lượng bài tập để suy ra số render; không điền điểm Performance ước lượng.

## Những gì đã kiểm chứng

- Môi trường Windows, Node v22.12.0, npm 10.9.0. Dự án khai báo Node 16.x; đây là khác biệt môi trường cần ghi nhận khi tái lập.
- Dự án dùng React 17, Umi 3, Ant Design 4, Redux Toolkit.
- Đã chạy `npm run build`, kiểm tra đầu ra production được tạo. Build thành công không đồng nghĩa đã kiểm chứng hiệu năng trong trình duyệt.
- Trang danh sách là route `/dashboard`.
- Nút “Tạo 10.000 bài tập mẫu” gọi generator với mặc định 10.000 phần tử rồi thay thế danh sách Redux. Thao tác này thay thế dữ liệu đang có trong phiên, nên chỉ dùng phiên kiểm thử.
- `AssignmentCard` hiện đã bọc `memo`; hook lọc đã có `useMemo`. Baseline phải phản ánh nguyên trạng này, không tháo memo để làm số liệu xấu hơn.
- Danh sách đang map toàn bộ kết quả, chưa thấy virtualization ở trang này.
- Bộ đếm hiện tại tăng trong thân AssignmentCard, reset khi đổi tìm kiếm và đọc trong effect. Đây là bộ đếm lời gọi render, không phải bản ghi Profiler; cập nhật state hiển thị bộ đếm còn có thể tạo commit bổ sung.
- Chưa có Lighthouse, Puppeteer hoặc Playwright resolve được từ dependencies của dự án. Chrome và Edge có trên máy. Phiên kiểm tra này chưa thu thập được trace trình duyệt hoặc export React DevTools Profiler.

## Rủi ro quan trọng khi đo Lighthouse

Dữ liệu stress test chỉ nằm trong Redux, không được lưu để khôi phục khi tải lại. API mặc định trả về **4 bài tập** sau khoảng 650 ms.

Vì Lighthouse Navigation tải lại trang, bấm tạo 10.000 bài tập rồi chạy Navigation ngay **không đảm bảo đo 10.000 bài tập**. Không được báo cáo điểm của trang 4 bài tập như baseline 10.000.

Cần chuẩn bị fixture/khởi tạo dữ liệu kiểm thử có thể tái lập sau navigation, tách biệt dữ liệu thông thường. Xác nhận thực tế 10.000 bài tập được tải trong chính lần audit. Nếu dùng Lighthouse Timespan sau khi bấm tạo dữ liệu, phải ghi rõ chế độ và không coi đó là điểm Navigation tương đương.

## Quy trình React DevTools Profiler cần thực hiện

1. Chạy development build, mở `/dashboard` với React DevTools; ghi phiên bản Chrome, React DevTools, CPU/RAM, viewport và cấu hình StrictMode thực tế.
2. Chọn trạng thái “Tất cả”, bỏ tìm kiếm và dùng phiên không có bài ghim. Bấm tạo 10.000 bài tập; chờ cập nhật hoàn tất và xác nhận nhãn danh sách là 10.000.
3. Bắt đầu ghi Profiler **sau mount**, không gộp render khi tạo dữ liệu vào render tìm kiếm.
4. Gõ từng ký tự `b`, `à`, `i` để thành `bài`, chờ mỗi cập nhật hoàn tất. Cả 10.000 tiêu đề mẫu đều khớp chuỗi này. Ghi rõ phương thức nhập; dùng cùng phương thức khi đo sau tối ưu, tránh khác biệt do IME/composition.
5. Với mỗi ký tự, ghi số commit, số instance AssignmentCard thực sự render, tổng render AssignmentCard trên các commit liên quan và thời gian commit. Component cha render không có nghĩa mọi card render.
6. Ghi riêng thao tác thu hẹp và mở rộng kết quả; card mount lại khi mở rộng không được gọi là re-render của card vẫn đang hiển thị. Không tính thao tác reset vào lần gõ kế tiếp.
7. Lặp 3 lần từ trạng thái ban đầu giống nhau; export JSON Profiler và chụp Ranked/Flamegraph. Đối chiếu với bộ đếm trên trang, không dùng bộ đếm làm bằng chứng Profiler duy nhất.

| Lần đo | Chuỗi sau nhập | Kết quả hiển thị | Commit | Tổng render AssignmentCard | Thời gian |
| --- | --- | --- | --- | --- | --- |
| Chưa thực hiện | `b` → `bà` → `bài` | Cần xác nhận 10.000 mỗi bước | Chưa đo | Chưa đo | Chưa đo |

Với memo và tham chiếu assignment ổn định, card còn trong danh sách có thể được bỏ qua render khi đổi query. Đây chỉ là nhận xét từ mã nguồn, **không phải số liệu đo được**. Dù card không render lại, lọc/sắp xếp/reconcile vẫn có chi phí.

## Quy trình Lighthouse cần thực hiện

1. Phục vụ production build trên localhost và xử lý điều kiện fixture sau reload nêu trên; không dùng dev server để báo điểm production.
2. Chọn Navigation, Performance, Mobile với cấu hình throttling mặc định; ghi chính xác phiên bản Lighthouse, Chrome và cấu hình thực tế. Nếu đo Desktop, báo riêng, không trộn hai chế độ.
3. Đóng React DevTools Profiler, tắt extension không cần thiết, giữ máy ít tải. Dùng cùng cấu hình cache/storage giữa các lần đo.
4. Audit 3 lần với ô tìm kiếm trống, bộ lọc Tất cả và 10.000 bài tập trong lần navigation. Xuất HTML/JSON từng lần.
5. Báo điểm Performance từng lần và trung vị; kèm FCP, LCP, Speed Index, TBT, CLS cùng cảnh báo audit. Điểm Performance đo tải trang, không trực tiếp biểu diễn số lần render khi gõ.

## Kết luận

Chưa đủ bằng chứng để kết luận số render hoặc điểm Performance. Chưa thực hiện tối ưu. Cần hoàn tất bản ghi Profiler và audit Lighthouse đúng bộ dữ liệu trước khi dùng báo cáo này để so sánh trước/sau.
Ưu tiên tiếp theo là chuẩn bị fixture tồn tại qua navigation và thu thập các artifact đo; không thay đổi memoization, debounce hay cách render danh sách trong bước baseline.
 Không có số liệu giả định được trình bày như kết quả thực nghiệm.

Các đường dẫn mã nguồn dưới đây đều nằm trong workspace:
`C:\Users\DELL\Desktop\WEB NÂNG CAO\B23DCCC132_LTWNC_TH01`.

- Trang và bộ đếm: `C:\Users\DELL\Desktop\WEB NÂNG CAO\B23DCCC132_LTWNC_TH01\src\pages\TrangChu\index.tsx`.
- Generator: `C:\Users\DELL\Desktop\WEB NÂNG CAO\B23DCCC132_LTWNC_TH01\src\features\assignments\generator.ts`.
- API mặc định: `C:\Users\DELL\Desktop\WEB NÂNG CAO\B23DCCC132_LTWNC_TH01\src\features\assignments\api.ts`.
- Hook lọc: `C:\Users\DELL\Desktop\WEB NÂNG CAO\B23DCCC132_LTWNC_TH01\src\features\assignments\hooks.ts`.
