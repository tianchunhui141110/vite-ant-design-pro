import React, { useEffect } from 'react';

/**
 * 轻量 Helmet，替代 umi 的 Helmet（底层为 react-helmet-async）。
 * 目前仅支持 <title> 元素。
 */
export function Helmet({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    const titleElement = React.Children.toArray(children).find(
      (child): child is React.ReactElement =>
        React.isValidElement(child) && child.type === 'title',
    );
    if (titleElement) {
      const title = React.Children.toArray(
        (titleElement.props as { children?: React.ReactNode }).children,
      ).join('');
      if (title) {
        document.title = title;
      }
    }
  }, [children]);

  return null;
}

export default Helmet;
