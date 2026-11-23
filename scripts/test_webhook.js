// Script test webhook n8n từ terminal Node.js
// Cách chạy: node scripts/test_webhook.js [prod|test|URL]
const defaultProdUrl = "https://scentpods.app.n8n.cloud/webhook/tao-cau-hoi";
const defaultTestUrl = "https://scentpods.app.n8n.cloud/webhook-test/tao-cau-hoi";

let url = process.argv[2] || defaultProdUrl;
if (url === "prod") url = defaultProdUrl;
if (url === "test") url = defaultTestUrl;

async function testWebhook() {
  console.log(`🚀 Đang gửi test request tới n8n: ${url}`);
  console.log(`ℹ️ Loại URL: ${url.includes('/webhook-test/') ? '🟡 Test Webhook (cần bấm Test trong n8n)' : '🟢 Production Webhook (yêu cầu workflow Active)'}`);
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

