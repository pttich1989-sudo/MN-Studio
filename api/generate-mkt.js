export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contentType, projectType, designStyle, keywords, imageLink } = req.body;

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: 'Thiếu GEMINI_API_KEY trong cấu hình server.' });
    }

    // System Prompt được "huấn luyện" theo brand guidelines của PS Interior Design
    const systemInstruction = `
Bạn là một chuyên gia Copywriter hạng A, làm việc cho thương hiệu "PS Interior Design" (Website: noithatps.vn).
Chuyên môn của bạn là viết nội dung Marketing cho dịch vụ thiết kế và thi công nội thất cao cấp.
Tệp khách hàng: Giới thượng lưu, người có thu nhập rất cao, chủ sở hữu các bất động sản sang trọng (Diamond Centery, The Beverly Vinhomes, Eaton Park, Villa, Penthouse...).
Giọng văn bắt buộc:
1. Sang trọng, tinh tế, đĩnh đạc và mang tính chuyên gia.
2. Tuyệt đối không dùng phong cách chèo kéo sales rẻ tiền hay ngôn từ sáo rỗng. Hãy bán "giá trị nghệ thuật sống", "sự cân bằng", "độc bản", và "đẳng cấp".
3. Tôn trọng yếu tố phong thủy (ví dụ: đón ánh sáng tự nhiên, vượng khí) nếu phù hợp.
4. Trình bày rõ ràng, phân đoạn chuẩn Markdown, sử dụng ký tự đặc biệt (bullet points) một cách tinh tế.
`;

    // Biến đổi prompt từ user input
    const userPrompt = `
Hãy viết một nội dung với các yêu cầu sau:
- Loại nội dung: ${contentType}
- Loại dự án/không gian: ${projectType}
- Phong cách thiết kế: ${designStyle}
- Thông tin thêm/Từ khóa: ${keywords || "Nhấn mạnh vào thiết kế tinh tế và trải nghiệm sống đẳng cấp."}
${imageLink ? `\n[YÊU CẦU QUAN TRỌNG]: Hãy chèn đường link hình ảnh này (${imageLink}) vào vị trí phù hợp nhất trong bài viết bằng cú pháp Markdown (ví dụ: ![Hình ảnh minh họa](${imageLink})).` : ""}

Hãy đóng vai chuyên gia của PS Interior Design để hoàn thiện bài viết ngay lập tức. Cung cấp kết quả bằng định dạng Markdown (để hiển thị đẹp trên HTML). Không cần giải thích thêm.
`;

    // Gọi Gemini API (Sử dụng model gemini-1.5-flash do tốc độ nhanh, giá rẻ, văn phong xuất sắc)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [{
          parts: [{ text: userPrompt }]
        }],
        generationConfig: {
          temperature: 0.7, // Tương đối sáng tạo nhưng vẫn giữ sự nghiêm túc
          maxOutputTokens: 1500,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Gemini Error:", data);
        return res.status(response.status).json({ error: data.error?.message || 'Lỗi từ Gemini API' });
    }

    // Parse nội dung từ JSON trả về của Gemini
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
        return res.status(500).json({ error: 'Không nhận được nội dung hợp lệ từ AI.' });
    }

    return res.status(200).json({ content: textContent });

  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
