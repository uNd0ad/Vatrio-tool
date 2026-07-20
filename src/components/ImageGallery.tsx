import React, { useState } from 'react';

interface ImageGalleryProps {
  images?: string[] | null;
  primaryImageUrl?: string | null;
  altText?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  primaryImageUrl,
  altText = 'Foto anunț',
}) => {
  // Combine primaryImageUrl and images array into a deduplicated list of URLs
  const allImages = React.useMemo(() => {
    const list: string[] = [];
    if (primaryImageUrl?.trim()) list.push(primaryImageUrl.trim());
    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (img?.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      }
    }
    return list;
  }, [images, primaryImageUrl]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (allImages.length === 0) {
    return (
      <div
        className="image-placeholder-large"
        style={{
          width: '100%',
          height: '220px',
          background: 'var(--table-header-bg, #f1f3f5)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted, #868e96)',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        Fără imagini disponibile
      </div>
    );
  }

  const activeImage = allImages[currentIndex] || allImages[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="inline-image-gallery" style={{ width: '100%', marginBottom: '16px' }}>
      <div
        className="gallery-main-container"
        style={{
          position: 'relative',
          width: '100%',
          height: '240px',
          borderRadius: '10px',
          overflow: 'hidden',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={activeImage}
          alt={`${altText} ${currentIndex + 1}`}
          onClick={() => setIsFullscreen(true)}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            cursor: 'zoom-in',
          }}
        />

        {allImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Imaginea anterioară"
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.6)',
                color: '#ffffff',
                border: 0,
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ‹
            </button>
            <button
              onClick={handleNext}
              aria-label="Imaginea următoare"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.6)',
                color: '#ffffff',
                border: 0,
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ›
            </button>
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '12px',
                background: 'rgba(0,0,0,0.7)',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {currentIndex + 1} / {allImages.length}
            </div>
          </>
        )}
      </div>

      {allImages.length > 1 && (
        <div
          className="gallery-thumbnails"
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {allImages.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                border: idx === currentIndex ? '2px solid #1a73e8' : '1px solid #dce2e7',
                borderRadius: '6px',
                padding: 0,
                background: 'none',
                cursor: 'pointer',
                width: '52px',
                height: '52px',
                flexShrink: 0,
                overflow: 'hidden',
                opacity: idx === currentIndex ? 1 : 0.65,
              }}
            >
              <img
                src={url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}

      {isFullscreen && (
        <div
          onClick={() => setIsFullscreen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <img
            src={activeImage}
            alt={altText}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
          />
          <button
            onClick={() => setIsFullscreen(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              background: 'transparent',
              border: 0,
              color: '#ffffff',
              fontSize: '28px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
