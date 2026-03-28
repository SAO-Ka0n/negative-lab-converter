interface DownloadBarProps {
  downloadDisabled: boolean;
  fileName: string;
  summary?: string;
  onDownload: () => void;
}

export function DownloadBar({ downloadDisabled, fileName, summary, onDownload }: DownloadBarProps) {
  return (
    <section className="download-bar">
      <div>
        <p className="eyebrow">다운로드</p>
        <strong>{fileName}</strong>
        <span>{summary || "변환 후 결과를 다운로드할 수 있습니다."}</span>
      </div>
      <button className="primary-button" type="button" onClick={onDownload} disabled={downloadDisabled}>
        결과 저장
      </button>
    </section>
  );
}
