import { useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiCheck, FiCloud, FiDownload } from 'react-icons/fi';
import { useCourses } from '../context/CourseContext.jsx';
import StudentShell from '../components/StudentShell.jsx';
import { jsPDF } from 'jspdf';

function QRCode() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="sc-qr-svg">
      <rect width="100" height="100" fill="white" rx="6"/>
      <rect x="7"  y="7"  width="28" height="28" rx="3" fill="#1f2937"/>
      <rect x="11" y="11" width="20" height="20" rx="2" fill="white"/>
      <rect x="15" y="15" width="12" height="12" rx="1" fill="#1f2937"/>
      <rect x="65" y="7"  width="28" height="28" rx="3" fill="#1f2937"/>
      <rect x="69" y="11" width="20" height="20" rx="2" fill="white"/>
      <rect x="73" y="15" width="12" height="12" rx="1" fill="#1f2937"/>
      <rect x="7"  y="65" width="28" height="28" rx="3" fill="#1f2937"/>
      <rect x="11" y="69" width="20" height="20" rx="2" fill="white"/>
      <rect x="15" y="73" width="12" height="12" rx="1" fill="#1f2937"/>
      <rect x="40" y="7"  width="5" height="5" fill="#1f2937"/>
      <rect x="48" y="7"  width="5" height="5" fill="#1f2937"/>
      <rect x="56" y="7"  width="5" height="5" fill="#1f2937"/>
      <rect x="40" y="15" width="5" height="5" fill="#1f2937"/>
      <rect x="56" y="15" width="5" height="5" fill="#1f2937"/>
      <rect x="48" y="23" width="5" height="5" fill="#1f2937"/>
      <rect x="56" y="23" width="5" height="5" fill="#1f2937"/>
      <rect x="7"  y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="15" y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="23" y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="40" y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="56" y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="64" y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="80" y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="88" y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="7"  y="48" width="5" height="5" fill="#1f2937"/>
      <rect x="23" y="48" width="5" height="5" fill="#1f2937"/>
      <rect x="40" y="48" width="5" height="5" fill="#1f2937"/>
      <rect x="56" y="48" width="5" height="5" fill="#1f2937"/>
      <rect x="72" y="48" width="5" height="5" fill="#1f2937"/>
      <rect x="88" y="48" width="5" height="5" fill="#1f2937"/>
      <rect x="7"  y="56" width="5" height="5" fill="#1f2937"/>
      <rect x="15" y="56" width="5" height="5" fill="#1f2937"/>
      <rect x="31" y="56" width="5" height="5" fill="#1f2937"/>
      <rect x="48" y="56" width="5" height="5" fill="#1f2937"/>
      <rect x="64" y="56" width="5" height="5" fill="#1f2937"/>
      <rect x="80" y="56" width="5" height="5" fill="#1f2937"/>
      <rect x="40" y="65" width="5" height="5" fill="#1f2937"/>
      <rect x="56" y="65" width="5" height="5" fill="#1f2937"/>
      <rect x="72" y="65" width="5" height="5" fill="#1f2937"/>
      <rect x="88" y="65" width="5" height="5" fill="#1f2937"/>
      <rect x="40" y="73" width="5" height="5" fill="#1f2937"/>
      <rect x="48" y="73" width="5" height="5" fill="#1f2937"/>
      <rect x="64" y="73" width="5" height="5" fill="#1f2937"/>
      <rect x="80" y="73" width="5" height="5" fill="#1f2937"/>
      <rect x="40" y="81" width="5" height="5" fill="#1f2937"/>
      <rect x="56" y="81" width="5" height="5" fill="#1f2937"/>
      <rect x="72" y="81" width="5" height="5" fill="#1f2937"/>
      <rect x="40" y="89" width="5" height="5" fill="#1f2937"/>
      <rect x="48" y="89" width="5" height="5" fill="#1f2937"/>
      <rect x="64" y="89" width="5" height="5" fill="#1f2937"/>
      <rect x="80" y="89" width="5" height="5" fill="#1f2937"/>
      <rect x="88" y="89" width="5" height="5" fill="#1f2937"/>
    </svg>
  );
}

