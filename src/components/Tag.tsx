
interface TagProps {
  label: string;
  type: 'pos' | 'lemma' | 'inflection'| "meaning" | "kana";
  value?: string;
}

const TAG_STYLES = {
  pos: 'bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-500 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700',
  lemma: 'bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700',
  inflection: 'bg-purple-100 text-purple-800 hover:bg-purple-200 focus:ring-purple-500 dark:bg-purple-800 dark:text-purple-100 dark:hover:bg-purple-700',
  meaning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-500 dark:bg-yellow-800 dark:text-yellow-100 dark:hover:bg-yellow-700',
  kana: 'bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700'
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
      
      {/* <TypewriterText text={value ? `${label}: ${value}` : label}
      ></TypewriterText> */}
      {value ? `${label}: ${value}` : label}
    </span>
  );
};
