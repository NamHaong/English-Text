const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetChannel = process.argv[2] || 'preview';
const messageArg = process.argv[3];

const pkgPath = path.join(__dirname, '..', 'package.json');
const appJsonPath = path.join(__dirname, '..', 'app.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Auto increment patch version: 1.0.0 -> 1.0.1
const currentVersion = appJson.expo.version || pkg.version || '1.0.0';
const parts = currentVersion.split('.').map((n) => parseInt(n, 10) || 0);
while (parts.length < 3) parts.push(0);
parts[2] += 1;
const newVersion = parts.join('.');

console.log(`🚀 [Auto-Update] Nâng phiên bản: ${currentVersion} ➔ ${newVersion}`);

// Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

// Update app.json
appJson.expo.version = newVersion;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n', 'utf8');

console.log(`✅ Đã lưu phiên bản mới ${newVersion} vào app.json và package.json.`);

// Commit version bump if git is available
try {
  execSync('git add package.json app.json', { stdio: 'inherit' });
  execSync(`git commit -m "chore(release): bump version to ${newVersion}"`, { stdio: 'inherit' });
  console.log(`✅ Đã commit bản cập nhật v${newVersion} vào git.`);
} catch {
  console.log('ℹ️ Bỏ qua git commit (có thể chưa có thay đổi mới hoặc git chưa cấu hình).');
}

// Publish directly to Expo using EAS Update
const updateMsg = messageArg || `Bản cập nhật v${newVersion} - ${new Date().toLocaleString('vi-VN')}`;
console.log(`📡 Đang đẩy trực tiếp lên Expo channel '${targetChannel}'...`);
try {
  execSync(`npx eas-cli update --channel "${targetChannel}" --message "${updateMsg}" --non-interactive`, {
    stdio: 'inherit',
  });
  console.log(`\n🎉 THÀNH CÔNG! Bản cập nhật v${newVersion} đã được đẩy lên Expo channel '${targetChannel}'.`);
  console.log(`📲 Khi người dùng mở app, app sẽ tự động nhận và tải phiên bản v${newVersion} về!`);
} catch (err) {
  console.error('❌ Lỗi đẩy lên Expo:', err.message);
  process.exit(1);
}
