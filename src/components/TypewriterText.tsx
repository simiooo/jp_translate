import { motion, Transition, useAnimation } from "framer-motion";
import { useEffect } from "react";
export interface TypewriterTextProps {
  /**
   * 要显示为打字机效果的文本内容。
   */
  text?: string;
  /**
   * 整个打字机动画开始前的延迟时间 (秒)。
   * @default 0
   */
  delay?: number;
  /**
   * 每个字符动画开始前的延迟时间 (秒)。
   * @default 0.05
   */
  charDelay?: number;
  /**
   * 每个字符动画的持续时间 (秒)。
   * @default 0.1
   */
  duration?: number;
  /**
   * 字符动画开始时的 Y 轴偏移量 (像素)。正值表示从下方出现，负值表示从上方出现。
   * @default 20
   */
  initialY?: number;
  /**
   * 字符动画结束时的 Y 轴位置 (像素)。通常设为 0 表示回到正常位置。
   * @default 0
   */
  finalY?: number;
  /**
   * 字符动画开始时的透明度。0 表示完全透明，1 表示完全不透明。
   * @default 0
   */
  initialOpacity?: number;
  /**
   * 字符动画结束时的透明度。0 表示完全透明，1 表示完全不透明。
   * @default 1
   */
  finalOpacity?: number;
  /**
   * 动画的缓动函数。可以是 Framer Motion 支持的字符串（如 "easeOut", "spring"）
   * 或一个自定义缓动函数数组。
   * @default "easeOut"
   */
  ease?: Transition["ease"]; // Framer Motion 的 Transition["ease"] 类型
  /**
   * 动画是否在组件进入视口时才开始播放。
   * @default false
   */
  startOnView?: boolean;
}
export const TypewriterText = ({ text, delay = 0, charDelay = 0.05, duration = 0.1 }: TypewriterTextProps) => {
  const controls = useAnimation();
  const characters = (text ?? "").split('');

  useEffect(() => {
    const sequence = async () => {
      await new Promise(resolve => setTimeout(resolve, delay * 1000)); // 整个动画的初始延迟
      for (let i = 0; i < characters.length; i++) {
        await controls.start((i) => ({
          opacity: 1,
          y: 0, // 如果你希望有从底部滑入的效果，可以设置为 -20 然后动画到 0
          transition: { duration: duration + i * 0.05 }
        }));
        await new Promise(resolve => setTimeout(resolve, charDelay * 1000)); // 每个字符之间的延迟
      }
    };
    sequence();
  }, [controls, characters, delay, charDelay, duration]);

  // 定义每个字符的初始状态
  const charVariants = {
    hidden: { opacity: 0, y: 2 }, // 初始状态：透明且稍微向下
    visible: { opacity: 1, y: 0 },  // 最终状态：不透明且回到原位
  };

  return (
    <div
    className="inline-flex flex-wrap"
    >
      {characters.map((char, index) => (
        <motion.span
          key={index}
          variants={charVariants}
          initial="hidden"
          animate={controls} // 将 controls 绑定到 animate 属性
          custom={index} // 传递自定义值给 variants，虽然在这个例子中不直接用到，但在更复杂的场景有用
        //   style={{ display: 'inline-block', whiteSpace: 'pre' }} // 保持空格和独立的字符显示
        >
          {char === ' ' ? '\u00A0' : char} {/* 处理空格，使其可见 */}
        </motion.span>
      ))}
    </div>
  );
};