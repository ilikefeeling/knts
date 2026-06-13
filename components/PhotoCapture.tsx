"use client";

import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/utils/supabase/client";

type Props = {
  photos: string[];              // Supabase Public URL 배열
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
  const [uploading, setUploading] = useState(false);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const remaining = maxPhotos - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);

    setUploading(true);
    const supabase = createClient();
    const newUrls: string[] = [];

    try {
      await Promise.all(
        toProcess.map(async (file) => {
          // 이미지 리사이즈 및 압축
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          };
          const compressedFile = await imageCompression(file, options);

          const fileExt = compressedFile.name.split(".").pop();
          const fileName = `${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 9)}.${fileExt}`;
          const filePath = `records/${fileName}`;

          // Supabase Storage 업로드 (photos 버킷)
          const { error } = await supabase.storage
            .from("photos")
            .upload(filePath, compressedFile);

          if (error) {
            console.error("업로드 에러:", error);
            return;
          }

          // Public URL 가져오기
          const { data } = supabase.storage
            .from("photos")
            .getPublicUrl(filePath);

          newUrls.push(data.publicUrl);
        })
      );

      if (newUrls.length > 0) {
        onChange([...photos, ...newUrls]);
      }
    } catch (err) {
      console.error("이미지 처리 중 오류:", err);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      // input 초기화 (같은 파일 재선택 허용)
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removePhoto(idx: number) {
    onChange(photos.filter((_, i) => i !== idx));
    setPreviewIdx(null);
  }

  return (
    <div className="photo-capture">
      <label className="field-label">
        📸 현장 사진 (최대 {maxPhotos}장)
        {uploading && <span style={{ marginLeft: 8, fontSize: 12, color: "var(--color-primary)" }}>업로드 중...</span>}
      </label>

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
          <label className={"photo-add-btn" + (uploading ? " disabled" : "")}>
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
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {photos.length > 0 && !disabled && (
        <p className="photo-hint">사진을 터치하면 크게 볼 수 있습니다.</p>
      )}

      {/* 전체화면 미리보기 */}
      {previewIdx !== null && photos[previewIdx] && (
        <div
          className="photo-preview-overlay"
          onClick={() => setPreviewIdx(null)}
        >
          <div
            className="photo-preview-container"
            onClick={(e) => e.stopPropagation()}
          >
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
              <span>
                {previewIdx + 1} / {photos.length}
              </span>
              <button
                disabled={previewIdx === photos.length - 1}
                onClick={() => setPreviewIdx(previewIdx + 1)}
              >
                다음 →
              </button>
            </div>
            <button
              className="photo-preview-close"
              onClick={() => setPreviewIdx(null)}
            >
              ✕ 닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
