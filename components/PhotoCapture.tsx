"use client";

import { useState, useRef } from "react";

type Props = {
  photos: string[];              // base64 data URL 배열
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
};

export default function PhotoCapture({
  photos,
  onChange,
  maxPhotos = 5,
  disabled = false,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const remaining = maxPhotos - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);

    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        // 이미지 리사이즈 (max 800px, JPEG 80% 품질로 용량 절약)
        resizeImage(dataUrl, 800, 0.8).then((resized) => {
          onChange([...photos, resized]);
        });
      };
      reader.readAsDataURL(file);
    });

    // input 초기화 (같은 파일 재선택 허용)
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePhoto(idx: number) {
    onChange(photos.filter((_, i) => i !== idx));
    setPreviewIdx(null);
  }

  return (
    <div className="photo-capture">
      <label className="field-label">📸 현장 사진 (최대 {maxPhotos}장)</label>

      {/* 썸네일 그리드 */}
      <div className="photo-grid">
        {photos.map((src, idx) => (
          <div key={idx} className="photo-thumb-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="photo-thumb"
              src={src}
              alt={`현장 사진 ${idx + 1}`}
              onClick={() => setPreviewIdx(idx)}
            />
            {!disabled && (
              <button
                className="photo-remove-btn"
                onClick={() => removePhoto(idx)}
                aria-label="삭제"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {/* 추가 버튼 */}
        {!disabled && photos.length < maxPhotos && (
          <label className="photo-add-btn">
            <span className="photo-add-icon">+</span>
            <span className="photo-add-text">
              {photos.length === 0 ? "사진 촬영" : "추가"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleFiles}
              style={{ display: "none" }}
            />
          </label>
        )}
      </div>

      {photos.length > 0 && !disabled && (
        <p className="photo-hint">
          사진을 터치하면 크게 볼 수 있습니다.
        </p>
      )}

      {/* 전체화면 미리보기 */}
      {previewIdx !== null && photos[previewIdx] && (
        <div className="photo-preview-overlay" onClick={() => setPreviewIdx(null)}>
          <div className="photo-preview-container" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="photo-preview-img"
              src={photos[previewIdx]}
              alt={`현장 사진 ${previewIdx + 1}`}
            />
            <div className="photo-preview-nav">
              <button
                disabled={previewIdx === 0}
                onClick={() => setPreviewIdx(previewIdx - 1)}
              >
                ← 이전
              </button>
              <span>{previewIdx + 1} / {photos.length}</span>
              <button
                disabled={previewIdx === photos.length - 1}
                onClick={() => setPreviewIdx(previewIdx + 1)}
              >
                다음 →
              </button>
            </div>
            <button className="photo-preview-close" onClick={() => setPreviewIdx(null)}>
              ✕ 닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 이미지 리사이즈 유틸 ──
function resizeImage(dataUrl: string, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl); // 실패 시 원본 반환
    img.src = dataUrl;
  });
}
