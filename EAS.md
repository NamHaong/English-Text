# Build & cập nhật qua EAS (Eng Text)

- Expo project: https://expo.dev/accounts/hoangnam68s-team/projects/eng-text
- GitHub: https://github.com/NamHaong/English-Text
- Project ID đã nằm trong `app.json` (`extra.eas.projectId`); `eas.json` định nghĩa các profile build.

## Một lần duy nhất
```powershell
npm install --global eas-cli
eas login
```

## Build (cần làm trước khi có thể cập nhật OTA)
```powershell
eas build --profile preview --platform ios        # bản thử nội bộ
eas build --profile production --platform all     # bản phát hành
```
Mỗi profile gắn với một **channel** cùng tên (`development`, `preview`, `production`).

## Đẩy cập nhật OTA (chỉ đổi JS / ảnh / dữ liệu, không đổi native)
```powershell
eas update --channel preview --message "Mô tả thay đổi"
eas update --channel production --message "Mô tả thay đổi"
```
App chỉ nhận bản cập nhật khi **runtimeVersion** khớp. `runtimeVersion` đang theo `version` trong `app.json`
(policy `appVersion`), nên:
- Đổi code JS / `vocabulary.json` / ảnh: giữ nguyên `version`, chạy `eas update`.
- Thêm/xóa thư viện native, đổi plugin, đổi icon/tên app: **tăng `version`** rồi build lại bằng `eas build`.

## Bảo mật khi đẩy lên Git
Không commit: `.env*`, `*.keystore`, `*.p8`, `*.p12`, `*.mobileprovision`, `credentials.json`,
`google-services.json`, service-account JSON, token EAS/Expo (`EXPO_TOKEN`).
Các mẫu trên đã có trong `.gitignore`. Chữ ký và chứng chỉ do EAS lưu trên server, không nằm trong repo.
Biến bí mật dùng cho build: `eas secret:create` / trang Environment variables trên expo.dev.
Trước khi push, kiểm tra: `git status` và `git diff --cached --stat`.

## GitHub Actions (`.github/workflows/`)
| Workflow | Khi nào chạy | Làm gì |
|---|---|---|
| `ci.yml` | push `main`, mọi pull request | `tsc`, `eslint`, `expo-doctor` |
| `eas-build.yml` | chạy tay | build file `.ipa` **chưa ký** trên macOS của GitHub (không cần Apple Developer hay EXPO_TOKEN), tải ở mục Artifacts (giữ 14 ngày) |
| `eas-update.yml` | push `main`, hoặc chạy tay | `eas update` lên channel `preview`/`production` |

**Thiết lập một lần:** tạo token tại expo.dev > Account settings > Access tokens, rồi trên GitHub vào
Settings > Secrets and variables > Actions > New repository secret, tên **`EXPO_TOKEN`**. Không dán token vào code hay file trong repo.
Push `main` mặc định đẩy OTA lên channel `preview`; muốn phát hành thật, chạy tay `EAS Update` và chọn `production`.
`eas-build.yml` chỉ tạo IPA chưa ký; bạn tự ký và cài bằng công cụ riêng. Cập nhật OTA vẫn đi qua `eas-update.yml`.
