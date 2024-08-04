import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import MarkdownIt from 'markdown-it';
import './style.css';

const API_KEY = '자신의 API를 적어주세요.';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ],
});

const form = document.querySelector('#diary-form');
const diaryEntry = document.querySelector('#diary-entry');
const diaryDate = document.querySelector('#diary-date');
const output = document.querySelector('.output');
const savedDiary = document.querySelector('#saved-diary');
const calendar = document.querySelector('#calendar');

const md = new MarkdownIt();

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
  diaryDate.valueAsDate = new Date();
});

// 폼 제출 처리
form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = '당신의 마음을 읽고 있습니다...';

  try {
    const prompt = `다음은 한 사람의 일기입니다. 이 사람의 감정을 이해하고, 공감하며, 따뜻한 위로의 말을 해주세요. 
    단, 직접적인 조언은 하지 말고, 그저 이해받고 있다는 느낌을 주는 것에 집중해주세요.
    
    일기 내용: ${diaryEntry.value}`;

    const result = await model.generateContentStream({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });

    let buffer = [];
    for await (const response of result.stream) {
      buffer.push(response.text());
      output.innerHTML = md.render(buffer.join(''));
    }

    // 일기 저장
    saveDiary(diaryDate.value, diaryEntry.value, buffer.join(''));
    renderCalendar();
  } catch (e) {
    output.innerHTML = `오류가 발생했습니다: ${e.message}`;
  }
};

// 일기 저장 함수
function saveDiary(date, entry, response) {
  let diaries = JSON.parse(localStorage.getItem('diaries')) || {};
  diaries[date] = { entry, response };
  localStorage.setItem('diaries', JSON.stringify(diaries));
}

// 달력 렌더링 함수
function renderCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  let html = `<h2>${year}년 ${month + 1}월</h2>`;
  html += '<div class="calendar-days">';
  
  for (let i = 0; i < firstDay.getDay(); i++) {
    html += '<span class="calendar-day"></span>';
  }
  
  const diaries = JSON.parse(localStorage.getItem('diaries')) || {};
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const hasEntry = diaries[date] ? 'has-entry' : '';
    html += `<span class="calendar-day ${hasEntry}" data-date="${date}">${i}</span>`;
  }
  
  html += '</div>';
  calendar.innerHTML = html;
  
  // 달력 날짜 클릭 이벤트 추가
  document.querySelectorAll('.calendar-day[data-date]').forEach(day => {
    day.addEventListener('click', () => showDiary(day.dataset.date));
  });
}

// 저장된 일기 표시 함수
function showDiary(date) {
  const diaries = JSON.parse(localStorage.getItem('diaries')) || {};
  const diary = diaries[date];
  
  if (diary) {
    savedDiary.innerHTML = `
      <h2>${date} 의 일기</h2>
      <p><strong>내용:</strong> ${diary.entry}</p>
      <p><strong>위로의 말:</strong></p>
      ${md.render(diary.response)}
    `;
  } else {
    savedDiary.innerHTML = `<p>${date}에 작성된 일기가 없습니다.</p>`;
  }
}