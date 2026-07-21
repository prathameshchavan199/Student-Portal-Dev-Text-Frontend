import { jsPDF } from 'jspdf';
import CyfenixLogo from '../assets/images/Cyfenix-Logo.png';

function readStudentName() {
  const rawUser = localStorage.getItem('user');
  if (rawUser) {
    try {
      const user = JSON.parse(rawUser);
      if (user?.name) return String(user.name).trim();
    } catch {
      // Fall through to the simple name field.
    }
  }

  const rawName = localStorage.getItem('name');
  if (!rawName || rawName === 'null' || rawName === 'undefined') return 'Student';

  try {
    return String(JSON.parse(rawName)).trim() || 'Student';
  } catch {
    return rawName.trim() || 'Student';
  }
}

function buildCertificateNo(assessmentName, attemptNo) {
  const slug = assessmentName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 18);
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `CERT-${slug || 'ASSESSMENT'}-${attemptNo}-${stamp}`;
}

function buildDisplayCertificateNo(assessmentName, attemptNo, issueDate) {
  const slug = assessmentName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 12);

  return `CIS-${issueDate.getFullYear()}-${slug || 'TEST'}-${String(attemptNo).padStart(2, '0')}`;
}

function formatCertificateDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function drawCenteredWrappedText(doc, text, x, y, maxWidth, lineHeight, options = {}) {
  const lines = doc.splitTextToSize(text, maxWidth);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    doc.text(line, x, startY + index * lineHeight, { align: 'center', ...options });
  });
  return startY + (lines.length - 1) * lineHeight;
}

async function loadImageDataUrl(src) {
  const response = await fetch(src);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function downloadAssessmentCertificate({
  assessmentName,
  score,
  totalScore,
  attemptNo = 1,
  issuedAt = new Date(),
  trainingHours = '40 Hours',
}) {
  const studentName = readStudentName();
  const issueDate = issuedAt instanceof Date ? issuedAt : new Date(issuedAt);
  const displayCertificateNo = buildDisplayCertificateNo(assessmentName, attemptNo, issueDate);
  let logoDataUrl = null;

  try {
    logoDataUrl = await loadImageDataUrl(CyfenixLogo);
  } catch {
    logoDataUrl = null;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentInset = 14;

  const blue = '#1f4e7f';
  const orange = '#f26b00';
  const gold = '#d9a621';
  const paleBlue = '#e8eef3';
  const bandBlue = '#c3d8ef';
  const textDark = '#243447';

  doc.setFillColor(paleBlue);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setDrawColor(orange);
  doc.setLineWidth(1.2);
  doc.line(contentInset, 18, pageWidth - contentInset, 18);
  doc.line(contentInset, pageHeight - 3, pageWidth - contentInset, pageHeight - 3);

  doc.setDrawColor(gold);
  doc.setLineWidth(0.6);
  doc.line(contentInset, 104, pageWidth - contentInset, 104);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth / 2 - 34, 23, 68, 40, 2, 2, 'F');
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 25, 30, 50, 27);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(blue);
    doc.text('CYFENIX', pageWidth / 2, 45, { align: 'center' });
  }

  doc.setTextColor(blue);
  doc.setFont('times', 'bold');
  doc.setFontSize(21);
  doc.text('C E R T I F I C A T E   O F', pageWidth / 2, 77, { align: 'center' });
  doc.text('C O M P L E T I O N', pageWidth / 2, 90, { align: 'center' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(orange);
  doc.text('C y f e n i x   I n n o v a t i v e   S o l u t i o n s', pageWidth / 2, 100, { align: 'center' });

  const middleBlockShiftY = -3.95;

  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(textDark);
  doc.text('This is to proudly certify that', pageWidth / 2, 117 + middleBlockShiftY, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(studentName.length > 28 ? 25 : 32);
  doc.setTextColor(blue);
  doc.text(studentName, pageWidth / 2, 132 + middleBlockShiftY, { align: 'center' });
  doc.setDrawColor(blue);
  doc.setLineWidth(0.45);
  doc.line(contentInset, 138 + middleBlockShiftY, pageWidth - contentInset, 138 + middleBlockShiftY);

  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(textDark);
  doc.text('has successfully completed the course', pageWidth / 2, 146 + middleBlockShiftY, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(orange);
  drawCenteredWrappedText(doc, `"${assessmentName}"`, pageWidth / 2, 156 + middleBlockShiftY, pageWidth - 38, 8);

  doc.setFillColor(bandBlue);
  doc.rect(contentInset, 164 + middleBlockShiftY, pageWidth - contentInset * 2, 16, 'F');
  doc.setDrawColor(blue);
  doc.setLineWidth(0.45);
  doc.line(contentInset, 164 + middleBlockShiftY, pageWidth - contentInset, 164 + middleBlockShiftY);
  doc.line(contentInset, 180 + middleBlockShiftY, pageWidth - contentInset, 180 + middleBlockShiftY);
  doc.setDrawColor(173, 190, 210);
  const bandWidth = pageWidth - contentInset * 2;
  const firstDivider = contentInset + bandWidth / 3;
  const secondDivider = contentInset + (bandWidth / 3) * 2;
  const firstColumnCenter = contentInset + bandWidth / 6;
  const secondColumnCenter = contentInset + bandWidth / 2;
  const thirdColumnCenter = contentInset + (bandWidth / 6) * 5;
  doc.line(firstDivider, 164 + middleBlockShiftY, firstDivider, 180 + middleBlockShiftY);
  doc.line(secondDivider, 164 + middleBlockShiftY, secondDivider, 180 + middleBlockShiftY);

  const infoY = 169.5 + middleBlockShiftY;
  const valueY = 176 + middleBlockShiftY;
  doc.setTextColor(blue);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text('DATE OF COMPLETION', firstColumnCenter, infoY, { align: 'center' });
  doc.text('TRAINING HOURS', secondColumnCenter, infoY, { align: 'center' });
  doc.text('CERTIFICATE NO', thirdColumnCenter, infoY, { align: 'center' });

  doc.setTextColor(textDark);
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text(formatCertificateDate(issueDate), firstColumnCenter, valueY, { align: 'center' });
  doc.text(String(trainingHours), secondColumnCenter, valueY, { align: 'center' });
  doc.text(displayCertificateNo, thirdColumnCenter, valueY, { align: 'center' });

  doc.setDrawColor(blue);
  doc.setLineWidth(0.45);
  doc.line(28, 195, 136, 195);
  doc.line(pageWidth - 136, 195, pageWidth - 28, 195);

  doc.setTextColor(blue);
  doc.setFont('times', 'bold');
  doc.setFontSize(7.5);
  doc.text('Dr. A. Williams  |  Instructor', 82, 201, { align: 'center' });
  doc.text('Cyfenix Innovative Solutions', pageWidth - 82, 201, { align: 'center' });

  const filename = `${assessmentName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}-certificate.pdf`;
  doc.save(filename || 'assessment-certificate.pdf');
}

export function getNextAttemptNo(moduleId) {
  try {
    const raw = localStorage.getItem('assessment-attempts');
    const all = raw ? JSON.parse(raw) : {};
    return (all[moduleId]?.length ?? 0) + 1;
  } catch {
    return 1;
  }
}
