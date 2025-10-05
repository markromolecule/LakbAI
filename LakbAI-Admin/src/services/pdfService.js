class PDFService {
  /**
   * Load PDF dependencies dynamically
   */
  static async loadDependencies() {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    return { jsPDF, autoTable };
  }

  /**
   * Generate PDF for driver statistics with modern, clean design
   */
  static async generateDriverStatsPDF(driverData, earningsData, dailyEarnings = []) {
    const { jsPDF, autoTable } = await this.loadDependencies();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // --- Header Section ---
    // LakbAI Logo (using actual logo image - square size)
    try {
      doc.addImage('/image/logofinal.png', 'PNG', 15, 8, 25, 25);
    } catch (error) {
      // Fallback to text logo if image fails to load
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(44, 90, 160);
      doc.text('LakbAI', 15, 15);
    }
    
    // Report title (centered)
    doc.setFontSize(16);
    doc.text('Driver Statistics Report', pageWidth / 2, 22, { align: 'center' });
    
    // Generation date (centered)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });
    
    // Header line
    doc.setDrawColor(44, 90, 160);
    doc.setLineWidth(1);
    doc.line(margin, 32, pageWidth - margin, 32);

    // --- Driver Information Section ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 90, 160);
    doc.text('Driver Information', margin, 42);
    
    // Driver info table - more compact
    const driverInfoData = [
      ['Name', `${driverData?.first_name || 'N/A'} ${driverData?.last_name || 'N/A'}`],
      ['Phone', driverData?.phone_number || 'N/A'],
      ['Jeepney', driverData?.assignedJeepney?.jeepneyNumber || 'Not Assigned'],
      ['Status', driverData?.is_verified ? '✅ Verified' : '⏳ Pending'],
      ['Address', driverData?.address || 'Address not available']
    ];

    autoTable(doc, {
      startY: 46,
      body: driverInfoData,
      styles: { 
        fontSize: 10,
        cellPadding: 4,
        halign: 'left'
      },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252] },
        1: { fillColor: [255, 255, 255] }
      },
      margin: { left: margin, right: margin },
      tableWidth: 'auto'
    });

    // --- Comprehensive Earnings Breakdown Section ---
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 90, 160);
    doc.text('Earnings Breakdown by Date', margin, finalY);

    // Create breakdown using daily earnings data if available, otherwise use period data
    let comprehensiveBreakdownData = [];
    
    if (dailyEarnings && dailyEarnings.length > 0) {
      // Use actual daily earnings data
      comprehensiveBreakdownData = dailyEarnings.slice(0, 10).map(day => {
        const dateObj = new Date(day.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
        return [
          formattedDate,
          `PHP ${day.earnings?.toFixed(2) || '0.00'}`,
          day.trips?.toString() || '0',
          `PHP ${day.averageFare?.toFixed(2) || '0.00'}`
        ];
      });
    } else {
      // Fallback to period data with actual dates
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      comprehensiveBreakdownData = [
        [today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), 
         `PHP ${earningsData?.todayEarnings?.toFixed(2) || '0.00'}`, 
         `${earningsData?.todayTrips || 0}`, 
         `PHP ${(earningsData?.todayEarnings / earningsData?.todayTrips || 0).toFixed(2)}`],
        [weekStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), 
         `PHP ${earningsData?.weeklyEarnings?.toFixed(2) || '0.00'}`, 
         `${earningsData?.weeklyTrips || 0}`, 
         `PHP ${(earningsData?.weeklyEarnings / earningsData?.weeklyTrips || 0).toFixed(2)}`],
        [monthStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), 
         `PHP ${earningsData?.monthlyEarnings?.toFixed(2) || '0.00'}`, 
         `${earningsData?.monthlyTrips || 0}`, 
         `PHP ${(earningsData?.monthlyEarnings / earningsData?.monthlyTrips || 0).toFixed(2)}`]
      ];
    }

    autoTable(doc, {
      startY: finalY + 3,
      head: [['Date', 'Earnings', 'Trips', 'Avg Fare']],
      body: comprehensiveBreakdownData,
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        halign: 'center'
      },
      headStyles: { 
        fillColor: [44, 90, 160], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin }
    });

    // --- Daily Earnings Table (if data available) ---
    if (dailyEarnings && dailyEarnings.length > 0) {
      const dailyY = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 90, 160);
      doc.text('Daily Earnings Breakdown', margin, dailyY);

      // Prepare daily earnings data with comprehensive date formatting
      const dailyData = dailyEarnings.slice(0, 20).map(day => {
        // Format date to be more readable
        const dateObj = new Date(day.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
        return [
          formattedDate,
          `PHP ${day.earnings?.toFixed(2) || '0.00'}`,
          day.trips?.toString() || '0',
          `PHP ${day.averageFare?.toFixed(2) || '0.00'}`
        ];
      });

      autoTable(doc, {
        startY: dailyY + 3,
        head: [['Date', 'Earnings', 'Trips', 'Avg Fare']],
        body: dailyData,
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          halign: 'center'
        },
        headStyles: { 
          fillColor: [44, 90, 160], 
          textColor: 255, 
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin }
      });
    }

    // --- Comprehensive Summary Section ---
    const summaryY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 90, 160);
    doc.text('Complete Financial Summary', margin, summaryY);

    // Calculate comprehensive summary data
    const todayEarnings = earningsData?.todayEarnings || 0;
    const weeklyEarnings = earningsData?.weeklyEarnings || 0;
    const monthlyEarnings = earningsData?.monthlyEarnings || 0;
    const totalEarnings = todayEarnings + weeklyEarnings + monthlyEarnings;
    
    const todayTrips = earningsData?.todayTrips || 0;
    const weeklyTrips = earningsData?.weeklyTrips || 0;
    const monthlyTrips = earningsData?.monthlyTrips || 0;
    const totalTrips = todayTrips + weeklyTrips + monthlyTrips;
    
    const averageFare = earningsData?.averageFare || 0;
    const averageDailyEarnings = totalEarnings / 3;
    const earningsGrowth = weeklyEarnings > 0 ? ((monthlyEarnings - weeklyEarnings) / weeklyEarnings * 100) : 0;
    const tripGrowth = weeklyTrips > 0 ? ((monthlyTrips - weeklyTrips) / weeklyTrips * 100) : 0;

    const comprehensiveSummaryData = [
      ['Total All-Time Earnings', `PHP ${totalEarnings.toFixed(2)}`],
      ['Total All-Time Trips', totalTrips.toString()],
      ['Average Daily Earnings', `PHP ${averageDailyEarnings.toFixed(2)}`],
      ['Average Fare per Trip', `PHP ${averageFare.toFixed(2)}`],
      ['Revenue per Day (Avg)', `PHP ${(totalEarnings / 30).toFixed(2)}`]
    ];

    autoTable(doc, {
      startY: summaryY + 3,
      body: comprehensiveSummaryData,
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        halign: 'left'
      },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252] },
        1: { fillColor: [255, 255, 255] }
      },
      margin: { left: margin, right: margin }
    });

    // --- Footer ---
    const footerY = pageHeight - 25;
    doc.setFontSize(14);
    doc.setTextColor(44, 90, 160);
    doc.setFont('helvetica', 'bold');
    doc.text('LakbAI — A Smarter Way to Ride', pageWidth / 2, footerY, { align: 'center' });

    return doc;
  }

  /**
   * Generate PDF for daily earnings with clean design
   */
  static async generateDailyEarningsPDF(dailyEarnings, driverData) {
    const { jsPDF, autoTable } = await this.loadDependencies();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // --- Header Section ---
    // LakbAI Logo (using actual logo image - square size)
    try {
      doc.addImage('/image/logofinal.png', 'PNG', 15, 8, 25, 25);
    } catch (error) {
      // Fallback to text logo if image fails to load
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(44, 90, 160);
      doc.text('LakbAI', 15, 15);
    }
    
    doc.setFontSize(16);
    doc.text('Daily Earnings Report', pageWidth / 2, 22, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.setDrawColor(44, 90, 160);
    doc.setLineWidth(1);
    doc.line(margin, 32, pageWidth - margin, 32);

    // --- Driver Information ---
    if (driverData) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 90, 160);
      doc.text('Driver Information', margin, 42);

      const driverInfoData = [
        ['Name', `${driverData.first_name} ${driverData.last_name}`],
        ['Jeepney', driverData.assignedJeepney?.jeepneyNumber || 'Not Assigned'],
        ['Address', driverData.address || 'Address not available']
      ];

      autoTable(doc, {
        startY: 46,
        body: driverInfoData,
        styles: { 
          fontSize: 10,
          cellPadding: 4,
          halign: 'left'
        },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [248, 250, 252] },
          1: { fillColor: [255, 255, 255] }
        },
        margin: { left: margin, right: margin }
      });
    }

    // --- Daily Earnings Table ---
    const tableY = driverData ? doc.lastAutoTable.finalY + 8 : 50;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 90, 160);
    doc.text('Daily Earnings Breakdown', margin, tableY);

    // Prepare daily earnings data with comprehensive date formatting
    const dailyData = dailyEarnings.map(day => {
      // Format date to be more readable
      const dateObj = new Date(day.date);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      return [
        formattedDate,
        `PHP ${day.earnings?.toFixed(2) || '0.00'}`,
        day.trips?.toString() || '0',
        `PHP ${day.averageFare?.toFixed(2) || '0.00'}`
      ];
    });

    autoTable(doc, {
      startY: tableY + 3,
      head: [['Date', 'Earnings', 'Trips', 'Avg Fare']],
      body: dailyData,
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        halign: 'center'
      },
      headStyles: { 
        fillColor: [44, 90, 160], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin }
    });

    // --- Summary Section ---
    const summaryY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 90, 160);
    doc.text('Summary', margin, summaryY);

    const totalEarnings = dailyEarnings.reduce((sum, day) => sum + (day.earnings || 0), 0);
    const totalTrips = dailyEarnings.reduce((sum, day) => sum + (day.trips || 0), 0);
    const averageDailyEarnings = dailyEarnings.length > 0 ? totalEarnings / dailyEarnings.length : 0;

    // Get date range for the report
    const reportStartDate = dailyEarnings.length > 0 ? new Date(dailyEarnings[dailyEarnings.length - 1].date) : new Date();
    const reportEndDate = dailyEarnings.length > 0 ? new Date(dailyEarnings[0].date) : new Date();
    
    const summaryData = [
      ['Report Period', `${reportStartDate.toLocaleDateString()} - ${reportEndDate.toLocaleDateString()}`],
      ['Total Earnings', `PHP ${totalEarnings.toFixed(2)}`],
      ['Total Trips', totalTrips.toString()],
      ['Average Daily Earnings', `PHP ${averageDailyEarnings.toFixed(2)}`],
      ['Days with Activity', dailyEarnings.length.toString()]
    ];

    autoTable(doc, {
      startY: summaryY + 3,
      body: summaryData,
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        halign: 'left'
      },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252] },
        1: { fillColor: [255, 255, 255] }
      },
      margin: { left: margin, right: margin }
    });

    // --- Footer ---
    const footerY = pageHeight - 25;
    doc.setFontSize(14);
    doc.setTextColor(44, 90, 160);
    doc.setFont('helvetica', 'bold');
    doc.text('LakbAI — A Smarter Way to Ride', pageWidth / 2, footerY, { align: 'center' });

    return doc;
  }

  /**
   * Download driver statistics PDF
   */
  static async downloadDriverStatsPDF(driverData, earningsData, dailyEarnings = []) {
    try {
      const doc = await this.generateDriverStatsPDF(driverData, earningsData, dailyEarnings);
      const fileName = `driver-stats-${driverData?.first_name || 'driver'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating driver stats PDF:', error);
      throw error;
    }
  }

  /**
   * Download daily earnings PDF
   */
  static async downloadDailyEarningsPDF(dailyEarnings, driverData) {
    try {
      const doc = await this.generateDailyEarningsPDF(dailyEarnings, driverData);
      const fileName = `daily-earnings-${driverData?.first_name || 'driver'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating daily earnings PDF:', error);
      throw error;
    }
  }
}

export default PDFService;