function buildReceipt(course, locationState) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  // ── User data ─────────────────────────────────────────────────────────────
  const userRaw  = localStorage.getItem('user');
  const userData = userRaw ? (() => { try { return JSON.parse(userRaw); } catch { return {}; } })() : {};
  const nameRaw  = localStorage.getItem('name');
  const userName = nameRaw
    ? (() => { try { return JSON.parse(nameRaw); } catch { return nameRaw; } })()
    : (userData.name || 'Student');

  // ── Payment amounts ───────────────────────────────────────────────────────
  const txnId     = locationState?.razorpayPaymentId || '-';
  const courseFee = locationState?.coursePrice ?? (course?.price || 0);
  const discount  = locationState?.discount    ?? Math.round((course?.price || 0) * 0.2);
  const taxable   = courseFee - discount;
  const cgst      = Math.round(taxable * 0.09);
  const sgst      = Math.round(taxable * 0.09);
  const totalPaid = taxable + cgst + sgst;

  const today     = new Date();
  const dateStr   = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const receiptNo = `CIS-RCP-${today.getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const trunc     = (s, n) => (s && s.length > n) ? s.slice(0, n - 1) + '...' : (s || '-');
  const fmt       = n => `Rs. ${n.toLocaleString('en-IN')}.00`;

  // ── Page geometry ─────────────────────────────────────────────────────────
  const W = 210, ML = 15;
  const CW   = W - ML - 15;        // 180mm content width
  const colW = (CW - 4) / 2;       // ~88mm per column
  const c2   = ML + colW + 4;      // right column x

  // ── Header ────────────────────────────────────────────────────────────────
  let y = 12;

  // Orange logo square
  doc.setFillColor(232, 119, 34);
  doc.roundedRect(ML, y, 18, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('CF', ML + 9, y + 11, { align: 'center' });

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text('Cyfenix Innovative Solutions', ML + 22, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('www.cyfenix.com', ML + 22, y + 14);

  // Receipt label box
  const bW = 72, bX = W - 15 - bW;
  doc.setFillColor(22, 33, 62);
  doc.roundedRect(bX, y, bW, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('PAYMENT RECEIPT', bX + bW / 2, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(190, 205, 230);
  doc.text('GST Tax Invoice', bX + bW / 2, y + 14.5, { align: 'center' });

  y += 23;

  // Orange rule
  doc.setDrawColor(232, 119, 34);
  doc.setLineWidth(0.8);
  doc.line(ML, y, W - 15, y);
  y += 7;

  // ── Meta row ─────────────────────────────────────────────────────────────
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Receipt No:', ML, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(receiptNo, ML + 24, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Date Issued:', ML, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(dateStr, ML + 24, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Status:', W - 15 - 76, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 163, 74);
  doc.text('SUCCESS', W - 15 - 59, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Txn ID:', W - 15 - 76, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(trunc(txnId, 26), W - 15 - 59, y + 6);

  y += 16;

  // ── Table helpers ─────────────────────────────────────────────────────────
  const rH = 8;

  function drawInfoTable(x, startY, w, title, rows) {
    let ty = startY;
    const lblW = w * 0.38;

    doc.setFillColor(208, 215, 228);
    doc.setDrawColor(180, 188, 204);
    doc.setLineWidth(0.15);
    doc.rect(x, ty, w, rH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 20);
    doc.text(title, x + 3, ty + 5.5);
    ty += rH;

    rows.forEach(([lbl, val], i) => {
      doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 249, i % 2 === 0 ? 255 : 251);
      doc.setDrawColor(200, 205, 215);
      doc.setLineWidth(0.1);
      doc.rect(x, ty, w, rH, 'FD');
      doc.line(x + lblW, ty, x + lblW, ty + rH);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text(String(lbl), x + 3, ty + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 20);
      doc.text(trunc(String(val ?? '-'), 34), x + lblW + 3, ty + 5.5);
      ty += rH;
    });

    return ty;
  }

  function drawAmountTable(x, startY, w, title, rows, total) {
    let ty = startY;
    const lblW = w * 0.54;

    doc.setFillColor(208, 215, 228);
    doc.setDrawColor(180, 188, 204);
    doc.setLineWidth(0.15);
    doc.rect(x, ty, w, rH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 20);
    doc.text(title, x + 3, ty + 5.5);
    ty += rH;

    rows.forEach(([lbl, val, highlight], i) => {
      doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 249, i % 2 === 0 ? 255 : 251);
      doc.setDrawColor(200, 205, 215);
      doc.setLineWidth(0.1);
      doc.rect(x, ty, w, rH, 'FD');
      doc.line(x + lblW, ty, x + lblW, ty + rH);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text(String(lbl), x + 3, ty + 5.5);

      doc.setFont('helvetica', highlight ? 'bold' : 'normal');
      doc.setTextColor(highlight ? 200 : 20, highlight ? 80 : 20, highlight ? 20 : 20);
      doc.text(String(val), x + w - 3, ty + 5.5, { align: 'right' });
      ty += rH;
    });

    // Total row (dark navy)
    doc.setFillColor(22, 33, 62);
    doc.rect(x, ty, w, rH + 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL AMOUNT PAID', x + 3, ty + 6.5);
    doc.text(fmt(total), x + w - 3, ty + 6.5, { align: 'right' });
    ty += rH + 2;
    return ty;
  }

  // ── Student + Course tables ───────────────────────────────────────────────
  const courseCode = (course?.id || '').replace(/-/g, '').toUpperCase().slice(0, 12);

  const t1 = drawInfoTable(ML, y, colW, 'STUDENT DETAILS', [
    ['Full Name',  trunc(userName, 28)],
    ['Email',      trunc(userData.email || '-', 30)],
    ['Phone',      userData.phone || '-'],
    ['Address',    '-'],
  ]);
  const t2 = drawInfoTable(c2, y, colW, 'COURSE DETAILS', [
    ['Course Name', trunc(course?.title || '-', 26)],
    ['Course Code', courseCode || '-'],
    ['Duration',    course?.duration || '-'],
    ['Instructor',  trunc(course?.instructor || '-', 26)],
  ]);
  y = Math.max(t1, t2) + 6;

  // ── Payment + Amount tables ───────────────────────────────────────────────
  const p1 = drawInfoTable(ML, y, colW, 'PAYMENT DETAILS', [
    ['Payment Date',   dateStr],
    ['Method',         'Online Payment (Razorpay)'],
    ['Transaction ID', trunc(txnId, 22)],
    ['GST No.',        '27AABCC1234D1Z5'],
  ]);
  const p2 = drawAmountTable(c2, y, colW, 'AMOUNT BREAKDOWN (GST INCLUSIVE)', [
    ['Course Fee',     fmt(courseFee), false],
    ['Discount',       `Rs. -${discount.toLocaleString('en-IN')}.00`, false],
    ['Taxable Amount', fmt(taxable),   false],
    ['CGST @ 9%',      fmt(cgst),      true],
    ['SGST @ 9%',      fmt(sgst),      true],
  ], totalPaid);
  y = Math.max(p1, p2) + 8;

  // ── Footer note bar ───────────────────────────────────────────────────────
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.1);
  doc.rect(ML, y, CW, 10, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(
    'Generated Online - No Signature Required  |  This receipt is valid without a physical or digital signature.',
    ML + CW / 2, y + 6.5, { align: 'center' }
  );

  // ── Bottom strip ──────────────────────────────────────────────────────────
  doc.setFillColor(235, 238, 244);
  doc.rect(0, 281, 210, 16, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'Generated Online - No Signature Required  |  Cyfenix Innovative Solutions  |  GST: 27AABCC1234D1Z5  |  info@cyfenix.com  |  +91 22 4567 8900',
    W / 2, 290, { align: 'center' }
  );

  const safeName = (course?.id || 'course').replace(/[^a-z0-9]/gi, '_');
  doc.save(`Cyfenix_Receipt_${today.getFullYear()}_${safeName}.pdf`);
}

export default function PaymentSuccess({ onSignOut }) {
  const { courseId }            = useParams();
  const navigate                = useNavigate();
  const { state: paymentState } = useLocation();
  const { getCourseById, loading } = useCourses();

  if (loading) {
    return (
      <StudentShell onSignOut={onSignOut}>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      </StudentShell>
    );
  }

  const course = getCourseById(courseId);
  if (!course) return <Navigate to="/courses" replace />;

  const bookingId = `ACZ-${course.id.slice(0, 4).toUpperCase()}-${course.id.slice(4, 8).toUpperCase()}`;

  return (
    <StudentShell onSignOut={onSignOut}>
      <div className="ps-page">
        <div className="ps-card">

          <div className="course-phone-topbar course-detail-header">
            <button type="button" className="mcq-topbar-back" aria-label="Go back" onClick={() => navigate(-1)}>
              <FiArrowLeft />
            </button>
            <span>Payment Status</span>
          </div>

          <div className="ps-hero">
            <div className="ps-check-ring">
              <div className="ps-check-inner"><FiCheck /></div>
            </div>
            <h1 className="ps-title">Seat Reserved<br />Successfully!</h1>
            <p className="ps-desc">
              Your spot in the <span>{course.title}</span> is secured.
              We have sent the details to your registered email.
            </p>
          </div>

          <div className="ps-section">
            <div className="ps-program-row">
              <div className="ps-program-icon"><FiCloud /></div>
              <div className="ps-program-info">
                <small>PROGRAM</small>
                <strong>{course.title}</strong>
              </div>
              <span className="ps-badge">CONFIRMED</span>
            </div>
          </div>

          <div className="ps-section">
            <div className="ps-details-row">
              <div className="ps-details-col">
                <div className="ps-detail">
                  <small>SESSION DATE</small>
                  <p>{course.date ?? 'Flexible'}</p>
                </div>
                <div className="ps-detail">
                  <small>TIME</small>
                  <p>{course.time ?? 'Self-paced'}</p>
                </div>
                <div className="ps-detail">
                  <small>BOOKING ID</small>
                  <p className="ps-mono">{bookingId}</p>
                </div>
              </div>
              <div className="ps-qr"><QRCode /></div>
            </div>
          </div>

          <div className="ps-cta-wrap">
            <button type="button" className="ps-cta" onClick={() => navigate('/courses-progress')}>
              Go to My Learning <FiArrowRight />
            </button>
            <button
              type="button"
              className="ps-cta-secondary"
              onClick={() => buildReceipt(course, paymentState)}
            >
              <FiDownload /> Download Receipt
            </button>
          </div>

        </div>
      </div>
    </StudentShell>
  );
}
