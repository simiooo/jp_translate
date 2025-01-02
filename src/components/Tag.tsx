interface TagProps {
  label: string;
  type: 'pos' | 'lemma' | 'inflection';
  value?: string;
}

const TAG_STYLES = {
  pos: 'bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-500',
  lemma: 'bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500',
  inflection: 'bg-purple-100 text-purple-800 hover:bg-purple-200 focus:ring-purple-500'
};

export const Tag = ({ label, type, value }: TagProps) => {
  return (
    <span 
      className={`
        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-1
        cursor-default
        ${TAG_STYLES[type]}
      `}
      tabIndex={0}
    >
      {value ? `${label}: ${value}` : label}
    </span>
  );
}; 