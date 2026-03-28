interface UnsupportedStateProps {
  detail: string;
}

export function UnsupportedState({ detail }: UnsupportedStateProps) {
  return (
    <section className="unsupported-card">
      <p className="eyebrow">불러오기 실패</p>
      <h3>현재 파일을 이 환경에서 열지 못했습니다.</h3>
      <p>{detail}</p>
    </section>
  );
}
