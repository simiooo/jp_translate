import React from 'react';

export default function FontScaleDemo() {
  return (
    <div className="p-6 bg-card rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">字体缩放演示</h2>
      <p className="text-base mb-2">基础文本大小 - 在普通屏幕上正常，在大屏幕上放大</p>
      <p className="text-lg mb-2">较大文本 - 在大屏幕上会变得更大</p>
      <p className="text-xl mb-4">大文本 - 适合标题和重要内容</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-muted rounded">
          <h3 className="text-lg font-semibold mb-2">普通屏幕</h3>
          <p className="text-sm">字体大小保持正常</p>
        </div>
        <div className="p-4 bg-primary text-primary-foreground rounded">
          <h3 className="text-lg font-semibold mb-2">大屏幕 (1920px+)</h3>
          <p className="text-sm">字体自动放大 12.5%</p>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-secondary rounded">
        <h4 className="text-lg font-medium mb-2">响应式字体类示例:</h4>
        <p className="text-base 3xl:text-lg">
          这个文本在普通屏幕上是 base 大小，在大屏幕上会变成 lg 大小
        </p>
      </div>
    </div>
  );
}