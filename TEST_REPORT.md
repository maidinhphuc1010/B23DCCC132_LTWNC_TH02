# BÁO CÁO KIỂM THỬ TÍNH NĂNG ASSIGNMENTS

**Dự án:** B23DCCC132_LTWNC_TH01  
**Ngày lập báo cáo:** 13/10/2026  
**Phạm vi:** `src/features/assignments` và các component dashboard liên quan  
**Công cụ:** Jest 29, ts-jest, React Testing Library, `@testing-library/user-event`, `@testing-library/react-hooks`, jsdom

## 1. Mục tiêu kiểm thử

Bộ kiểm thử nhằm xác minh logic ngày hạn, thống kê, reducer `assignmentsSlice`, giao diện `AssignmentCard`, form thêm bài tập, trạng thái loading/thành công/lỗi của `AssignmentList`, hook debounce và coverage tối thiểu 70% cho `src/features/`.

## 2. Cấu hình và cách chạy

File cấu hình: `jest.config.ts`.

Các thiết lập chính:

```ts
testEnvironment: 'jsdom'
testMatch: ['tests/**/*.test.ts', 'tests/**/*.test.tsx']
transform: ts-jest
setupFilesAfterEnv: ['tests/setup.ts']
collectCoverageFrom: ['src/features/**/*.{ts,tsx}']
coverageReporters: ['text', 'html', 'lcov', 'json-summary']
coverageThreshold: {
  global: { statements: 0 },
  './src/features/': { statements: 70 },
}
```

Lệnh chạy chính:

```bash
npm test
```

Script trong `package.json`:

```json
"test": "jest --config jest.config.ts --runInBand --coverage"
```

Chạy không coverage:

```bash
npx jest --config jest.config.ts --runInBand
```

## 3. File kiểm thử

| File | Nội dung |
|---|---|
| `tests/unit.test.ts` | Ngày hạn, thống kê, reducer, generator, type guard |
| `tests/components.test.tsx` | `AssignmentCard`, `AssignmentForm` |
| `tests/async.test.tsx` | `AssignmentList` với API mock |
| `tests/hooks.test.tsx` | `useDebounce`, filter hook, theme hook |
| `tests/setup.ts` | `jest-dom`, `matchMedia` cho jsdom |
| `tsconfig.test.json` | Cấu hình TypeScript cho test |

## 4. Phân loại test case

Tổng cộng **27 test case**, vượt yêu cầu tối thiểu 12.

### 4.1. Unit — 15 test case

| STT | Nội dung |
|---:|---|
| 1 | `calcDaysLeft` với ngày còn hơn một ngày, kiểm tra làm tròn lên |
| 2 | `calcDaysLeft` tại deadline và ngày không hợp lệ |
| 3 | `isOverdue` với bài chưa hoàn thành, đã quá hạn |
| 4 | `isOverdue` với bài đã hoàn thành |
| 5 | `isOverdue` với bài chưa đến hạn |
| 6 | Biên quá hạn nhỏ hơn một ngày |
| 7 | `calcStats` với danh sách rỗng |
| 8 | `calcStats` với nhiều môn học và trạng thái |
| 9 | Reducer state ban đầu và action không xác định |
| 10 | `addAssignment`: tạo ID, thêm đầu danh sách, mặc định chưa hoàn thành |
| 11 | `updateAssignment` với ID tồn tại/không tồn tại |
| 12 | `toggleAssignment` hai lần và ID không tồn tại |
| 13 | `removeAssignment`, `replaceAssignments` |
| 14 | Lifecycle async: `pending`, `fulfilled`, `rejected` |
| 15 | Generator 10.000 phần tử và type guard dữ liệu không hợp lệ |

### 4.2. Component — 6 test case

| STT | Đối tượng | Nội dung |
|---:|---|---|
| 1 | `AssignmentCard` | Hiển thị tiêu đề, môn học, ưu tiên, hạn nộp |
| 2 | `AssignmentCard` | Nút “Hoàn thành” xác nhận và gọi callback đúng ID |
| 3 | `AssignmentCard` | Nút “Hủy” không thay đổi dữ liệu |
| 4 | `AssignmentCard` | Ghim/bỏ ghim cập nhật Zustand và aria-label |
| 5 | `AssignmentForm` | Validate các trường bắt buộc |
| 6 | `AssignmentForm` | Submit dữ liệu hợp lệ vào Redux và đóng form |

