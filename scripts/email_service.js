/**
 * ==============================================================================
 * SCENTPOD EMAIL SERVICE
 * ==============================================================================
 * Dịch vụ gửi email thông báo yêu cầu mua hàng tới nhóm ScentPod.
 * Email nhận cố định: scentpodcontact@gmail.com (hoặc cấu hình qua biến môi trường).
 * Hỗ trợ các provider: Resend, SendGrid, SMTP hoặc Mock/Simulated transport.
 * ==============================================================================
 */

const https = require('https');
const http = require('http');

// Email nhận cố định của nhóm ScentPod
const DEFAULT_RECIPIENT_EMAIL = 'scentpodcontact@gmail.com';

function getRecipientEmail() {
  return process.env.ORDER_NOTIFICATION_EMAIL || 
         process.env.SCENTPOD_TEAM_EMAIL || 
         DEFAULT_RECIPIENT_EMAIL;
}

/**
 * Định dạng thời gian gửi theo giờ Việt Nam (GMT+7)
 */
function formatVietnamTime(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

/**
 * Xây dựng nội dung email (Text & HTML)
 */
function buildEmailContent({ requestId, sentAt, customer, items }) {
  const formattedTime = formatVietnamTime(new Date(sentAt));
  const recipient = getRecipientEmail();

  // Bảng danh sách mùi nến và số lượng
  const itemsText = items.map(item => `  - ${item.name} (${item.subName || 'Nến 50g'}): ${item.quantity} hũ`).join('\n');

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #2a2420; color: #fff; font-weight: bold;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #2a2420; color: #d4a762; text-align: center;">${item.quantity} hũ</td>
      <td style="padding: 10px; border-bottom: 1px solid #2a2420; color: #a89a8c; font-size: 13px;">${item.labelNotes || item.subName || '50g'}</td>
    </tr>
  `).join('');

  const textBody = `
======================================================================
THÔNG BÁO YÊU CẦU MUA HÀNG MỚI - SCENTPOD
======================================================================
Mã yêu cầu: #${requestId}
Thời điểm gửi: ${formattedTime}
Gửi tới email nhóm: ${recipient}

THÔNG TIN KHÁCH HÀNG:
- Họ và tên: ${customer.name}
- Số điện thoại: ${customer.phone}
- Ghi chú của khách: ${customer.note || '(Không có ghi chú)'}

DANH SÁCH MÙI NẾN VÀ SỐ LƯỢNG:
${itemsText}

Tổng số lượng: ${items.reduce((sum, i) => sum + i.quantity, 0)} hũ nến 50g
======================================================================
Nhóm ScentPod vui lòng sớm liên hệ với khách hàng qua số điện thoại trên để xác nhận mùi hương và địa chỉ nhận hàng!
  `.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Yêu cầu mua hàng mới: #${requestId}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a09; padding: 20px; color: #f5f0eb;">
  <div style="max-width: 600px; margin: 0 auto; background: #14110f; border: 1px solid #d4a762; border-radius: 12px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
    
    <div style="text-align: center; border-bottom: 1px solid rgba(212, 167, 98, 0.25); padding-bottom: 18px; margin-bottom: 22px;">
      <h2 style="color: #d4a762; margin: 0 0 6px 0; font-size: 22px; letter-spacing: 0.5px;">ScentPod — Yêu Cầu Mua Hàng Mới</h2>
      <p style="color: #a89a8c; margin: 0; font-size: 13px;">Hệ thống thông báo tự động tới nhóm phụ trách</p>
    </div>

    <div style="background: rgba(212, 167, 98, 0.08); border-left: 3px solid #d4a762; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
      <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Mã yêu cầu:</strong> <span style="color: #d4a762; font-family: monospace; font-size: 15px;">#${requestId}</span></p>
      <p style="margin: 0; font-size: 13px; color: #a89a8c;"><strong>Thời điểm gửi:</strong> ${formattedTime}</p>
    </div>

    <h3 style="color: #fff; font-size: 16px; margin: 20px 0 10px 0; border-bottom: 1px solid #2a2420; padding-bottom: 6px;">
      👤 Thông Tin Khách Hàng
    </h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
      <tr>
        <td style="padding: 6px 0; width: 140px; color: #a89a8c;">Họ và tên:</td>
        <td style="padding: 6px 0; color: #fff; font-weight: bold;">${customer.name}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #a89a8c;">Số điện thoại:</td>
        <td style="padding: 6px 0;"><a href="tel:${customer.phone}" style="color: #d4a762; text-decoration: none; font-weight: bold; font-size: 15px;">${customer.phone}</a></td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #a89a8c;">Ghi chú:</td>
        <td style="padding: 6px 0; color: #f5f0eb; font-style: italic;">${customer.note ? customer.note : '<span style="color: #777;">(Không có ghi chú)</span>'}</td>
      </tr>
    </table>

    <h3 style="color: #fff; font-size: 16px; margin: 20px 0 10px 0; border-bottom: 1px solid #2a2420; padding-bottom: 6px;">
      🕯️ Mùi Nến &amp; Số Lượng Đã Chọn
    </h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
      <thead>
        <tr style="background: rgba(255,255,255,0.03); text-align: left;">
          <th style="padding: 10px; border-bottom: 2px solid #d4a762; color: #d4a762; font-size: 13px;">Mùi Nến 50g</th>
          <th style="padding: 10px; border-bottom: 2px solid #d4a762; color: #d4a762; text-align: center; font-size: 13px;">Số Lượng</th>
          <th style="padding: 10px; border-bottom: 2px solid #d4a762; color: #d4a762; font-size: 13px;">Ghi Chú Mùi</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="background: #1a1614; border: 1px dashed rgba(212, 167, 98, 0.4); border-radius: 8px; padding: 14px; text-align: center; font-size: 13px; color: #d4a762; line-height: 1.5;">
      📞 <strong>Hành động tiếp theo:</strong> Nhóm ScentPod vui lòng gọi điện hoặc nhắn tin cho khách hàng qua số <strong>${customer.phone}</strong> để xác nhận đơn và địa chỉ giao nến!
    </div>

    <div style="margin-top: 24px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #221c18; padding-top: 14px;">
      Email này được gửi tự động tới ${recipient} khi khách hàng gửi biểu mẫu yêu cầu mua hàng trên ScentPod.
    </div>
  </div>
</body>
</html>
  `.trim();

  return { textBody, htmlBody, formattedTime };
}

/**
 * Gửi email qua dịch vụ ngoài hoặc giả lập
 * @param {Object} options
 * @param {string} options.requestId Mã yêu cầu
 * @param {string} options.sentAt ISO timestamp
 * @param {Object} options.customer { name, phone, note }
 * @param {Array} options.items Danh sách { name, subName, quantity, ... }
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
async function sendPurchaseRequestNotification({ requestId, sentAt, customer, items }) {
  // 1. Kiểm tra cờ mô phỏng lỗi (phục vụ kiểm thử lỗi gửi mail theo yêu cầu 7)
  if (process.env.SIMULATE_EMAIL_ERROR === 'true') {
    throw new Error('Dịch vụ gửi email tạm thời gián đoạn (Simulated Email Service Error).');
  }

  const recipient = getRecipientEmail();
  const subject = `[ScentPod] Yêu cầu mua hàng mới: #${requestId} - ${customer.name} (${customer.phone})`;
  const { textBody, htmlBody } = buildEmailContent({ requestId, sentAt, customer, items });

  // 2. Kiểm tra nếu có API key của Resend
  const resendApiKey = process.env.RESEND_API_KEY || process.env.EMAIL_SERVICE_API_KEY;
  if (resendApiKey && resendApiKey.startsWith('re_')) {
    return await sendViaResend({
      apiKey: resendApiKey,
      from: process.env.EMAIL_FROM || 'ScentPod Website <onboarding@resend.dev>',
      to: recipient,
      subject,
      text: textBody,
      html: htmlBody
    });
  }

  // 3. Kiểm tra nếu có API key của SendGrid
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  if (sendgridApiKey && sendgridApiKey.startsWith('SG.')) {
    return await sendViaSendGrid({
      apiKey: sendgridApiKey,
      from: process.env.EMAIL_FROM || 'scentpodcontact@gmail.com',
      to: recipient,
      subject,
      text: textBody,
      html: htmlBody
    });
  }

  // 4. Mặc định trong môi trường dev/local: Dùng Simulated Email Transport
  // Ghi log chi tiết nội dung email được gửi đến email nhóm cố định
  console.log('\n' + '='.repeat(70));
  console.log(`📧 [EMAIL SERVICE - ĐÃ GỬI THÀNH CÔNG TỚI NHÓM SCENTPOD]`);
  console.log(`- Đến: ${recipient}`);
  console.log(`- Tiêu đề: ${subject}`);
  console.log(`- Mã yêu cầu: #${requestId}`);
  console.log(`- Khách hàng: ${customer.name} | SĐT: ${customer.phone}`);
  console.log(`- Số loại nến: ${items.length} (Tổng ${items.reduce((s, i) => s + i.quantity, 0)} hũ)`);
  console.log('='.repeat(70) + '\n');

  return {
    success: true,
    provider: 'simulated',
    messageId: 'sim_' + Date.now(),
    recipient,
    sentAt
  };
}

/**
 * Gửi qua Resend REST API (Sử dụng native https của Node.js, không cần thư viện ngoài)
 */
function sendViaResend({ apiKey, from, to, subject, text, html }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, provider: 'resend', messageId: json.id, recipient: to });
          } else {
            reject(new Error(`Resend API Error (${res.statusCode}): ${json.message || body}`));
          }
        } catch {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, provider: 'resend', recipient: to });
          } else {
            reject(new Error(`Resend API HTTP ${res.statusCode}: ${body}`));
          }
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Lỗi kết nối Resend: ${err.message}`)));
    req.write(payload);
    req.end();
  });
}

/**
 * Gửi qua SendGrid REST API
 */
function sendViaSendGrid({ apiKey, from, to, subject, text, html }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html }
      ]
    });

    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, provider: 'sendgrid', recipient: to });
        } else {
          reject(new Error(`SendGrid Error (${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Lỗi kết nối SendGrid: ${err.message}`)));
    req.write(payload);
    req.end();
  });
}

module.exports = {
  DEFAULT_RECIPIENT_EMAIL,
  getRecipientEmail,
  buildEmailContent,
  sendPurchaseRequestNotification
};

