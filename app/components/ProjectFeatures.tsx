import { PROJECT_FEATURES, type ProjectFeature } from "../../lib/project-features";

export function ProjectFeaturePicker({ value, onChange, disabled = false }: {
  value: ProjectFeature[]; onChange: (value: ProjectFeature[]) => void; disabled?: boolean;
}) {
  return <fieldset className="project-feature-picker" disabled={disabled}>
    <legend>Project Features</legend>
    <p>Select the building amenities confirmed for this listing.</p>
    <div className="project-feature-grid">{PROJECT_FEATURES.map(feature =>
      <label key={feature}><input type="checkbox" checked={value.includes(feature)}
        onChange={event => onChange(event.target.checked
          ? PROJECT_FEATURES.filter(item => item === feature || value.includes(item))
          : value.filter(item => item !== feature))} /><span>{feature}</span></label>
    )}</div>
  </fieldset>;
}

export default function ProjectFeatures({ value }: { value: ProjectFeature[] }) {
  if (!value.length) return null;
  return <section className="project-features" aria-labelledby="project-features-title">
    <h2 id="project-features-title">Project Features</h2>
    <ul className="project-feature-grid">{PROJECT_FEATURES.filter(feature => value.includes(feature)).map(feature =>
      <li key={feature}><span className="project-feature-check" aria-hidden="true">✓</span><span>{feature}</span></li>
    )}</ul>
  </section>;
}
