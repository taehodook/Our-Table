export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { imageBase64 } = req.body;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

  // 1. Vercel 환경변수에 API 키가 잘 들어왔는지 체크
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Vercel 설정에 API 키가 없습니다. 환경변수와 재배포를 확인해주세요.' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
    
    // 2. 구글 AI가 에러를 뱉었는지 확인하고 그 이유를 화면에 띄움!
    if (!response.ok || data.error) {
      const geminiError = data.error ? data.error.message : response.statusText;
      return res.status(500).json({ error: `구글 AI 거절 사유 ➡️ ${geminiError}` });
    }

    const textResult = data.candidates[0].content.parts[0].text;
    const cleanedText = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.status(200).json(JSON.parse(cleanedText));
  } catch (error) {
    // 3. 코드 내부에서 터진 진짜 에러 확인
    res.status(500).json({ error: `서버 코드 에러 ➡️ ${error.message}` });
  }
}