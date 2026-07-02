"use client";

import { useState, useRef, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { saveTargetPhoto, getTargetPhotos, removeTargetPhoto } from "@/utils/idbUtils";

type Props = {
  targetId: string;
};

export default function LocalPhotoCapture({ targetId }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<{ blob: Blob; url: string }[]>([]);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    getTargetPhotos(targetId).then((blobs) => {
      if (!active) return;
      const loaded = blobs.map((blob) => ({
        blob,
        url: URL.createObjectURL(blob),
      }));
      setPhotos((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.url));
        return loaded;
      });
    });

    return () => {
      active = false;
      setPhotos((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.url));
        return [];
      });
    };
  }, [targetId]);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);

    try {
      await Promise.all(
        Array.from(files).map(async (file) => {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          };
          const compressedFile = await imageCompression(file, options);
          await saveTargetPhoto(targetId, compressedFile);
        })
      );

      const blobs = await getTargetPhotos(targetId);
      setPhotos((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.url));
        return blobs.map((blob) => ({
          blob,
          url: URL.createObjectURL(blob),
        }));
      });
    } catch (err) {
      console.error("이미지 처리 중 오류:", err);
      alert("사진 저장 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto(idx: number) {
    await removeTargetPhoto(targetId, idx);
    const blobs = await getTargetPhotos(targetId);
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return blobs.map((blob) => ({
        blob,
        url: URL.createObjectURL(blob),
      }));
    });
    setPreviewIdx(null);
  }

  return (
    <div className="photo-capture" style={{ marginBottom: 16 }}>
      <label className="field-label" style={{ marginBottom: 8 }}>
        📸 현장 사진 (미리 찍어두기)
        {uploading && <span style={{ marginLeft: 8, fontSize: 12, color: "var(--color-primary)" }}>처리 중...</span>}
      </label>

      {/* 썸네일 그리드 */}
      <div className="photo-grid">
        {photos.map((p, idx) => (
          <div key={idx} className="photo-thumb-wrap">
            <img
              className="photo-thumb"
              src={p.url}
              alt={`현장 사진 ${idx + 1}`}
              onClick={() => setPreviewIdx(idx)}
            />
            <button
              className="photo-remove-btn"
              onClick={() => removePhoto(idx)}
              aria-label="삭제"
            >
              ✕
            </button>
          </div>
        ))}

        {/* 추가 버튼 */}
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
      </div>

      {photos.length > 0 && (
        <p className="photo-hint" style={{ color: "var(--color-success)", fontWeight: 500, marginTop: 8 }}>
          ✓ 기기에 안전하게 임시 저장되었습니다.
        </p>
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
            <img
              className="photo-preview-img"
              src={photos[previewIdx].url}
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
