import { motion } from "framer-motion";
import { Textarea } from "./ui/textarea";

interface TextHighlightMaskProps {
  text: string;
  position: { s: number; e: number } | null;
}

const TextHighlightMask = ({
  text,
  position,
}: TextHighlightMaskProps) => {
  if (!text || !position) return null;

  // 获取指定位置的字符
  const highlightedText = text.substring(position.s, position.e);

  // 计算前面的文本
  const beforeText = text.substring(0, position.s);

  // 计算后面的文本
  const afterText = text.substring(position.e);

  return (
    <div className="w-full h-full p-0">
      <div className="w-full h-full bg-transparent">
        {/* 使用绝对定位来覆盖textarea */}
        <div className="absolute inset-0 py-2 px-3 pointer-events-none">
          {/* 隐藏的textarea用于测量尺寸 */}
          <Textarea
            readOnly
            value={text}
            className="absolute inset-0 bg-transparent opacity-0 whitespace-pre-wrap break-words resize-none pointer-events-none h-60 text-base 2xl:text-lg"
            style={{
              fontFamily: "inherit",
              fontSize: "inherit",
              lineHeight: "inherit",
              width: "100%",
              height: "100%",
            }}
          />

          {/* 高亮遮罩 */}
          <div className="relative w-full h-full text-base 2xl:text-lg">
            <div className="absolute inset-0 p-0 whitespace-pre-wrap break-words leading-normal">
              {/* 前面的文本 */}
              <span className="text-transparent inset-0 p-0 text-base 2xl:text-lg">
                {beforeText}
              </span>

              {/* 高亮部分 */}
              <motion.span
                className="bg-red-100 text-red-800 text-base 2xl:text-lg border-none bg-opacity-50 rounded px-0 py-0 inline-block align-baseline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {highlightedText}
              </motion.span>

              {/* 后面的文本 */}
              <span className="text-transparent inset-0 p-0 text-base 2xl:text-lg">
                {afterText}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextHighlightMask;