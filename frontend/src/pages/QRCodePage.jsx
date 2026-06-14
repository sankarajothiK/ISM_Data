import React, { useEffect, useRef, useState } from 'react';
import { FiDownload, FiCopy, FiCheck, FiShare2, FiGrid } from 'react-icons/fi';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import Logo from '../components/Logo';

const QRCodePage = () => {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [svgContent, setSvgContent] = useState('');
  const [targetUrl, setTargetUrl] = useState(
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'https://jobs.ismdatatechnology.com/apply'
      : window.location.origin + '/apply'
  );

  useEffect(() => {
    if (canvasRef.current) {
      // Draw to Canvas for display, PNG/JPG export, and PDF insertion
      QRCode.toCanvas(
        canvasRef.current,
        targetUrl,
        {
          width: 320,
          margin: 2,
          color: {
            dark: '#0f172a',  // slate-900
            light: '#ffffff', // white
          },
        },
        (error) => {
          if (error) console.error('Error drawing QR Code Canvas:', error);
        }
      );

      // Generate SVG string for SVG download
      QRCode.toString(
        targetUrl,
        {
          type: 'svg',
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error, string) => {
          if (error) console.error('Error generating QR Code SVG string:', error);
          else setSvgContent(string);
        }
      );
    }
  }, [targetUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPNG = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'ISM_Data_Technology_QR.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJPG = () => {
    if (!canvasRef.current) return;
    // Create temporary canvas to ensure white background is solid
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvasRef.current, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/jpeg', 1.0);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'ISM_Data_Technology_QR.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ISM_Data_Technology_QR.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    if (!canvasRef.current) return;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 1. Header Banner
    doc.setFillColor(15, 23, 42); // slate-900 (Dark Blue)
    doc.rect(0, 0, 210, 45, 'F');

    // 2. Branding (Horizontal Centering)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('ISM DATA', 105, 20, { align: 'center' });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(129, 140, 248); // indigo-400
    doc.text("EMPOWERING RURAL WOMEN'S", 105, 27, { align: 'center', charSpace: 1 });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('RECRUITMENT APPLICATION PORTAL', 105, 34, { align: 'center' });

    // 3. Central Frame / Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('Permanent Application Form QR Code', 105, 65, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Please print and place this QR Code at the registration desks.', 105, 73, { align: 'center' });

    // 4. Draw QR Code Image
    const qrImage = canvasRef.current.toDataURL('image/jpeg', 1.0);
    // Draw white bounding box with shadow/borders
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(50, 85, 110, 110, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.rect(50, 85, 110, 110, 'S');
    // Place QR Code (100mm wide, centered inside 110mm rectangle)
    doc.addImage(qrImage, 'JPEG', 55, 90, 100, 100);

    // 5. Instruction Block at bottom
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229); // brand-600 (Indigo)
    doc.text('Scan to Apply Online', 105, 210, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('Candidates can scan this QR code with any mobile device to directly access the', 105, 218, { align: 'center' });
    doc.text('Job Application Form and upload their resumes.', 105, 223, { align: 'center' });

    // Link Text
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(targetUrl, 105, 234, { align: 'center' });

    // Footer lines
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.line(20, 265, 190, 265);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('ISM Data Technology | Confidential Recruitment Resource', 105, 272, { align: 'center' });

    doc.save('ISM_Data_Technology_Application_QR.pdf');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">Permanent QR Code</h1>
        <p className="text-slate-500 mt-1">Export branding-ready QR codes linking to the candidate application form.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: QR Display Frame */}
        <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center space-y-6">
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl shadow-inner">
            <canvas ref={canvasRef} className="w-full max-w-[280px] h-auto block rounded-lg" />
          </div>
          
          <div className="w-full text-center space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Redirect URL</p>
            <p className="text-sm font-bold text-slate-800 break-all">{targetUrl}</p>
          </div>
        </div>

        {/* Right Side: QR Configuration and Download options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Info */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-3 pb-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Target Redirection URL</h3>
                <p className="text-xs text-slate-400 mt-1">Configure the destination URL that candidates will reach when scanning this QR Code. You can override it with your custom production domain once deployed.</p>
              </div>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-semibold"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://jobs.ismdatatechnology.com/apply"
              />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Branding & Permanent Routing</h3>
              <p className="text-xs text-slate-400 mt-1">This QR code is static and permanent. It does not contain an expiration timestamp, meaning it can be safely printed on physical banners, standees, or recruitment flyers.</p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4 border-y border-slate-100 py-5">
              <button
                onClick={handleCopyLink}
                className={`flex items-center space-x-2 px-4 py-2 border.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${copied ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                <span>{copied ? 'Link Copied!' : 'Copy Form Link'}</span>
              </button>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'ISM Job Application Form',
                      url: targetUrl
                    }).catch(console.error);
                  } else {
                    handleCopyLink();
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-50 border.5 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <FiShare2 className="w-4 h-4" />
                <span>Share Link</span>
              </button>
            </div>

            {/* Download formats grid */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Export High-Resolution Files</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* PNG */}
                <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between transition-colors">
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">PNG Format</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Raster graphic, perfect for digital/emails.</p>
                  </div>
                  <button
                    onClick={downloadPNG}
                    className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                </div>

                {/* JPG */}
                <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between transition-colors">
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">JPG Format</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Raster image with white background.</p>
                  </div>
                  <button
                    onClick={downloadJPG}
                    className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                </div>

                {/* SVG */}
                <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between transition-colors">
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">SVG Format</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Vector format, infinite scalability for prints.</p>
                  </div>
                  <button
                    onClick={downloadSVG}
                    className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                </div>

                {/* PDF */}
                <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between transition-colors">
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">Branded PDF Document</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Includes ISM Data Technology branding header.</p>
                  </div>
                  <button
                    onClick={downloadPDF}
                    className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;
