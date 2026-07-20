import React, { useState, useEffect } from 'react';

interface TranslateProps {
  text: string;
  targetLang: 'fa' | 'en' | 'ar' | 'es' | string;
  className?: string;
  isMarkdown?: boolean;
}

export const Translate: React.FC<TranslateProps> = ({ text, targetLang, className, isMarkdown }) => {
  const [translatedText, setTranslatedText] = useState(text);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!text) {
      setTranslatedText("");
      return;
    }

    // Try reading cache first
    const cacheKey = `trans_${targetLang}_${encodeURIComponent(text.substring(0, 100))}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setTranslatedText(cached);
        return;
      }
    } catch (e) {}

    // Check if target matches language characteristics to bypass API translation
    const isFarsiText = /[\u0600-\u06FF]/.test(text);
    if (targetLang === 'fa' && isFarsiText && !text.includes('IMAGE_PROMPT')) {
      setTranslatedText(text);
      return;
    }
    const isEnglishText = /^[a-zA-Z0-9\s.,!?'"-]+$/.test(text);
    if (targetLang === 'en' && isEnglishText) {
      setTranslatedText(text);
      return;
    }

    // Call translation endpoint
    setLoading(true);
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang })
    })
      .then(res => {
        if (!res.ok) throw new Error("Translation failed");
        return res.json();
      })
      .then(data => {
        if (data.translatedText) {
          try {
            localStorage.setItem(cacheKey, data.translatedText);
          } catch (e) {}
          setTranslatedText(data.translatedText);
        }
      })
      .catch(err => {
        console.error("Translation error:", err);
        setTranslatedText(text); // Fallback to original text
      })
      .finally(() => {
        setLoading(false);
      });
  }, [text, targetLang]);

  if (loading) {
    return (
      <span className={`${className} opacity-60 animate-pulse`}>
        {translatedText || text}
      </span>
    );
  }

  return <span className={className} style={{ whiteSpace: 'pre-wrap' }}>{translatedText}</span>;
};
