'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface CertificateQRProps {
  objectId: string;
}

export function CertificateQR({ objectId }: CertificateQRProps) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(`${window.location.origin}/verify/${objectId}`);
  }, [objectId]);

  if (!url) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <QRCodeSVG
          value={url}
          size={96}
          bgColor="#ffffff"
          fgColor="#1e1b4b"
          level="M"
          includeMargin={false}
        />
      </div>
      <p className="text-xs text-gray-400 text-center max-w-[120px] leading-tight">
        Scan to verify this credential
      </p>
    </div>
  );
}
