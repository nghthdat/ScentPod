# TÍCH HỢP SCENTPOD VỚI NVIDIA AI BLUEPRINT: RETAIL SHOPPING ASSISTANT

Tài liệu này hướng dẫn cách kết nối hệ thống ScentPod với repository tham khảo chính thức của NVIDIA:
👉 **[NVIDIA-AI-Blueprints/retail-shopping-assistant](https://github.com/NVIDIA-AI-Blueprints/retail-shopping-assistant)**

---

## 1. Kiến Trúc Phân Tách Dịch Vụ (Separation of Concerns)

Theo đúng thiết kế của NVIDIA Blueprint, dịch vụ AI được duy trì độc lập hoàn toàn với Frontend ScentPod:

```
+-------------------------------------------------------------------------+
|                          SCENTPOD STOREFRONT                            |
|      (Vanilla HTML5/CSS3/ES6 + Cart Drawer + Floating AI Chat Widget)    |
|                          Cổng mặc định: 3000                            |
+-------------------------------------------------------------------------+
                                    |
          Gọi API qua Backend Proxy (/api/chat, /api/cart, /api/products)
          (Bảo mật 100%: API Key không bao giờ lộ ra trình duyệt)
                                    |
                                    v
+-------------------------------------------------------------------------+
|                  SCENTPOD NODE.JS BACKEND / ORCHESTRATOR                |
|           (scripts/server.js + scripts/ai_shopping_assistant.js)        |
| - Rate Limiter: 30 req/min/IP                                           |
| - Deterministic Code Validator: Kiểm tra product_id, giá, tồn kho      |
| - Quản lý Session ID & Giỏ hàng phiên                                   |
+-------------------------------------------------------------------------+
                                    |
                                    +-------------------------------------+
                                    |                                     |
               (Chế độ NVIDIA Blueprint)                     (Chế độ Offline/Local Engine)
                                    |                                     |
                                    v                                     v
+---------------------------------------------+             +-----------------------------+
|    NVIDIA RETAIL SHOPPING ASSISTANT STACK   |             | BỘ MÁY SUY LUẬN DETERMINISTIC|
| - Orchestrator (LangGraph Chain): Port 8009 |             |   NỘI BỘ (KHÔNG CẦN GPU/KEY)|
| - Catalog Retriever: Port 8010              |             | Tự động trích xuất ý định,  |
| - Memory Retriever (Carts): Port 8011       |             | tìm kiếm theo ngân sách,    |
| - Milvus Vector Database: Port 19530        |             | nhóm hương, không gian và   |
| - NVIDIA NIM Microservice (Llama-3.1-70B)   |             | gắn thẻ sản phẩm đối chiếu. |
+---------------------------------------------+             +-----------------------------+
```

---

## 2. Chuẩn Hóa Dữ Liệu Catalog Theo NVIDIA Schema

NVIDIA Catalog Retriever đọc dữ liệu từ hai tệp sidecar:
1. `data/enriched_products.jsonl`: Mỗi dòng là một bản ghi JSON đại diện cho 1 sản phẩm.
2. `data/enriched_products.schema.yaml`: Tệp định nghĩa kiểu dữ liệu, các trường cho phép `filterable` và `searchable`.

### Bộ dữ liệu ScentPod đã được tạo sẵn tại:
- `nvidia-blueprint/data/enriched_products.jsonl`
- `nvidia-blueprint/data/enriched_products.schema.yaml`

#### Cấu trúc 4 sản phẩm nến 50g ScentPod:
```jsonl
{"product_id": "first-class", "title": "Another Sunday (First Class)", "category": "Candles", "subcategory": "Scented Candle 50g", "price": 85000, "currency": "VND", "availability": "in_stock", "inventory_count": 25, "scent_notes": "Chanh, đào & bạc hà", "intensity": "medium_light", "recommended_space": "Bàn học, phòng làm việc nhỏ", "description": "Hương chanh vàng thanh chua tươi mát, đào chín ngọt dịu và lá bạc hà mát lạnh, khơi dậy năng lượng học tập.", "image_url": "images/sap-thom-bo-ba.jpg"}
{"product_id": "blind-date", "title": "Beloved Summer (Blind Date)", "category": "Candles", "subcategory": "Scented Candle 50g", "price": 85000, "currency": "VND", "availability": "in_stock", "inventory_count": 18, "scent_notes": "Xạ hương & hoa hồng", "intensity": "medium", "recommended_space": "Phòng ngủ, góc thư giãn", "description": "Hương hoa hồng tháng Năm ngọt ngào, e ấp hòa cùng nét ấm nồng bí ẩn của xạ hương và vani sữa bồng bềnh.", "image_url": "images/nen-thom-mini.jpg"}
{"product_id": "campus-breeze", "title": "Tidal Bloom (Campus Breeze)", "category": "Candles", "subcategory": "Scented Candle 50g", "price": 85000, "currency": "VND", "availability": "in_stock", "inventory_count": 20, "scent_notes": "Xô thơm, muối biển & lily", "intensity": "light", "recommended_space": "Phòng khách, bàn học, không gian mở", "description": "Làn gió biển mặn mòi, khoáng đạt cộng hưởng cùng thảo mộc xô thơm và hoa lily tinh khôi mang lại cảm giác tự do.", "image_url": "images/campus-breeze.jpg"}
{"product_id": "late-night", "title": "Coffee Holic (Late Night)", "category": "Candles", "subcategory": "Scented Candle 50g", "price": 85000, "currency": "VND", "availability": "in_stock", "inventory_count": 15, "scent_notes": "Cà phê & gỗ", "intensity": "strong", "recommended_space": "Góc học bài ban đêm, phòng đọc sách", "description": "Hương cà phê rang mộc nồng ấm quyện vào lớp gỗ tuyết tùng trầm lắng, vỗ về tâm trí sau những giờ học bài muộn.", "image_url": "images/nen-thu-gian.jpg"}
```

---

## 3. Các API Endpoints & Cổng Của NVIDIA Blueprint

| Dịch vụ | Cổng | Endpoint | Chức năng |
|---|---|---|---|
| **Catalog Retriever** | `8010` | `GET /capabilities` | Trả về metadata của catalog (số sản phẩm, danh mục, khoảng giá, bộ lọc) |
| **Catalog Retriever** | `8010` | `POST /query/text` | Tìm kiếm ngữ nghĩa qua embedding Milvus + bộ lọc thuộc tính |
| **Catalog Retriever** | `8010` | `GET /products/{id}` | Lấy chi tiết thuộc tính chính xác của sản phẩm |
| **Agent Orchestrator** | `8009` | `POST /chat` | Tiếp nhận tin nhắn hội thoại, phân tích intent và điều phối công cụ |
| **Memory Retriever** | `8011` | `GET/POST /cart` | Lưu trữ giỏ hàng và bối cảnh hội thoại theo phiên (local memory) |

---

## 4. Định Dạng Request & Response Chuẩn

### A. Gọi tư vấn qua Backend ScentPod (`POST /api/chat`):
**Request:**
```json
{
  "sessionId": "sess_1731862900_abc123",
  "message": "Mình muốn tìm nến thơm để bàn học tập trung ôn thi, ngân sách tầm 100k",
  "history": []
}
```

**Response (được Code Validator rà soát 100%):**
```json
{
  "success": true,
  "sessionId": "sess_1731862900_abc123",
  "reply": "Dựa trên sở thích của bạn, mình gợi ý hũ nến **Another Sunday (First Class)** (Chanh, đào & bạc hà). Vừa vặn ngân sách 100.000đ (chỉ 85.000đ). Đúng nhóm hương yêu thích: Chanh, đào & bạc hà. Rất phù hợp cho không gian bàn học...",
  "suggestedProducts": [
    {
      "id": "first-class",
      "name": "Another Sunday (First Class)",
      "code": "Mùi 01",
      "labelNotes": "Chanh, đào & bạc hà",
      "price": 85000,
      "priceFormatted": "85.000đ",
      "priceBadge": "Giá ưu đãi HSSV",
      "stock": 25,
      "inStock": true,
      "image": "images/sap-thom-bo-ba.jpg",
      "suggestReason": "Vừa vặn ngân sách 100.000đ (chỉ 85.000đ). Rất phù hợp cho không gian bàn học."
    }
  ]
}
```

---

## 5. Cấu Hình Biến Môi Trường (`.env`)

Sao chép `.env.example` thành `.env`:
```bash
cp .env.example .env
```

Để chạy với NVIDIA NIM API:
```env
AI_PROVIDER=nvidia
NVIDIA_API_ENDPOINT=https://integrate.api.nvidia.com/v1/chat/completions
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NVIDIA_MODEL_NAME=meta/llama-3.1-70b-instruct
```

Nếu chạy ở môi trường nội bộ/offline không có GPU hoặc API Key:
```env
AI_PROVIDER=local
```
*(Hệ thống tự động kích hoạt bộ máy Deterministic Advisor, phản hồi dưới 10ms, kiểm tra ngân sách, độ đậm mùi và không gian sử dụng tuyệt đối chính xác).*

