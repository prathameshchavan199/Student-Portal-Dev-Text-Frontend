import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/axiosSetup.js';

const FILE_TYPE_MAP = {
  'ssc-certificate.pdf':              'tenthCertificate',
  'intermediate-certificate.pdf':     'intermediateCertificate',
  'diploma-certificate.pdf':          'diplomaCertificate',
  'undergraduate-certificate.pdf':    'undergraduateCertificate',
  'postgraduate-certificate.pdf':     'postGraduationCertificate',
  'resume.pdf':                       'resume',
};

export default function DocViewer() {
  const { docFile } = useParams();
  const [url, setUrl]     = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const type = FILE_TYPE_MAP[docFile];
    if (!type) {
      setError('Document not found.');
      return;
    }

    let cancelled = false;

    axios.get(`${API_BASE_URL}/api/registration/me`)
      .then((meRes) => {
        if (!meRes.data?.success || !meRes.data?.data?.id) {
          throw new Error('no-reg');
        }
        return axios.get(
          `${API_BASE_URL}/api/registration/file/${meRes.data.data.id}/${type}`,
        );
      })
      .then((fileRes) => {
        if (cancelled) return;
        if (fileRes.data?.success && fileRes.data?.url) {
          setUrl(fileRes.data.url);
        } else {
          setError('File not available.');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.message === 'no-reg'
            ? 'Registration not found. Please complete your registration first.'
            : 'Could not load the document. Please try again.',
        );
      });

    return () => { cancelled = true; };
  }, [docFile]);

  if (error) {
    return (
      <div style={centreStyle}>
        <div style={{ fontSize: 48 }}>📄</div>
        <div style={{ fontSize: 15, color: '#888', marginTop: 8, textAlign: 'center' }}>
          {error}
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div style={centreStyle}>
        <div style={{ fontSize: 14, color: '#888' }}>Loading document…</div>
      </div>
    );
  }

  return (
    <iframe
      src={url}
      title={docFile}
      style={{ width: '100vw', height: '100vh', border: 'none', display: 'block' }}
    />
  );
}

const centreStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  fontFamily: 'sans-serif',
};
