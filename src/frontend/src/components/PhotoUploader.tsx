import { Badge } from "@/components/ui/badge";
import { ImagePlus, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface PhotoImage {
  url: string;
  mimeType: string;
  size: bigint;
}

interface PhotoUploaderProps {
  images: PhotoImage[];
  onChange: (images: PhotoImage[]) => void;
}

export default function PhotoUploader({
  images,
  onChange,
}: PhotoUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const newImages: PhotoImage[] = [];
      let remaining = files.length;

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          remaining--;
          if (remaining === 0 && newImages.length > 0) {
            onChange([...images, ...newImages]);
          }
          continue;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          newImages.push({ url, mimeType: file.type, size: BigInt(file.size) });
          remaining--;
          if (remaining === 0) {
            onChange([...images, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [images, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-amber-400 bg-amber-500/10"
            : "border-border hover:border-amber-400/60 hover:bg-muted/30"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        data-ocid="photo_uploader.dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <ImagePlus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">
          {dragging
            ? "Drop photos here"
            : "Drag & drop photos or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Accepts JPG, PNG, WEBP, HEIC
        </p>
      </div>

      {/* Count badge + thumbnails */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {images.length} {images.length === 1 ? "photo" : "photos"}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, idx) => (
              <div
                key={img.url}
                className="relative aspect-square rounded-md overflow-hidden border border-border group"
                data-ocid={`photo_uploader.item.${idx + 1}`}
              >
                <img
                  src={img.url}
                  alt={`Vehicle ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(idx);
                  }}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  data-ocid={`photo_uploader.delete_button.${idx + 1}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