### 4.3. Bất đồng bộ — 3 test case

API được mock bằng `jest.mock('@/features/assignments/api', ...)`.

| STT | Trạng thái | Nội dung |
|---:|---|---|
| 1 | Loading | Hiển thị loading, chưa hiển thị item |
| 2 | Thành công | Hiển thị item và cập nhật Redux status |
| 3 | Lỗi/retry | Hiển thị lỗi, retry thành công sau khi bấm “Tải lại” |

### 4.4. Hook — 3 test case

| STT | Đối tượng | Nội dung |
|---:|---|---|
| 1 | `useDebounce` | Chưa cập nhật trước 300 ms, cập nhật sau đủ thời gian |
| 2 | `useDebounce` | Nhập liên tiếp reset timer, custom delay và unmount hủy timer |
| 3 | Filter/theme hook | Lọc theo trạng thái, tìm kiếm không phân biệt hoa thường, đổi theme |

Test debounce sử dụng `renderHook`, `jest.useFakeTimers()` và `jest.advanceTimersByTime()`.

## 5. Kết quả chạy test

| Hạng mục | Kết quả |
|---|---:|
| Test suite | **4 passed / 4** |
| Test case | **27 passed / 27** |
| Failed | **0** |
| Skipped | **0** |
| Coverage statements | **95,13%** |
| Coverage branches | **83,33%** |
| Coverage functions | **93,18%** |
| Coverage lines | **96,26%** |
| Ngưỡng statements yêu cầu | **70%** |
| Đạt coverage | **Có** |

### Coverage theo module

| Module | Statements |
|---|---:|
| `api.ts` | 40,00% |
| `generator.ts` | 100,00% |
| `hooks.ts` | 100,00% |
| `index.ts` | 100,00% |
| `pinStore.ts` | 100,00% |
| `slice.ts` | 100,00% |
| `stats.ts` | 100,00% |
| `store.ts` | 100,00% |
| `theme.tsx` | 94,11% |
| `types.ts` | 100,00% |
| **Toàn bộ `src/features/`** | **95,13%** |

Bộ test đạt yêu cầu: đủ 4 nhóm test; có test cho `isOverdue`, `calcDaysLeft`, `calcStats`, reducer assignments; có RTL/userEvent cho card và form; có loading, success, error/retry; có fake timers cho debounce; 27 test case lớn hơn mức tối thiểu 12; coverage statements 95,13% cao hơn ngưỡng 70%.

## 6. Kiểm tra bổ sung

```bash
npx tsc --noEmit --project tsconfig.test.json --pretty false
git diff --check
```

Kết quả ghi nhận: TypeScript config dành cho test pass; kiểm tra whitespace/diff pass; `npm test` pass.

## 7. Cảnh báo và giới hạn

1. `async-validator` có thể in `console.warn` khi validate form do đặc điểm của Ant Design 4; cảnh báo không làm test thất bại.
2. Có cảnh báo Browserslist và deprecation `punycode` từ dependency môi trường.
3. Test component chưa bao phủ đầy đủ thao tác sửa/lưu, xóa, keyboard accessibility và layout mobile end-to-end.
4. API trong test async được mock, không kiểm thử server hoặc network thật.
5. `api.ts` có coverage thấp hơn do các test `AssignmentList` mock API ở cấp module; hành vi API thật không phải mục tiêu của nhóm test này.
6. Coverage được sinh tại thư mục `coverage/` sau mỗi lần chạy `npm test`.

## 8. Kết luận chung

Với **27/27 test pass** và **95,13% statement coverage** cho `src/features/`, các logic cốt lõi của assignments, tương tác UI chính, trạng thái bất đồng bộ và debounce đã được xác minh tự động.

**Đánh giá cuối cùng: ĐẠT.**
