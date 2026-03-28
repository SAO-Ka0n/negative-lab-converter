import { normalizeFormatLabel } from "../../../../../packages/converter-core/src/formats";

interface UploadPanelProps {
  fileName?: string;
  inputKind?: string;
  loading: boolean;
  onPickFile: () => void;
  onReset: () => void;
}

export function UploadPanel({ fileName, inputKind, loading, onPickFile, onReset }: UploadPanelProps) {
  return (
    <section className="card paper-card">
      <div className="card-head">
        <span className="index">01</span>
        <div>
          <p className="eyebrow">원본 등록</p>
          <h2>파일 업로드</h2>
        </div>
      </div>

      <p className="card-copy">
        사진 1장을 올리면 ChatGPT 안에서 바로 미리보고, 로컬에서만 변환합니다.
      </p>

      <div className="upload-actions">
        <button className="primary-button" onClick={onPickFile} type="button" disabled={loading}>
          {loading ? "읽는 중…" : "사진 선택"}
        </button>
        <button className="ghost-button" onClick={onReset} type="button">
          초기화
        </button>
      </div>

      <div className="source-chip">
        <strong>{fileName || "아직 선택된 파일이 없습니다."}</strong>
        <span>{inputKind ? normalizeFormatLabel(inputKind) : "PNG · JPEG · WebP · HEIC · TIFF · RAW"}</span>
      </div>
    </section>
  );
}
