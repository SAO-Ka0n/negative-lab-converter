import type { ConversionIntent } from "../../../../../packages/converter-core/src/presets";

interface SettingsPanelProps {
  background: string;
  disabled: boolean;
  format: string;
  height: number;
  intent: ConversionIntent;
  lockAspect: boolean;
  quality: number;
  width: number;
  onBackgroundChange: (value: string) => void;
  onConvert: () => void;
  onFormatChange: (value: string) => void;
  onHeightChange: (value: number) => void;
  onIntentChange: (value: ConversionIntent) => void;
  onLockAspectChange: (value: boolean) => void;
  onQualityChange: (value: number) => void;
  onWidthChange: (value: number) => void;
}

export function SettingsPanel(props: SettingsPanelProps) {
  const usesQuality = props.format === "jpeg" || props.format === "webp";
  const usesBackground = props.format === "jpeg";

  return (
    <section className="card ink-card">
      <div className="card-head">
        <span className="index">02</span>
        <div>
          <p className="eyebrow">추천 설정</p>
          <h2>변환 옵션</h2>
        </div>
      </div>

      <div className="form-grid">
        <label>
          <span>용도</span>
          <select
            value={props.intent}
            onChange={(event) => props.onIntentChange(event.target.value as ConversionIntent)}
            disabled={props.disabled}
          >
            <option value="web">웹</option>
            <option value="social">SNS</option>
            <option value="print">인쇄</option>
            <option value="archive">보관</option>
            <option value="custom">직접 조정</option>
          </select>
        </label>

        <label>
          <span>출력 포맷</span>
          <select value={props.format} onChange={(event) => props.onFormatChange(event.target.value)} disabled={props.disabled}>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="tiff">TIFF</option>
          </select>
        </label>

        <label>
          <span>가로(px)</span>
          <input
            type="number"
            min={1}
            max={12000}
            value={props.width}
            disabled={props.disabled}
            onChange={(event) => props.onWidthChange(Number(event.target.value || 0))}
          />
        </label>

        <label>
          <span>세로(px)</span>
          <input
            type="number"
            min={1}
            max={12000}
            value={props.height}
            disabled={props.disabled}
            onChange={(event) => props.onHeightChange(Number(event.target.value || 0))}
          />
        </label>

        <label className="toggle-row">
          <span>비율 고정</span>
          <input
            type="checkbox"
            checked={props.lockAspect}
            disabled={props.disabled}
            onChange={(event) => props.onLockAspectChange(event.target.checked)}
          />
        </label>

        <label>
          <span>품질 {Math.round(props.quality * 100)}%</span>
          <input
            type="range"
            min={0.4}
            max={1}
            step={0.01}
            value={props.quality}
            disabled={props.disabled || !usesQuality}
            onChange={(event) => props.onQualityChange(Number(event.target.value))}
          />
        </label>

        <label>
          <span>JPEG 배경색</span>
          <input
            type="color"
            value={props.background}
            disabled={props.disabled || !usesBackground}
            onChange={(event) => props.onBackgroundChange(event.target.value)}
          />
        </label>
      </div>

      <button className="primary-button wide-button" type="button" disabled={props.disabled} onClick={props.onConvert}>
        변환 실행
      </button>
    </section>
  );
}
