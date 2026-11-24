# 🕯️ ScentPod - Nền Tảng Thương Mại Điện Tử & Hệ Thống AI Shopping Assistant

> **Dự án Bài tập lớn (BTL) / Đồ án môn học:** Phát triển Hệ thống Thương mại Điện tử & Ứng dụng Trí tuệ Nhân tạo  
> **Đơn vị thực hiện:** Nhóm Dự án ScentPod  
> **Thời điểm thẩm định & triển khai:** Tháng 11/2026  
> **Trạng thái:** ✅ Đã đóng gói hoàn chỉnh, 25/25 automated tests PASS (100%), sẵn sàng chạy thử cục bộ (Zero-config).

---

## 📌 MỤC LỤC NHANH
1. [Hướng dẫn Giảng viên Chạy thử Nhanh (Quick Start)](#-hướng-dẫn-giảng-viên-chạy-thử-nhanh-quick-start)
2. [Tài liệu Báo cáo Nghiên cứu Kèm theo (Academic Reports)](#-tài-liệu-báo-cáo-nghiên-cứu-kèm-theo)
3. [Các Kịch bản Thẩm định Thực tế trên Website](#-các-kịch-bản-thẩm-định-thực-tế-trên-website)
4. [Kiến trúc Kỹ thuật & Ma trận 14 AI Skills](#-kiến-trúc-kỹ-thuật--ma-trận-14-ai-skills)
5. [Ứng dụng AI Prompt Engineering trong Dự án](#-ứng-dụng-ai-prompt-engineering-trong-dự-án)
6. [Cấu trúc Thư mục Dự án](#-cấu-trúc-thư-mục-dự-án)
7. [Cam kết Liêm chính Khoa học & Bảo mật](#-cam-kết-liêm-chính-khoa-học--bảo-mật)

---

## 🚀 HƯỚNG DẪN GIẢNG VIÊN CHẠY THỬ NHANH (QUICK START)

Dự án được thiết kế theo triết lý **Zero-Configuration Out-of-the-Box**: Giảng viên và người chấm **không cần đăng ký bất kỳ API key bên thứ ba nào** để chạy thử và kiểm thử hệ thống. Động cơ cục bộ (Local Deterministic Engine) và dịch vụ email mô phỏng đã được tích hợp sẵn sàng.

### Yêu cầu môi trường:
- Đã cài đặt **Node.js** (phiên bản 18 trở lên).
- Trình duyệt web hiện đại (Chrome, Safari, Edge, Firefox).

---

### Bước 1: Tải mã nguồn về máy
```bash
git clone https://github.com/nghthdat/ScentPod.git
cd ScentPod
```

### Bước 2: Cài đặt thư viện phụ thuộc
```bash
npm install
```

### Bước 3: Chạy bộ kiểm thử tự động toàn diện (25 Tests)
Giảng viên có thể chạy kiểm chứng chất lượng toàn bộ logic AI và nghiệp vụ giỏ hàng ngay trên terminal:
```bash
npm test
```
*Kết quả mong đợi:*
- **AI Shopping Assistant Suite**: 17/17 tests PASS (100%).
- **Purchase Request & Email Suite**: 8/8 tests PASS (100%).

### Bước 4: Khởi chạy máy chủ cục bộ
```bash
npm start
```
*Mở trình duyệt và truy cập:*  
👉 **`http://localhost:3100`**

---

### Các lệnh bổ sung hữu ích:
| Lệnh | Chức năng |
| :--- | :--- |
| `npm test` | Chạy toàn bộ 25 bài kiểm thử tự động (AI Assistant + Giỏ hàng + Email) |
| `npm run test:agent` | Chạy riêng bộ 17 bài test logic của Trợ lý Mua hàng AI |
| `npm run test:purchase` | Chạy riêng bộ 8 bài test biểu mẫu mua hàng, chống gian lận giá và email |
| `npm run agent` | Trải nghiệm tương tác trực tiếp với Trợ lý AI trên giao diện dòng lệnh (CLI) |
| `npm start` | Chạy máy chủ web cục bộ tại cổng 3100 |

---

## 📄 TÀI LIỆU BÁO CÁO NGHIÊN CỨU KÈM THEO

Nhóm nghiên cứu đã biên soạn đầy đủ tài liệu học thuật chuyên sâu và đính kèm trực tiếp trong kho mã nguồn:

1. **Bản Báo cáo Chuyên đề: AI Prompt Engineering & Bộ AI Skills BTL**:
   - Định dạng Markdown: [`bao_cao_ai_prompt_engineering_va_ai_skills_btl.md`](./bao_cao_ai_prompt_engineering_va_ai_skills_btl.md)
   - Định dạng HTML (in ấn / lưu PDF): [`bao_cao_ai_prompt_engineering_va_ai_skills_btl.html`](./bao_cao_ai_prompt_engineering_va_ai_skills_btl.html)
2. **Bản Báo cáo Học thuật Toàn diện v3.0 (Rigorous Academic Edition)**:
   - Định dạng Markdown: [`bao_cao_ai_prompt_engineering_v3.0.md`](./bao_cao_ai_prompt_engineering_v3.0.md)
   - Định dạng HTML: [`bao_cao_ai_prompt_engineering_v3.0.html`](./bao_cao_ai_prompt_engineering_v3.0.html)

---

## 🧪 CÁC KỊCH BẢN THẨM ĐỊNH THỰC TẾ TRÊN WEBSITE

Khi khởi chạy máy chủ tại `http://localhost:3100`, Thầy/Cô có thể trực tiếp trải nghiệm 3 kịch bản cốt lõi:

### Kịch bản 1: Trải nghiệm Trợ lý Mua hàng AI (Chat Widget góc phải màn hình)
Bấm vào biểu tượng **"✨ Trợ Lý Mua Hàng AI"** ở góc phải dưới màn hình:
1. **Thử nghiệm phân tích ngân sách đồng nhất (90k vs 90.000đ)**:
   - *Nhập thử*: `"Tầm 90k có mùi nào không?"` hoặc `"Ngân sách 90.000đ"`
   - *Kết quả*: Chatbot nhận diện đúng giá trị `90.000 VND`, gợi ý chuẩn xác các hũ nến 85.000đ phù hợp (không bị nhầm sang báo lỗi budget quá thấp).
2. **Thử nghiệm ghi nhớ ngữ cảnh đàm thoại nối tiếp (Contextual Memory)**:
   - *Lượt 1*: Nhập `"Tư vấn nến phòng ngủ giúp thư giãn dễ ngủ"` &rarr; Chatbot gợi ý hũ **Beloved Summer (Blind Date)**.
   - *Lượt 2 (Dùng đại từ chỉ định)*: Nhập `"Mùi này dùng khi nào?"` hoặc `"Hũ này đốt được bao lâu?"`
   - *Kết quả*: Chatbot ghi nhớ chính xác hũ Beloved Summer vừa thảo luận và trả lời chi tiết về thời điểm, không gian sử dụng và thời gian đốt (12-15 giờ).
3. **Thử nghiệm ra lệnh thêm hàng bằng văn bản (Text-based Cart Command)**:
   - *Nhập thử*: `"Thêm vào giỏ 1 hũ"` hoặc `"Cho vào giỏ 1 hũ cà phê gỗ"`
   - *Kết quả*: Chatbot xác nhận thêm thành công, tính toán tổng tiền và **tự động mở Slide-over Cart Drawer** trên màn hình.

---

### Kịch bản 2: Chuỗi Giỏ hàng -> Yêu cầu Mua hàng (Chính sách Ship ưu đãi HSSV)
1. **Kiểm tra tính giá và chính sách ship**:
   - Thêm **1 hũ nến**: Tiền nến = **85.000đ**, Phí ship tiêu chuẩn = **25.000đ**, Tổng = **110.000đ**.
   - Tăng số lượng lên **2 hũ nến**: Tiền nến = **170.000đ**, Phí ship tự động áp dụng ưu đãi toàn quốc = **15.000đ**, Tổng = **185.000đ**.
2. **Kiểm tra biểu mẫu tại `thanh-toan.html`**:
   - Bấm nút **"Gửi Yêu Cầu Mua Hàng"** từ giỏ hàng.
   - Giao diện nhận đúng thông tin mùi hương, số lượng và tổng tiền 185.000đ từ server session.
   - Điền thông tin người nhận: Tên, Số điện thoại (>= 10 số), Địa chỉ cụ thể.
   - Bấm gửi: Hệ thống tạo mã yêu cầu `#REQ-xxxxxx`, thông báo gửi email thành công tới ban quản trị `scentpodcontact@gmail.com`.
   - Cơ chế bảo mật: Server tự động bỏ qua hoàn toàn dữ liệu giá do trình duyệt gửi; kích hoạt khóa chống bấm gửi lặp liên tiếp (In-flight concurrency lock).

---

### Kịch bản 3: Tự động hóa Trắc nghiệm n8n (`trac-nghiem.html`)
- Truy cập mục **"Trắc nghiệm"** trên thanh điều hướng.
- Giao diện tích hợp kết nối tới n8n Cloud Webhook (`https://scentpods.app.n8n.cloud/webhook/tao-cau-hoi`).
- Thầy/Cô có thể bấm nút **"🧪 Chạy thử dữ liệu mẫu (Demo Mock)"** để trải nghiệm ngay bộ 5 câu hỏi trắc nghiệm tương tác, làm bài, chấm điểm và xem giải thích đáp án tự động mà không phụ thuộc vào trạng thái webhook n8n Cloud.

---

## 🏗️ KIẾN TRÚC KỸ THUẬT & MA TRẬN 14 AI SKILLS

```
+-----------------------------------------------------------------------------------+
|                         KIẾN TRÚC TỔNG THỂ DỰ ÁN SCENTPOD                         |
+-----------------------------------------------------------------------------------+
|  [CLIENT LAYER]                                                                   |
|  - HTML5 Semantic / CSS3 Modular / Vanilla JS (ES6+)                              |
|  - ScentPod Chat Widget (Floating UI) & Cart Drawer (Slide-over)                  |
|  - Local Fallback Client Engine (Offline-ready)                                   |
|                                                                                   |
|                                     ^                                             |
|                                     | HTTP REST API / JSON                        |
|                                     v                                             |
|                                                                                   |
|  [SERVER LAYER - Node.js Native HTTP Server]                                      |
|  - Route Dispatcher (/api/chat, /api/cart, /api/purchase-request)                 |
|  - In-flight Concurrency Lock (Set-based mutex, HTTP 429)                         |
|  - Anti-Tampering Order Validator (Client price stripping)                        |
|  - Email Notification Dispatcher (scentpodcontact@gmail.com)                      |
|                                                                                   |
|                                     ^                                             |
|                                     | Single Source of Truth                      |
|                                     v                                             |
|                                                                                   |
|  [AI ENGINE & DATA LAYER]                                                         |
|  - Deterministic Catalog Search Engine (Regex Slot-filling)                       |
|  - Multi-criteria Heuristic Recommendation Engine                                 |
|  - Session Context Memory Store (RAM Map, sessionId)                             |
|  - SSOT Catalog File (data/catalog.json - 4 SKU nến 50g đồng giá 85k)            |
|  - Hybrid LLM Adapter (Ready for OpenAI / Gemini API)                             |
|  - External n8n Cloud Webhook (Quiz generation & auto-grading)                    |
+-----------------------------------------------------------------------------------+
```

### Ma trận 14 AI Skills tích hợp:
| STT | Tên Kỹ năng (AI Skill) | Tệp Mã Nguồn Đối Chiếu | Trạng thái Triển khai |
| :---: | :--- | :--- | :---: |
| **01** | Rule-based Natural Language Processing | `scripts/ai_shopping_assistant.js:55-125` | ✅ Implemented Locally |
| **02** | Hybrid LLM / Local Deterministic Runtime | `scripts/ai_shopping_assistant.js:285-350` | 🔄 Hybrid (Active/API) |
| **03** | Catalog Schema Retrieval & Grounding (SSOT) | `scripts/ai_shopping_assistant.js:20-35` | ✅ Implemented Locally |
| **04** | Multi-criteria Product Recommendation Engine | `scripts/ai_shopping_assistant.js:160-230` | ✅ Implemented Locally |
| **05** | Multi-turn Conversational Context Memory | `scripts/ai_shopping_assistant.js:35-50` | ✅ Implemented Locally |
| **06** | Deterministic Intent-to-Tool Dispatching | `scripts/ai_shopping_assistant.js:295-345` | ✅ Implemented Locally |
| **07** | Structured JSON Component Hydration | `api/chat.js:50-68`, `js/ai-chat.js:220` | ✅ Implemented Locally |
| **08** | Dynamic Cart & Shipping Policy Engine | `scripts/ai_shopping_assistant.js:350-395` | ✅ Implemented Locally |
| **09** | Anti-Tampering Order Validator | `scripts/ai_shopping_assistant.js:540-600` | ✅ Implemented Locally |
| **10** | In-flight Concurrency Lock | `scripts/server.js:280-305` | ✅ Implemented Locally |
| **11** | Automated Email Notification Dispatcher | `scripts/email_service.js:15-120` | ✅ Implemented Locally |
| **12** | n8n Cloud Webhook Quiz Generator & Grade | `trac-nghiem.html:380-490` | 🌐 External / Mock Fallback |
| **13** | Privacy-Preserving GA4 Event Tracking | `js/main.js`, `js/ai-chat.js:110` | ✅ Implemented Locally |
| **14** | Automated Regression QA Test Harness | `scripts/test_ai_shopping_assistant.js` | ✅ Implemented Locally (25 tests) |

---

## 🎯 ỨNG DỤNG AI PROMPT ENGINEERING TRONG DỰ ÁN

Dự án áp dụng 6 kỹ thuật Prompt Engineering tiêu chuẩn:
1. **Role-Based Prompting**: Định danh vai trò chuyên gia Frontend UI/UX và chuyên gia tư vấn mùi hương ScentPod.
2. **Contextual Grounding**: Cung cấp ngữ cảnh sinh viên, không gian bàn học, phòng ngủ và ngân sách hợp lý.
3. **Negative Constraints & Guardrails**: Ràng buộc khép kín chống bịa mùi ngoài danh mục, chống đổi giá niêm yết 85k.
4. **Structured Output Prompting**: Ràng buộc mô hình trả về JSON phân tách lời thoại và mảng thẻ sản phẩm.
5. **Task Decomposition**: Phân rã bài toán tái cấu trúc luồng mua hàng và email thành 6 bước tuần tự.
6. **Iterative Refinement**: Chu trình kiểm thử lặp phát hiện và khắc phục triệt để các ca biên (`90.000đ` vs `90k`, follow-up memory).

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```
ScentPod/
├── README.md                                     # Tài liệu tổng quan & hướng dẫn chấm thi cho Giảng viên
├── package.json                                  # Cấu hình scripts (start, test, agent) và dependencies
├── vercel.json                                   # Cấu hình định tuyến triển khai serverless trên Vercel
├── .gitignore                                    # Loại bỏ các tệp nhạy cảm (.env) và rác hệ thống
├── .env.example                                  # Mẫu biến môi trường (PORT, ADMIN_EMAIL, RESEND, OPENAI)
│
├── bao_cao_ai_prompt_engineering_va_ai_skills_btl.md   # Báo cáo học thuật BTL (Bản Markdown)
├── bao_cao_ai_prompt_engineering_va_ai_skills_btl.html # Báo cáo học thuật BTL (Bản HTML in ấn PDF)
│
├── data/
│   └── catalog.json                              # Single Source of Truth: 4 SKU nến 50g đồng giá 85k
│
├── scripts/
│   ├── server.js                                 # Máy chủ Node.js native phục vụ web, API & khóa concurrency
│   ├── ai_shopping_assistant.js                  # Engine Trợ lý Mua hàng AI, Slot-filling & Cart Operations
│   ├── email_service.js                          # Dịch vụ gửi email thông báo đơn hàng (HTML template)
│   ├── test_ai_shopping_assistant.js             # Test suite 17 ca kiểm thử Trợ lý AI
│   └── test_purchase_request.js                  # Test suite 8 ca kiểm thử Yêu cầu mua hàng & Email
│
├── js/
│   ├── main.js                                   # Logic UI website, mở modal chi tiết & tracking GA4
│   ├── cart.js                                   # Quản lý Slide-over Cart Drawer đồng bộ server session
│   └── ai-chat.js                                # Giao diện Chat Widget nổi & Local Fallback Engine
│
├── css/
│   └── style.css                                 # Hệ thống CSS modular, thiết kế tông ấm & responsive
│
├── images/                                       # Tài nguyên đồ họa, ảnh sản phẩm nến mini chuẩn hóa
├── index.html                                    # Trang chủ thương hiệu
├── san-pham.html                                 # Trang danh mục sản phẩm
├── chi-tiet-san-pham.html                        # Trang chi tiết sản phẩm chuẩn hóa
├── thanh-toan.html                               # Trang gửi Yêu cầu mua hàng tinh gọn
├── trac-nghiem.html                              # Trang trắc nghiệm kiến thức kết nối n8n Webhook
└── ve-chung-toi.html                             # Trang giới thiệu câu chuyện thương hiệu
```

---

## 🛡️ CAM KẾT LIÊM CHÍNH KHOA HỌC & BẢO MẬT

1. **Bảo vệ quyền riêng tư (Privacy & Data Minimization)**: Google Analytics 4 chỉ ghi nhận mã định danh sự kiện (`event_name`) và ID sản phẩm, tuyệt đối không gửi Họ tên, Số điện thoại, Địa chỉ giao hàng hay Ghi chú của khách hàng sang bên thứ ba.
2. **Toàn vẹn dữ liệu giao dịch**: Dữ liệu giá được kiểm soát 100% ở phía máy chủ. Mọi nỗ lực can thiệp giá từ phía client đều bị vô hiệu hóa.
3. **Minh bạch học thuật**: Phân biệt tường minh giữa kỹ thuật Prompt Engineering với thuật toán mã nguồn thông thường, đảm bảo tính xác thực cao nhất trước Hội đồng môn học.

---

*© 2026 Nhóm Dự án ScentPod. Dự án phục vụ mục đích nghiên cứu học thuật và báo cáo môn học đại học.*
