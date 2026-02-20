import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateQuestion(question) {
  if (!question.題目 || !question.倒數時間 || !question.正確答案 || !question.分數) {
    return false;
  }

  if (isNaN(parseInt(question.倒數時間)) || isNaN(parseInt(question.分數))) {
    return false;
  }

  const answer = question.正確答案.trim().toUpperCase();

  if (/^[OX]$/.test(answer)) {
    return true;
  }

  if (/^[ABCD]$/.test(answer)) {
    return !!(question.選項A && question.選項B);
  }

  return false;
}

function getQuestionType(question) {
  const answer = question.正確答案.trim().toUpperCase();
  return /^[OX]$/.test(answer) ? 'ox' : 'abcd';
}

async function loadQuestions() {
  return new Promise((resolve, reject) => {
    const results = [];
    const csvPath = path.join(__dirname, '..', 'data', 'questions.csv');

    if (!fs.existsSync(csvPath)) {
      reject(new Error('Questions file not found'));
      return;
    }

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => {
        if (validateQuestion(data)) {
          const questionType = getQuestionType(data);
          const question = {
            type: questionType,
            題目: data.題目.trim(),
            倒數時間: parseInt(data.倒數時間),
            正確答案: data.正確答案.trim().toUpperCase(),
            分數: parseInt(data.分數)
          };

          if (questionType === 'abcd') {
            question.選項A = data.選項A?.trim() || '';
            question.選項B = data.選項B?.trim() || '';
            question.選項C = data.選項C?.trim() || '';
            question.選項D = data.選項D?.trim() || '';
          }

          results.push(question);
        } else {
          console.warn('Invalid question data:', data);
        }
      })
      .on('end', () => {
        console.log(`Loaded ${results.length} questions from CSV`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
}

export { loadQuestions, validateQuestion, getQuestionType };
