import React, { useState } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import PDFService from '../../services/pdfService';
import SimplePDFService from '../../services/simplePdfService';
import { API_CONFIG } from '../../config/apiConfig';

const PDFDownloadButtons = ({ driverData, earningsData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadingStats, setDownloadingStats] = useState(false);
  const [downloadingDaily, setDownloadingDaily] = useState(false);

  const handleDownloadStats = async () => {
    try {
      setDownloadingStats(true);
      setError(null);
      
      // Try PDF service first, fallback to simple text report
      try {
        await PDFService.downloadDriverStatsPDF(driverData, earningsData);
      } catch (pdfError) {
        console.warn('PDF service failed, using text report:', pdfError);
        SimplePDFService.generateDriverStatsReport(driverData, earningsData);
      }
      
    } catch (err) {
      console.error('Error downloading stats:', err);
      setError('Failed to download statistics report. Please try again.');
    } finally {
      setDownloadingStats(false);
    }
  };

  const handleDownloadDailyEarnings = async () => {
    try {
      setDownloadingDaily(true);
      setError(null);
      
      // Fetch daily earnings data
      const userId = driverData?.id;
      if (!userId) {
        throw new Error('Driver ID not found');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/earnings/daily/${userId}?days=30`);
      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        // Try PDF service first, fallback to simple text report
        try {
          await PDFService.downloadDailyEarningsPDF(data.data, driverData);
        } catch (pdfError) {
          console.warn('PDF service failed, using text report:', pdfError);
          SimplePDFService.generateDailyEarningsReport(data.data, driverData);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch daily earnings data');
      }
      
    } catch (err) {
      console.error('Error downloading daily earnings:', err);
      setError('Failed to download daily earnings report. Please try again.');
    } finally {
      setDownloadingDaily(false);
    }
  };

  return (
    <div className="pdf-download-section">
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}
      
      <div className="d-flex gap-2 flex-wrap">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={handleDownloadStats}
          disabled={downloadingStats || downloadingDaily}
          className="d-flex align-items-center gap-2"
        >
          {downloadingStats ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <i className="bi bi-file-earmark-pdf"></i>
          )}
          Download Statistics Report
        </Button>
        
        <Button
          variant="outline-success"
          size="sm"
          onClick={handleDownloadDailyEarnings}
          disabled={downloadingStats || downloadingDaily}
          className="d-flex align-items-center gap-2"
        >
          {downloadingDaily ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <i className="bi bi-calendar-day"></i>
          )}
          Download Daily Earnings Report
        </Button>
      </div>
      
      <style jsx>{`
        .pdf-download-section {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        .pdf-download-section .btn {
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        
        .pdf-download-section .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .pdf-download-section .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default PDFDownloadButtons;
