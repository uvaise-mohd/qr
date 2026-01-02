import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [qrValue, setQrValue] = useState('')
  const [logo, setLogo] = useState(null)
  const qrRef = useRef(null)

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
  }

  const handleDownloadImage = async () => {
    if (!qrRef.current) return

    try {
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      })
      const link = document.createElement('a')
      link.download = `qr-code-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
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
            accept="image/*"
            onChange={handleLogoUpload}
            className="logo-input"
          />
          {logo && (
            <button onClick={handleRemoveLogo} className="remove-logo-btn">
              Remove Logo
            </button>
          )}
        </div>

        {qrValue && (
          <div className="qr-section">
            <div className="qr-container" ref={qrRef}>
              <QRCodeSVG
                value={qrValue}
                size={256}
                level="H"
                includeMargin={true}
              />
              {logo && (
                <div className="logo-overlay">
                  <img src={logo} alt="Logo" className="qr-logo" />
                </div>
              )}
            </div>
            <div className="download-buttons">
              <button onClick={handleDownloadImage} className="download-btn download-image">
                Download as Image
              </button>
              <button onClick={handleDownloadPDF} className="download-btn download-pdf">
                Download as PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
