import React from 'react';
import { Token } from '../types/jp_ast';
import { Tag } from './Tag';
// import { Checkbox } from './Checkbox';

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
  const baseClasses = "rounded-xl border-1 p-4 cursor-pointer transition-all duration-200 ";
  const selectedClasses = isSelected 
    ? "border-blue-300 bg-blue-50 shadow-2xs text-blue-700 hover:bg-blue-100" 
    : "border-gray-300 bg-gray-50 shadow-sm text-gray-900 hover:bg-gray-100  active:shadow-xs";



  return (
    <div 
      className={`${baseClasses} ${selectedClasses}`}
      onClick={onSelect}
    >
      {/* Header with title and actions */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex-1">
          <h3 className={`text-2xl font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
            {token.word}
          </h3>
          {token.kana && (
            <p className={`text-xs ${isSelected ? 'text-blue-800' : 'text-gray-600'}`}>
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
          <Tag type="inflection" label="変形" value={token.inflection}></Tag>
        </div>}
        
        {token.meaning && (
          <div>
            <p className={`text-xs font-medium ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
              含义： {token.meaning}
            </p>
          </div>
        )}
        
        {token.lemma && (
          <div>
            <p className={`text-xs font-medium ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
              原型： {token.lemma}
            </p>
          </div>
        )}
        
        {token.inflection && (
          <div>
            <p className={`text-sm font-medium ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
              变形：{token.inflection}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordCard;