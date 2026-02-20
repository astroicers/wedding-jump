// 題目類型定義

// O/X 二選一題目
export interface OXQuestion {
  type: 'ox';
  題目: string;
  倒數時間: number;
  正確答案: 'O' | 'X';
  分數: number;
}

// A/B/C/D 四選一題目
export interface ABCDQuestion {
  type: 'abcd';
  題目: string;
  選項A: string;
  選項B: string;
  選項C: string;
  選項D: string;
  倒數時間: number;
  正確答案: 'A' | 'B' | 'C' | 'D';
  分數: number;
}

// 統一題目類型
export type Question = OXQuestion | ABCDQuestion;

// 判斷題目類型
export function isOXQuestion(question: Question): question is OXQuestion {
  return question.type === 'ox' || !('選項A' in question);
}

export function isABCDQuestion(question: Question): question is ABCDQuestion {
  return question.type === 'abcd' || '選項A' in question;
}

// API 回應格式
export interface QuestionsResponse {
  success: boolean;
  data: Question[];
  cached: boolean;
  timestamp: number;
}
