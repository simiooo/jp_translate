import React from 'react';
import { Token } from '../types/jp_ast';
import { Tag } from './Tag';
// import { Checkbox } from './Checkbox';
import { useTranslation } from 'react-i18next';

interface WordCardProps {
  token: Token;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const WordCard: React.FC<WordCardProps> = ({
  token,
  isSelected = false,
  onSelect,
}) => {
  const { t } = useTranslation();
  const baseClasses = "rounded-xl border-1 p-4 cursor-pointer transition-all duration-200 ";
  const selectedClasses = isSelected 
    ? "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900 shadow-2xs text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800" 
    : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 shadow-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 active:shadow-xs";



  return (
    <div 
      className={`${baseClasses} ${selectedClasses}`}
      onClick={onSelect}
    >
      {/* Header with title and actions */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex-1">
          <h3 className={`text-2xl font-semibold ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
            {token.word}
          </h3>
          {token.kana && (
            <p className={`text-xs ${isSelected ? 'text-blue-800 dark:text-blue-200' : 'text-gray-600 dark:text-gray-400'}`}>
              {token.kana}
            </p>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 ml-4">
           {/* <Checkbox></Checkbox> */}
        </div>
      </div>

      {/* Content area */}
      <div className="space-y-2">
        {token.inflection && <div className="flex items-center gap-2">
          <Tag type="inflection" label={t('Conjugation')} value={token.inflection}></Tag>
        </div>}
        
        {token.meaning && (
          <div>
            <p className={`text-xs font-medium ${isSelected ? 'text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300'}`}>
              {t('Meaning')}: {token.meaning}
            </p>
          </div>
        )}
        
        {token.lemma && (
          <div>
            <p className={`text-xs font-medium ${isSelected ? 'text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300'}`}>
              {t('Original form')}: {token.lemma}
            </p>
          </div>
        )}
        
        {token.inflection && (
          <div>
            <p className={`text-sm font-medium ${isSelected ? 'text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300'}`}>
              {t('Conjugation')}: {token.inflection}
            </p>
          </div>
        )}
        
    
      </div>
    </div>
  );
};

export default WordCard;
