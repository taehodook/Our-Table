// 파일 경로: api/ocr.js
export default async function handler(req, res) {
  // POST 요청만 받음
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { imageBase64 } = req.body;
  // Vercel 환경변수에서 API 키를 가져옵니다.
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Gemini에게 내릴 명령
  const payload = {
    contents: [{
      parts: [
        { text: "이 영수증 이미지에서 품목과 가격만 추출해서 JSON 배열 형태로 반환해줘. 포맷: [{\"name\": \"품목명\", \"price\": 1000}]. 마크다운 기호 없이 순수한 JSON 텍스트만 줘." },
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
      ]
    }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    const textResult = data.candidates[0].content.parts[0].text;
    
    // 혹시 모를 마크다운(```json 등) 찌꺼기 제거
    const cleanedText = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // JSON으로 변환해서 프론트엔드로 전달
    res.status(200).json(JSON.parse(cleanedText));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '영수증 분석 중 오류가 발생했습니다.' });
  }
}