import { FC } from 'react';
import type { Question } from '../../types';
import { isABCDQuestion } from '../../types';
import { useTranslation } from '../../i18n';

interface QuestionCardProps {
  question: Question;
  questionNumber?: number;
  totalQuestions?: number;
  showAnswer?: boolean;
  className?: string;
}

export const QuestionCard: FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  showAnswer = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const isOX = question.type === 'ox';
  const options = isOX
    ? [
        { key: 'O', label: t('questionCard.oYes'), color: 'bg-game-green' },
        { key: 'X', label: t('questionCard.xNo'), color: 'bg-game-red' },
      ]
    : isABCDQuestion(question)
    ? [
        { key: 'A', label: question.選項A, color: 'bg-game-red' },
        { key: 'B', label: question.選項B, color: 'bg-game-blue' },
        { key: 'C', label: question.選項C, color: 'bg-game-yellow' },
        { key: 'D', label: question.選項D, color: 'bg-game-green' },
      ]
    : [];

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
      {/* 題目標頭 */}
      <div className="bg-primary/10 px-6 py-4 flex justify-between items-center">
        {questionNumber && totalQuestions && (
          <span className="text-sm font-bold text-primary uppercase tracking-wider">
            {t('questionCard.questionNumber', { current: questionNumber, total: totalQuestions })}
          </span>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
            {isOX ? t('questionCard.trueFalse') : t('questionCard.multipleChoice')}
          </span>
          <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
            {t('common.scorePts', { score: question.分數 })}
          </span>
        </div>
      </div>

      {/* 題目內容 */}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-text-primary mb-6 leading-relaxed">
          {question.題目}
        </h2>

        {/* 選項 */}
        <div className={`grid gap-3 ${isOX ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {options.map((option) => (
            <div
              key={option.key}
              className={`
                relative p-4 rounded-xl border-2 transition-all
                ${showAnswer && question.正確答案 === option.key
                  ? 'border-game-green bg-game-green/10'
                  : 'border-gray-200 hover:border-primary/30'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-lg text-white font-bold text-sm
                    ${option.color}
                  `}
                >
                  {option.key}
                </span>
                <span className="text-text-primary font-medium flex-1 pt-1">
                  {option.label}
                </span>
                {showAnswer && question.正確答案 === option.key && (
                  <span className="material-symbols-outlined text-game-green filled">
                    check_circle
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
