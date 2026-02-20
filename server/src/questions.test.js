import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadQuestions, validateQuestion, getQuestionType } from './questions.js';

describe('questions module', () => {
  // ─── validateQuestion ─────────────────────────────────────

  describe('validateQuestion', () => {
    it('should accept valid O/X question', () => {
      const q = { 題目: '1+1=2?', 倒數時間: '10', 正確答案: 'O', 分數: '50' };
      expect(validateQuestion(q)).toBe(true);
    });

    it('should accept valid X answer', () => {
      const q = { 題目: '地球是平的?', 倒數時間: '10', 正確答案: 'X', 分數: '50' };
      expect(validateQuestion(q)).toBe(true);
    });

    it('should accept valid ABCD question with options', () => {
      const q = {
        題目: '最喜歡的食物?',
        選項A: '牛排',
        選項B: '壽司',
        選項C: '披薩',
        選項D: '義大利麵',
        倒數時間: '30',
        正確答案: 'A',
        分數: '100',
      };
      expect(validateQuestion(q)).toBe(true);
    });

    it('should accept ABCD with only A and B options', () => {
      const q = {
        題目: '問題?',
        選項A: '選A',
        選項B: '選B',
        倒數時間: '20',
        正確答案: 'B',
        分數: '100',
      };
      expect(validateQuestion(q)).toBe(true);
    });

    it('should reject ABCD without 選項A', () => {
      const q = {
        題目: '問題?',
        選項B: '選B',
        倒數時間: '20',
        正確答案: 'A',
        分數: '100',
      };
      expect(validateQuestion(q)).toBe(false);
    });

    it('should reject ABCD without 選項B', () => {
      const q = {
        題目: '問題?',
        選項A: '選A',
        倒數時間: '20',
        正確答案: 'B',
        分數: '100',
      };
      expect(validateQuestion(q)).toBe(false);
    });

    it('should reject question without 題目', () => {
      const q = { 倒數時間: '10', 正確答案: 'O', 分數: '50' };
      expect(validateQuestion(q)).toBe(false);
    });

    it('should reject question without 倒數時間', () => {
      const q = { 題目: 'Q?', 正確答案: 'O', 分數: '50' };
      expect(validateQuestion(q)).toBe(false);
    });

    it('should reject question without 正確答案', () => {
      const q = { 題目: 'Q?', 倒數時間: '10', 分數: '50' };
      expect(validateQuestion(q)).toBe(false);
    });

    it('should reject question without 分數', () => {
      const q = { 題目: 'Q?', 倒數時間: '10', 正確答案: 'O' };
      expect(validateQuestion(q)).toBe(false);
    });

    it('should reject non-numeric 倒數時間', () => {
      const q = { 題目: 'Q?', 倒數時間: 'abc', 正確答案: 'O', 分數: '50' };
      expect(validateQuestion(q)).toBe(false);
    });

    it('should reject non-numeric 分數', () => {
      const q = { 題目: 'Q?', 倒數時間: '10', 正確答案: 'O', 分數: 'abc' };
      expect(validateQuestion(q)).toBe(false);
    });

    it('should reject invalid answer letter', () => {
      const q = { 題目: 'Q?', 倒數時間: '10', 正確答案: 'E', 分數: '50' };
      expect(validateQuestion(q)).toBe(false);
    });

    it('should handle lowercase answer by rejecting (needs uppercase)', () => {
      // validateQuestion trims and uppercases, so 'o' becomes 'O'
      const q = { 題目: 'Q?', 倒數時間: '10', 正確答案: 'o', 分數: '50' };
      expect(validateQuestion(q)).toBe(true);
    });

    it('should handle whitespace in answer', () => {
      const q = { 題目: 'Q?', 倒數時間: '10', 正確答案: ' O ', 分數: '50' };
      expect(validateQuestion(q)).toBe(true);
    });
  });

  // ─── getQuestionType ──────────────────────────────────────

  describe('getQuestionType', () => {
    it('should return "ox" for O answer', () => {
      expect(getQuestionType({ 正確答案: 'O' })).toBe('ox');
    });

    it('should return "ox" for X answer', () => {
      expect(getQuestionType({ 正確答案: 'X' })).toBe('ox');
    });

    it('should return "abcd" for A answer', () => {
      expect(getQuestionType({ 正確答案: 'A' })).toBe('abcd');
    });

    it('should return "abcd" for B answer', () => {
      expect(getQuestionType({ 正確答案: 'B' })).toBe('abcd');
    });

    it('should return "abcd" for C answer', () => {
      expect(getQuestionType({ 正確答案: 'C' })).toBe('abcd');
    });

    it('should return "abcd" for D answer', () => {
      expect(getQuestionType({ 正確答案: 'D' })).toBe('abcd');
    });

    it('should handle lowercase by returning correct type', () => {
      expect(getQuestionType({ 正確答案: 'o' })).toBe('ox');
      expect(getQuestionType({ 正確答案: 'a' })).toBe('abcd');
    });

    it('should handle whitespace around answer', () => {
      expect(getQuestionType({ 正確答案: ' O ' })).toBe('ox');
    });
  });

  // ─── loadQuestions ────────────────────────────────────────

  describe('loadQuestions', () => {
    it('should load questions from CSV file', async () => {
      const questions = await loadQuestions();

      expect(questions).toBeInstanceOf(Array);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should parse OX questions correctly', async () => {
      const questions = await loadQuestions();
      const oxQuestion = questions.find((q) => q.type === 'ox');

      expect(oxQuestion).toBeDefined();
      expect(oxQuestion.題目).toBeTypeOf('string');
      expect(oxQuestion.倒數時間).toBeTypeOf('number');
      expect(['O', 'X']).toContain(oxQuestion.正確答案);
      expect(oxQuestion.分數).toBeTypeOf('number');
      expect(oxQuestion).not.toHaveProperty('選項A');
    });

    it('should parse ABCD questions correctly', async () => {
      const questions = await loadQuestions();
      const abcdQuestion = questions.find((q) => q.type === 'abcd');

      expect(abcdQuestion).toBeDefined();
      expect(abcdQuestion.題目).toBeTypeOf('string');
      expect(abcdQuestion.選項A).toBeTypeOf('string');
      expect(abcdQuestion.選項B).toBeTypeOf('string');
      expect(abcdQuestion.選項C).toBeTypeOf('string');
      expect(abcdQuestion.選項D).toBeTypeOf('string');
      expect(abcdQuestion.倒數時間).toBeTypeOf('number');
      expect(['A', 'B', 'C', 'D']).toContain(abcdQuestion.正確答案);
      expect(abcdQuestion.分數).toBeTypeOf('number');
    });

    it('should load 10 questions from the sample CSV', async () => {
      const questions = await loadQuestions();
      expect(questions).toHaveLength(10);
    });

    it('should have both OX and ABCD types', async () => {
      const questions = await loadQuestions();
      const types = new Set(questions.map((q) => q.type));

      expect(types.has('ox')).toBe(true);
      expect(types.has('abcd')).toBe(true);
    });
  });
});
