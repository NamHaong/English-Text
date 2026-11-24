# 🏝️ Eng Text - Ứng Dụng Học Từ Vựng Oxford 5000 (Expo SDK 58)

Ứng dụng học từ vựng tiếng Anh Oxford 5000 chuẩn CEFR (A1 - C1), được thiết kế tối ưu hóa cho iPhone với tính năng **Dynamic Island & Live Activities**, giúp từ vựng luôn hiển thị liên tục ngay cả khi bạn thoát ra màn hình chính, ép não bộ ghi nhớ từ vựng tự nhiên mọi lúc mọi nơi!

---

## 🌟 Tính Năng Nổi Bật

### 1. 🏝️ Dynamic Island & Live Activities (Chạy nền không bị mất)
- **Tự động hiển thị từ tiếng Anh + Phiên dịch tiếng Việt** trên Dynamic Island dạng viên thuốc (Compact) hoặc thẻ mở rộng (Expanded).
- Khi người dùng thoát ra màn hình chính để lướt web, xem tin nhắn hoặc sử dụng ứng dụng khác, từ vựng vẫn hiển thị thường trực trên **Dynamic Island** và **Màn hình khóa (Lock Screen)**.
- Tích hợp cả **Bộ mô phỏng Dynamic Island trực quan (In-App Simulator)** hoạt động mượt mà trên Expo Go / mọi thiết bị, và **Mã nguồn gốc Swift ActivityKit Widget** cho bản build iOS gốc!

### 2. ⚡ Chế Độ Học Tự Động & Đánh Dấu [✓ Đã thuộc]
- Từ vựng được xếp thứ tự từ trên xuống dưới theo độ khó chuẩn Oxford CEFR: **A1 ➔ A2 ➔ B1 ➔ B2 ➔ C1**.
- Khi cảm thấy đã thuộc từ hiện tại, người dùng chỉ cần nhấn **nút tích xanh [✓ Đã thuộc từ này]**.
- Hệ thống sẽ rung phản hồi (Haptics), lưu từ vào mục **Đã thuộc**, và tự động nhảy ngay xuống từ tiếp theo!

### 3. 🎯 Mục "Đã Thuộc" & Chế Độ Kiểm Tra (Test Quiz)
- Toàn bộ các từ đã tích sẽ được lưu trữ an toàn trong mục **Đã thuộc**.
- **Chế độ kiểm tra trí nhớ:**
  - Ẩn hoàn toàn nghĩa tiếng Việt, **chỉ hiển thị chữ tiếng Anh** để kiểm tra phản xạ.
  - **Gợi ý dấu gạch dưới:** Hiển thị chính xác số lượng từ và ký tự tiếng Việt bằng các ô gạch dưới `_ _ _ _   _ _ _` (VD: từ "hấp thụ" sẽ gợi ý 4 chữ cái + 3 chữ cái).
  - Khi người dùng gõ câu trả lời tiếng Việt, các ký tự sẽ điền dần vào các ô gạch dưới như trò chơi Wordle.
  - Kiểm tra kết quả ngay lập tức: Báo đúng kèm hiệu ứng vui tươi hoặc cho phép xem đáp án chuẩn.

### 4. 🎨 Giao Diện UI/UX Hiện Đại & Dễ Thương
- Màu sắc pastel gradients dịu mắt, thẻ từ bo tròn hiện đại, biểu tượng cảm xúc sinh động.
- Huy hiệu cấp độ CEFR đa sắc: A1 (Xanh lá), A2 (Xanh lơ), B1 (Vàng cam), B2 (Hồng), C1 (Tím).
- Phát âm chuẩn bản xứ từng từ thông qua công nghệ Speech Synthesis của Apple / Expo.
- Bảng thống kê chuỗi ngày học liên tục (Streak), tỷ lệ chính xác bài kiểm tra và biểu đồ tiến độ.

---

## 📚 Dữ Liệu Từ Vựng

- Dữ liệu được trích xuất và chuẩn hóa trực tiếp từ file tài liệu:
  `D:\APP IOS\The_Oxford_5000_by_CEFR_level.pdf`
- Tổng cộng hơn **2.044 từ vựng** đầy đủ phiên âm IPA quốc tế, từ loại (n, v, adj, adv), dịch nghĩa tiếng Việt tự nhiên và câu ví dụ song ngữ Anh - Việt.

---

## 🚀 Hướng Dẫn Chạy Ứng Dụng

### 1. Cài đặt các thư viện (nếu cần)
```bash
npm install
```

### 2. Khởi chạy ứng dụng Expo
```bash
npx expo start
```
- Nhấn phím `i` để mở trên iOS Simulator (yêu cầu máy macOS).
- Hoặc dùng ứng dụng **Expo Go** trên iPhone thật để quét mã QR và trải nghiệm ngay lập tức.
- Nhấn phím `w` để mở xem nhanh trên trình duyệt Web.

### 3. Cấu trúc thư mục dự án
```
English Text/
├── src/
│   ├── components/
│   │   ├── DynamicIslandSimulator.tsx  # Viên thuốc Dynamic Island mô phỏng
│   │   ├── WordCard.tsx                # Thẻ học từ vựng gradient hiện đại
│   │   ├── UnderscoreHint.tsx          # Bộ gợi ý số lượng ký tự bằng dấu gạch dưới
│   │   └── LevelFilter.tsx             # Bộ lọc cấp độ CEFR A1 - C1
│   ├── screens/
│   │   ├── LearnScreen.tsx             # Màn hình học chính, trượt từ trên xuống dưới
│   │   ├── MasteredScreen.tsx          # Mục đã thuộc & Bài kiểm tra gõ tiếng Việt
│   │   └── StatsScreen.tsx             # Màn hình thống kê tiến độ & chuỗi ngày học
│   ├── services/
│   │   ├── storage.ts                  # Lưu trữ từ đã thuộc & tiến độ (AsyncStorage)
│   │   ├── speech.ts                   # Phát âm giọng đọc tiếng Anh bản xứ
│   │   ├── haptics.ts                  # Rung phản hồi xúc giác
│   │   └── liveActivity.ts             # Quản lý Live Activity & Dynamic Island
│   ├── types/
│   │   └── vocabulary.ts               # Định nghĩa kiểu dữ liệu TypeScript
│   └── data/
│       └── vocabulary.json             # 2044+ từ vựng Oxford 5000 đã trích xuất & dịch nghĩa
├── ios/
│   └── EnglishIslandWidget/            # Native Swift ActivityKit Dynamic Island Extension
│       ├── WordActivityAttributes.swift
│       └── EnglishIslandWidget.swift
├── scripts/
│   └── build_full_oxford_dict.py      # Script Python trích xuất PDF gốc
├── app.json                            # Cấu hình Expo SDK 58 & Live Activities
├── App.tsx                             # Entry point ứng dụng
└── package.json
```
