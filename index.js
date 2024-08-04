const functions = require('firebase-functions');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = '자신의 API를 입력하세요.';
const genAI = new GoogleGenerativeAI(API_KEY);

exports.getAIResponse = functions.https.onCall(async (data, context) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = `다음은 한 사람의 일기입니다. 이 사람의 감정을 이해하고, 공감하며, 따뜻한 위로의 말을 해주세요. 
  단, 직접적인 조언은 하지 말고, 그저 이해받고 있다는 느낌을 주는 것에 집중해주세요.
  
  일기 내용: ${data.diaryEntry}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return { response };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new functions.https.HttpsError('internal', 'AI 응답을 생성하는 데 실패했습니다.');
  }
});