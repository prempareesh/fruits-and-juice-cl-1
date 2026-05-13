'use client';

import { useEffect } from 'react';

export default function HideDevTools() {
  useEffect(() => {
    const removeDevTools = () => {
      // Find and remove Next.js dev tools button
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        const text = btn.textContent || btn.innerText || '';
        if (text.includes('Dev Tools') || text.includes('Next.js')) {
          btn.style.display = 'none';
          btn.style.visibility = 'hidden';
          btn.style.opacity = '0';
          btn.style.pointerEvents = 'none';
          btn.remove?.();
        }
      });
      
      // Remove any elements with role="complementary" that contain dev tools
      const complementary = document.querySelectorAll('[role="complementary"]');
      complementary.forEach(el => {
        const html = (el as HTMLElement).innerHTML || '';
        if (html.includes('Dev Tools') || html.includes('Next.js')) {
          el.remove?.();
        }
      });
      
      // Remove button with aria-label containing Dev Tools
      const allButtons = document.querySelectorAll('button[aria-label*="Dev"]');
      allButtons.forEach(btn => {
        btn.remove?.();
      });
    };
    
    // Run immediately
    removeDevTools();
    
    // Also run on interval to catch dynamically loaded elements
    const interval = setInterval(removeDevTools, 300);
    
    // Run when DOM changes
    const observer = new MutationObserver(() => {
      removeDevTools();
    });
    
    observer.observe(document.body, { childList: true, subtree: false });
    
    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);
  
  return null;
}
