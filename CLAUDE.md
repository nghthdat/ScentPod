# ScentPod

Website tĩnh (HTML/CSS/JS), deploy trên Vercel: https://scentpodpt11.vercel.app
Vercel tự deploy mỗi khi có push lên nhánh `main` của https://github.com/nghthdat/ScentPod.

## Quy tắc tự động đưa lên web

Sau mỗi lần sửa file theo yêu cầu, luôn tự động (không cần hỏi lại):
1. `git add` các file đã sửa (chỉ file liên quan, không add ảnh screenshot_test_* hay file rác).
2. `git commit` với message ngắn gọn bằng tiếng Việt không dấu mô tả thay đổi.
3. `git push` lên `main`.
4. Báo lại cho người dùng là web sẽ cập nhật sau khoảng 1 phút.

Nếu người dùng nói "đừng push" / "chỉ sửa thôi" thì không commit/push.
