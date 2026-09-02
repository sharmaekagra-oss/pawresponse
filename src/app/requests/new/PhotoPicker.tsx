"use client";

import { useState } from "react";

export default function PhotoPicker() {
  const [preview, setPreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="photo" className="text-sm text-slate-500">
        Photo <span className="text-slate-400">(optional, helps the paravet assess)</span>
      </label>
      <input
        id="photo"
        name="photo"
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-pink-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-pink-700 hover:file:bg-pink-100"
      />
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Selected photo preview"
          className="h-32 w-32 rounded-lg border border-slate-200 object-cover"
        />
      )}
    </div>
  );
}
