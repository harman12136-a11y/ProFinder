import { useRef, useState, useEffect, useCallback } from 'react';
import { CATEGORIES } from '../utils/categories';
import './CategoryPills.css';

export default function CategoryPills({ active, onChange }) {
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, scrollLeft: 0 });
  const [thumb, setThumb] = useState({ width: 0, left: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const updateThumb = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ratio = el.clientWidth / el.scrollWidth;
    const width = Math.max(ratio * 100, 12);
    const maxScroll = el.scrollWidth - el.clientWidth;
    const left = maxScroll > 0 ? (el.scrollLeft / maxScroll) * (100 - width) : 0;
    setThumb({ width, left });
  }, []);

  useEffect(() => {
    updateThumb();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateThumb);
    window.addEventListener('resize', updateThumb);
    return () => {
      el.removeEventListener('scroll', updateThumb);
      window.removeEventListener('resize', updateThumb);
    };
  }, [updateThumb]);

  const handleTrackClick = (e) => {
    if (dragging.current) return;
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track || e.target !== track) return;
    const rect = track.getBoundingClientRect();
    const clickRatio = (e.clientX - rect.left) / rect.width;
    const maxScroll = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: clickRatio * maxScroll, behavior: 'smooth' });
  };

  const handleThumbPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      scrollLeft: scrollRef.current?.scrollLeft || 0,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleThumbPointerMove = (e) => {
    if (!dragging.current) return;
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;

    const trackWidth = track.clientWidth;
    const thumbRatio = el.clientWidth / el.scrollWidth;
    const thumbWidthPx = Math.max(thumbRatio * trackWidth, 24);
    const maxThumbTravel = trackWidth - thumbWidthPx;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxThumbTravel <= 0 || maxScroll <= 0) return;

    const deltaX = e.clientX - dragStart.current.x;
    const deltaScroll = (deltaX / maxThumbTravel) * maxScroll;
    el.scrollLeft = Math.max(0, Math.min(maxScroll, dragStart.current.scrollLeft + deltaScroll));
  };

  const handleThumbPointerUp = (e) => {
    dragging.current = false;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="category-pills-wrap">
      <div className="category-pills" ref={scrollRef}>
        <button
          type="button"
          className={`category-pill ${active === 'all' ? 'active' : ''}`}
          onClick={() => onChange('all')}
        >
          All
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={`category-pill ${active === category ? 'active' : ''}`}
            onClick={() => onChange(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div
        className="category-pills-track"
        ref={trackRef}
        onClick={handleTrackClick}
        role="presentation"
      >
        <div
          className={`category-pills-thumb${isDragging ? ' dragging' : ''}`}
          style={{ width: `${thumb.width}%`, left: `${thumb.left}%` }}
          onPointerDown={handleThumbPointerDown}
          onPointerMove={handleThumbPointerMove}
          onPointerUp={handleThumbPointerUp}
          onPointerCancel={handleThumbPointerUp}
        />
      </div>
    </div>
  );
}
