import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import './App.css'

const LOGO_SIZES = {
  small: 48,
  medium: 64,
  large: 80
}

const LOGO_SHAPES = {
  circle: 'circle',
  rounded: 'rounded',
  square: 'square'
}

const QR_SIZE = 256
const CUTOUT_SIZE_PERCENT = 0.12 // 12% default
const CUTOUT_MAX_PERCENT = 0.15 // 15% absolute max

function App() {
  const [url, setUrl] = useState('')
  const [qrValue, setQrValue] = useState('')
  const [logo, setLogo] = useState(null)
  const [logoSize, setLogoSize] = useState('medium')
  const [logoShape, setLogoShape] = useState('rounded')
  const [centerStyle, setCenterStyle] = useState('none') // 'none', 'empty', 'logo'
  const qrRef = useRef(null)

  // Calculate safe cut-out size (12% default, max 15%)
  const cutOutSize = Math.min(QR_SIZE * CUTOUT_SIZE_PERCENT, QR_SIZE * CUTOUT_MAX_PERCENT)
  const cutOutPadding = cutOutSize * 0.15 // 15% padding around cut-out for safety
  const logoAreaSize = cutOutSize - (cutOutPadding * 2) // Available space for logo

  const handleGenerate = () => {
    if (url.trim()) {
      setQrValue(url.trim())
    }
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogo(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogo(null)
    // Reset center style if it was set to 'logo'
    if (centerStyle === 'logo') {
      setCenterStyle('none')
    }
  }

  const getScanSafety = () => {
    // With center cut-out, always safe due to fixed size (12-15%) and HIGH error correction
    if (centerStyle !== 'none') return 'safe'
    // Without cut-out, check logo size
    if (!logo) return 'safe'
    return logoSize === 'large' ? 'risky' : 'safe'
  }

  const handleDownloadImage = async (size = null) => {
    if (!qrRef.current) return

    try {
      const scale = size === 1024 ? 4 : size === 512 ? 2 : 1
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: '#ffffff',
        scale: scale
      })
      
      let finalCanvas = canvas
      if (size) {
        finalCanvas = document.createElement('canvas')
        finalCanvas.width = size
        finalCanvas.height = size
        const ctx = finalCanvas.getContext('2d')
        ctx.drawImage(canvas, 0, 0, size, size)
      }

      const link = document.createElement('a')
      const sizeLabel = size ? `-${size}x${size}` : ''
      link.download = `qr-code${sizeLabel}-${Date.now()}.png`
      link.href = finalCanvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  const handleDownloadPDF = async () => {
    if (!qrRef.current) return

    try {
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 100
      const pageHeight = pdf.internal.pageSize.height
      const pageWidth = pdf.internal.pageSize.width
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = (pageHeight - imgHeight) / 2

      pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      if (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, position, imgWidth, imgHeight)
      }

      pdf.save(`qr-code-${Date.now()}.pdf`)
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1>QR Code Generator</h1>
        <p className="subtitle">Enter a URL or text to generate a QR code</p>
        
        <div className="input-section">
          <input
            type="text"
            placeholder="Enter URL or text here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
            className="url-input"
          />
          <button onClick={handleGenerate} className="generate-btn">
            Generate QR Code
          </button>
        </div>

        <div className="logo-section">
          <label htmlFor="logo-upload" className="logo-upload-label">
            {logo ? 'Change Logo' : 'Add Logo (Optional)'}
          </label>
          <input
            id="logo-upload"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={handleLogoUpload}
            className="logo-input"
          />
          {logo && (
            <>
              <button onClick={handleRemoveLogo} className="remove-logo-btn">
                Remove Logo
              </button>
              <div className="logo-options">
                <div className="logo-shape-options">
                  <label className="option-label">Shape:</label>
                  <div className="shape-buttons">
                    <button
                      className={`shape-btn ${logoShape === 'circle' ? 'active' : ''}`}
                      onClick={() => setLogoShape('circle')}
                      title="Circle"
                    >
                      ⭕
                    </button>
                    <button
                      className={`shape-btn ${logoShape === 'rounded' ? 'active' : ''}`}
                      onClick={() => setLogoShape('rounded')}
                      title="Rounded Square"
                    >
                      ▢
                    </button>
                    <button
                      className={`shape-btn ${logoShape === 'square' ? 'active' : ''}`}
                      onClick={() => setLogoShape('square')}
                      title="Square"
                    >
                      ▣
                    </button>
                  </div>
                </div>
                <div className="logo-size-options">
                  <label className="option-label">Size:</label>
                  <div className="size-buttons">
                    <button
                      className={`size-btn ${logoSize === 'small' ? 'active' : ''}`}
                      onClick={() => setLogoSize('small')}
                    >
                      Small
                    </button>
                    <button
                      className={`size-btn ${logoSize === 'medium' ? 'active' : ''}`}
                      onClick={() => setLogoSize('medium')}
                    >
                      Medium
                    </button>
                    <button
                      className={`size-btn ${logoSize === 'large' ? 'active' : ''}`}
                      onClick={() => setLogoSize('large')}
                    >
                      Large
                    </button>
                  </div>
                  {logoSize === 'large' && centerStyle === 'none' && (
                    <div className="size-warning">
                      Large logos may reduce scan reliability
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {qrValue && (
          <div className="center-style-section">
            <div className="center-style-options">
              <label className="option-label">Center style:</label>
              <div className="center-style-buttons">
                <button
                  className={`center-style-btn ${centerStyle === 'none' ? 'active' : ''}`}
                  onClick={() => setCenterStyle('none')}
                >
                  None
                </button>
                <button
                  className={`center-style-btn ${centerStyle === 'empty' ? 'active' : ''}`}
                  onClick={() => setCenterStyle('empty')}
                >
                  Empty center
                </button>
                <button
                  className={`center-style-btn ${centerStyle === 'logo' ? 'active' : ''}`}
                  onClick={() => setCenterStyle('logo')}
                  disabled={!logo}
                >
                  Logo in center
                </button>
              </div>
            </div>
          </div>
        )}

        {qrValue && (
          <div className="qr-section">
            <div className="qr-container" ref={qrRef}>
              <QRCodeSVG
                value={qrValue}
                size={QR_SIZE}
                level="H"
                includeMargin={true}
              />
              {centerStyle !== 'none' && (
                <div 
                  className={`cutout-overlay cutout-${logoShape}`}
                  style={{
                    width: `${cutOutSize}px`,
                    height: `${cutOutSize}px`
                  }}
                >
                  {centerStyle === 'logo' && logo && (
                    <img 
                      src={logo} 
                      alt="Logo" 
                      className="cutout-logo"
                      style={{ 
                        maxWidth: `${logoAreaSize}px`, 
                        maxHeight: `${logoAreaSize}px`,
                        width: 'auto',
                        height: 'auto'
                      }}
                    />
                  )}
                </div>
              )}
              {centerStyle === 'none' && logo && (
                <div className={`logo-overlay logo-${logoShape}`}>
                  <img 
                    src={logo} 
                    alt="Logo" 
                    className="qr-logo"
                    style={{ width: `${LOGO_SIZES[logoSize]}px`, height: `${LOGO_SIZES[logoSize]}px` }}
                  />
                </div>
              )}
            </div>
            <div className="scan-safety">
              Scan safety: <span className={`safety-${getScanSafety()}`}>{getScanSafety() === 'safe' ? 'Safe' : 'Risky'}</span>
      </div>
            <div className="download-section">
              <div className="download-buttons">
                <button onClick={() => handleDownloadImage(256)} className="download-btn download-image">
                  PNG 256×256
                </button>
                <button onClick={() => handleDownloadImage(512)} className="download-btn download-image">
                  PNG 512×512
                </button>
                <button onClick={() => handleDownloadImage(1024)} className="download-btn download-image">
                  PNG 1024×1024
                </button>
                <button onClick={handleDownloadPDF} className="download-btn download-pdf">
                  PDF
        </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
