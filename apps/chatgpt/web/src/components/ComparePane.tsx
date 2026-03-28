interface ComparePaneProps {
  convertedMeta?: string;
  convertedUrl?: string;
  originalMeta?: string;
  originalUrl?: string;
}

function PreviewCard({
  label,
  meta,
  url,
}: {
  label: string;
  meta?: string;
  url?: string;
}) {
  return (
    <article className="preview-card">
      <div className="preview-head">
        <span>{label}</span>
        <strong>{meta || "대기 중"}</strong>
      </div>
      <div className="preview-frame">
        {url ? <img src={url} alt={`${label} 미리보기`} /> : <p>아직 이미지가 없습니다.</p>}
      </div>
    </article>
  );
}

export function ComparePane({ convertedMeta, convertedUrl, originalMeta, originalUrl }: ComparePaneProps) {
  return (
    <section className="card dark-card">
      <div className="card-head">
        <span className="index">03</span>
        <div>
          <p className="eyebrow">비교 보기</p>
          <h2>원본과 결과</h2>
        </div>
      </div>

      <div className="preview-grid">
        <PreviewCard label="원본" meta={originalMeta} url={originalUrl} />
        <PreviewCard label="결과" meta={convertedMeta} url={convertedUrl} />
      </div>
    </section>
  );
}
