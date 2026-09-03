import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiBookOpen, FiUsers } from 'react-icons/fi';
import StudentShell from '../../components/StudentShell.jsx';
import { peerStyles, PeerPanel } from '../../components/peer/PeerBits.jsx';

function RoleCard({ icon: Icon, title, blurb, cta, chipClass, onClick }) {
  return (
    <div
      className="pp-card"
      onClick={onClick}
      style={{
        flex: '1 1 260px', cursor: 'pointer', minWidth: 240,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span className={`pp-icon-chip ${chipClass}`} style={{ width: 46, height: 46, borderRadius: 12 }}>
          <Icon size={22} />
        </span>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-subtle)', lineHeight: 1.5 }}>{blurb}</div>
      </div>
      <div style={{
        marginTop: 20, display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 13, fontWeight: 700, color: chipClass === 'orange' ? 'var(--brand-orange)' : 'var(--brand-blue)',
      }}>
        {cta} <FiArrowRight size={14} />
      </div>
    </div>
  );
}

export default function PeerHome() {
  const navigate = useNavigate();

  return (
    <StudentShell>
      <style>{peerStyles}</style>
      <PeerPanel
        
        topbarLabel="Peer to Peer"
        title="Learn together. Teach together."
        subtitle="Share what you know, or find a fellow student to learn from."
      >
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', flex: 1, alignItems: 'stretch' }}>
          <RoleCard
            icon={FiBookOpen}
            title="I Want to Teach"
            blurb="Share what you know. Set up a teaching profile, publish topics, and help other students learn from you."
            cta="Start teaching"
            chipClass=""
            onClick={() => navigate('/peer/teach')}
          />
          <RoleCard
            icon={FiUsers}
            title="I Want to Learn"
            blurb="Browse topics from fellow students, request a session that fits your schedule, and learn new skills."
            cta="Start learning"
            chipClass="orange"
            onClick={() => navigate('/peer/learn')}
          />
        </div>
      </PeerPanel>
    </StudentShell>
  );
}