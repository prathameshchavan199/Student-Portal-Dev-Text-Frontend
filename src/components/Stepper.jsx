import { FiCheck } from 'react-icons/fi';

export default function Stepper({ steps, current }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => {
        const status = i < current ? 'done' : i === current ? 'active' : '';
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`step ${status}`}>
              <div className="dot">{i < current ? <FiCheck /> : i + 1}</div>
              <div className="label">{s}</div>
            </div>
            {i < steps.length - 1 && <div className={`bar ${i < current ? 'filled' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}
