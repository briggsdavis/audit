"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { ImageAsset } from "../../lib/domain";

export type ImageDropZoneCopy = {
  optionalMultiple: string;
  uploading: string;
  dropImages: string;
  browseImages: string;
  uploadError: string;
  removeImage: string;
};

export function ImageDropZone({ label, images, token, copy, onChange }: { label: string; images: ImageAsset[]; token: string; copy: ImageDropZoneCopy; onChange: (next: ImageAsset[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.reports.generateUploadUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  const add = async (files: FileList | File[]) => {
    const valid = Array.from(files).filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type));
    if (!valid.length) return;
    setUploading(true); setUploadError(false);
    try {
      const incoming = await Promise.all(valid.map(async (file) => {
        const uploadUrl = await generateUploadUrl({ token });
        const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
        if (!response.ok) throw new Error("Upload failed");
        const { storageId } = await response.json() as { storageId: Id<"_storage"> };
        return { storageId, url: URL.createObjectURL(file) };
      }));
      onChange([...images, ...incoming]);
    } catch {
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  };

  return <div>
    <label className="field-label">{label} <span>{copy.optionalMultiple}</span></label>
    <div className="dropzone" tabIndex={0} role="button" onClick={() => input.current?.click()}
      onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); add(event.dataTransfer.files); }}
      onPaste={(event) => add(event.clipboardData.files)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") input.current?.click(); }}>
      <input ref={input} type="file" hidden multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => event.target.files && add(event.target.files)} />
      <span className="upload-icon">↑</span><strong>{uploading ? copy.uploading : copy.dropImages}</strong><small>{copy.browseImages}</small>
    </div>
    {uploadError && <p className="form-error">{copy.uploadError}</p>}
    {images.length > 0 && <div className="image-strip">{images.map((image, index) => <div className="image-chip" key={image.storageId}>
      <img src={image.url} alt={`${label} ${index + 1}`} />
      <button type="button" aria-label={copy.removeImage} onClick={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))}>×</button>
    </div>)}</div>}
  </div>;
}
