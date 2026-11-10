// Script test webhook n8n từ terminal Node.js
// Cách chạy: node scripts/test_webhook.js <URL_WEBHOOK>
const url = process.argv[2] || "URL_WEBHOOK_CUA_BAN";

async function testWebhook() {
  if (url === "URL_WEBHOOK_CUA_BAN") {
    console.log("⚠️ Vui lòng truyền URL webhook n8n vào lệnh.");
    console.log("Ví dụ: node scripts/test_webhook.js https://your-n8n.com/webhook-test/tao-cau-hoi");
    return;
  }

  console.log(`🚀 Đang gửi test request tới: ${url}`);
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chuDe: "Nền tảng thương mại điện tử ScentPod",
        yeuCau: "Tạo bộ 5 câu hỏi trắc nghiệm",
        time: new Date().toISOString()
      })
    });

    const elapsed = Date.now() - startTime;
    console.log(`\n✅ Nhận phản hồi sau ${elapsed}ms | HTTP Status: ${response.status} ${response.statusText}`);

    const rawText = await response.text();
    try {
      const json = JSON.parse(rawText);
      console.log("📦 Dữ liệu JSON phản hồi:");
      console.dir(json, { depth: null, colors: true });
    } catch {
      console.log("📄 Dữ liệu Text phản hồi:", rawText);
    }
  } catch (error) {
    console.error("❌ Lỗi kết nối tới n8n:", error.message);
  }
}

testWebhook();

