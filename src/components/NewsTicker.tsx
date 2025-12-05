import { useEffect, useRef, useState } from 'react';
import type { UiNews } from '../types/news';
import './NewsTicker.css';

type NewsTickerProps = {
  newsList: UiNews[];
};

export default function NewsTicker({ newsList }: NewsTickerProps) {
  const [queue, setQueue] = useState<UiNews[]>(newsList.slice(0, 10));
  const [translate, setTranslate] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const tickerItemRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    setQueue(newsList.slice(0, 10));
  }, [newsList]);

  useEffect(() => {
    if (expanded || queue.length < 2) return undefined;

    const interval = setInterval(() => {
      const height = tickerItemRef.current?.offsetHeight ?? 0;
      setTranslate(-height);

      setTimeout(() => {
        setQueue((prev) => {
          if (prev.length < 2) return prev;
          const [first, ...rest] = prev;
          return [...rest, first];
        });
        setTranslate(0);
      }, 450);
    }, 3200);

    return () => clearInterval(interval);
  }, [queue.length, expanded]);

  if (queue.length === 0) return null;

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        width: 'min(600px, 100%)',
        margin: '16px auto 12px',
        padding: 8,
        background: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div className="ticker-viewport">
          <div
            className="ticker-list"
            style={{
              transform: `translateY(${translate}px)`,
              transition: translate === 0 ? 'none' : 'transform 0.45s ease-out',
            }}
          >
            {queue.map((item, index) => (
              <a
                key={`${item.id ?? item.title}-${index}`}
                href={(item.originalLink as string) || (item.url as string) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                ref={index === 0 ? tickerItemRef : null}
                className="ticker-item"
              >
                {item.title || '제목 없음'}
              </a>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => setExpanded((prev) => !prev)} className="ticker-btn">
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div className="ticker-expanded-list">
          {newsList.map((item, index) => (
            <a
              key={`${item.id ?? item.title}-expanded-${index}`}
              href={(item.originalLink as string) || (item.url as string) || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className='ticker-expanded-item'
            >
              {item.title || '제목 없음'}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

