import { useState } from 'react';
import { FiPlus, FiX } from 'react-icons/fi';

const colors = ['', 'orange'];

export default function TagInput({ tags, setTags }) {
  const [value, setValue] = useState('');
  const add = () => {
    const v = value.trim();
    if (!v) return;
    if (!tags.includes(v)) setTags([...tags, v]);
    setValue('');
  };
  return (
    <div>
      <div className="d-flex flex-wrap gap-2 mb-2">
        {tags.map((t, i) => (
          <span key={t} className={`tag-pill ${colors[i % 2]}`}>
            {t}
            <button type="button" onClick={() => setTags(tags.filter(x => x !== t))}><FiX /></button>
          </span>
        ))}
        <span className="tag-pill" style={{ background: 'transparent', borderStyle: 'dashed' }}>
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            placeholder="Add Tag"
            style={{ background: 'transparent', border: 0, color: '#fff', outline: 'none', width: 90 }}
          />
          <button type="button" onClick={add}><FiPlus /></button>
        </span>
      </div>
    </div>
  );
}
