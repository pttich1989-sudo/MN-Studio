export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contentType, projectType, designStyle, keywords, imageLink, imageBase64 } = req.body;

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
    
    // Check if imageLink is an actual URL or just the placeholder text "Đã dán ảnh từ Clipboard!"
    const isUrl = imageLink && imageLink.startsWith('http');

    // Biến đổi prompt từ user input
    const userPrompt = `
Hãy viết một nội dung với các yêu cầu sau:
- Loại nội dung: ${contentType}
- Loại dự án/không gian: ${projectType}
- Phong cách thiết kế: ${designStyle}
- Thông tin thêm/Từ khóa: ${keywords || "Nhấn mạnh vào thiết kế tinh tế và trải nghiệm sống đẳng cấp."}
${isUrl ? `\n[YÊU CẦU ĐÍNH KÈM]: Hãy chèn đường link url ảnh này (${imageLink}) vào vị trí phù hợp nhất trong bài viết bằng cú pháp Markdown (ví dụ: ![Hình ảnh thiết kế](${imageLink})).` : ""}
${imageBase64 ? `\n[YÊU CẦU PHÂN TÍCH ẢNH]: Tôi có đính kèm một bức hình liên quan đến thiết kế nội thất. Hãy quan sát thật kỹ bức hình đó (chú ý vật liệu, tông màu, ánh sáng, đường nét kỹ thuật) và lồng ghép sự miêu tả sinh động, chân thực dựa trên hình ảnh đó vào trong bài viết. Điều này giúp bài content thuyết phục và cá nhân hóa hơn.` : ""}

Hãy đóng vai chuyên gia của PS Interior Design để hoàn thiện bài viết ngay lập tức. Cung cấp kết quả bằng định dạng Markdown. Không cần giải thích thêm.
`;

    // Chuẩn bị payload truyền vào Gemini
    const parts = [{ text: userPrompt }];
    if (imageBase64) {
        // Parse "data:image/jpeg;base64,....."
        const [header, baseData] = imageBase64.split(',');
        const mimeType = header.split(':')[1].split(';')[0];
        parts.push({
            inline_data: {
                mime_type: mimeType,
                data: baseData
            }
        });
    }

    // Gọi Gemini API (Sử dụng model gemini-1.5-pro để có tầm nhìn Vision tốt)
    const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=\${API_KEY}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [{ parts: parts }],
        generationConfig: {
          temperature: 0.7, // Tương đối sáng tạo nhưng vẫn giữ sự nghiêm túc
          maxOutputTokens: 2500,
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
