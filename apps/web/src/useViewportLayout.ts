import { useLayoutEffect, type RefObject } from 'react';

export function useViewportLayout(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const shell = root.current;
    if (!shell) return;
    const measure = () => {
      const children = Array.from(shell.children).filter((node): node is HTMLElement => node instanceof HTMLElement);
      const top = children.filter(node => {
        const style = getComputedStyle(node);
        return style.display !== 'none' && style.position !== 'absolute' && Number(style.order) < 1;
      });
      const bottom = children.filter(node => node.matches('.traffic-legend, .live-actions, .action-help-toggle'));
      const style = getComputedStyle(shell);
      const occupied = [...top, ...bottom].reduce((sum, node) => sum + node.getBoundingClientRect().height, 0);
      const gap = parseFloat(style.rowGap) || 0;
      const height = Math.floor(window.innerHeight - occupied - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - gap * (top.length + bottom.length));
      const value = `${Math.max(260, height)}px`;
      if (shell.style.getPropertyValue('--field-height') !== value) shell.style.setProperty('--field-height', value);
    };
    const observer = new ResizeObserver(measure);
    const observeChildren = () => { observer.disconnect(); observer.observe(shell); for (const node of shell.children) observer.observe(node); measure(); };
    const mutations = new MutationObserver(observeChildren);
    mutations.observe(shell, { childList: true });
    observeChildren(); window.addEventListener('resize', measure);
    return () => { observer.disconnect(); mutations.disconnect(); window.removeEventListener('resize', measure); };
  }, [root]);
}
