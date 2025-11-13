/**
 * Utility function to export platform reports as PDF
 */

interface ReportStats {
  totalCSRReps: number;
  csrAccountsCreated: number;
  csrActive: number;
  csrSuspended: number;
  totalPIN: number;
  pinAccountsCreated: number;
  pinActive: number;
  pinSuspended: number;
  totalRequests: number;
  unassignedRequests: number;
  pendingRequests: number;
  completedRequests: number;
  fulfillmentRate: number;
  categoryBreakdown: { [categoryName: string]: number };
}

export async function exportReportsToPDF(stats: ReportStats, dateFilter: string) {
  try {
    const jsPDF = (await import("jspdf")).default;
    const doc = new jsPDF();

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const primaryColor = [234, 88, 12]; // Orange-600
    const secondaryColor = [113, 113, 122]; // Zinc-500
    const textColor = [0, 0, 0];

    let yPos = margin;

    // Helper function to set text color
    const setDocColor = (color: number[]) => {
      doc.setTextColor(color[0], color[1], color[2]);
    };

    // Helper function to ensure space on page
    const ensureSpace = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
    };

    // Title
    doc.setFontSize(24);
    setDocColor(primaryColor);
    doc.text("Platform Analytics Report", margin, yPos);
    yPos += 12;

    // Date and filter info
    doc.setFontSize(10);
    setDocColor(secondaryColor);
    const filterText = dateFilter === "all" ? "All Time" : 
                       dateFilter === "7days" ? "Last 7 Days" :
                       dateFilter === "30days" ? "Last 30 Days" : "Last 90 Days";
    doc.text(`Report Period: ${filterText}`, margin, yPos);
    yPos += 6;
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
    yPos += 15;

    // === USER STATISTICS SECTION ===
    ensureSpace(85);
    doc.setFontSize(16);
    setDocColor(primaryColor);
    doc.text("User Statistics", margin, yPos);
    yPos += 10;

    // CSR Reps Box
    doc.setFillColor(249, 250, 251); // Zinc-50
    doc.rect(margin, yPos, 85, 45, "F");
    doc.setFontSize(10);
    setDocColor(secondaryColor);
    doc.text("Total CSR Representatives", margin + 3, yPos + 7);
    doc.setFontSize(20);
    setDocColor(textColor);
    doc.text(String(stats.totalCSRReps), margin + 3, yPos + 17);
    
    doc.setFontSize(9);
    setDocColor(secondaryColor);
    doc.text(`Account Created: ${stats.csrAccountsCreated}`, margin + 3, yPos + 27);
    doc.text(`Active: ${stats.csrActive}`, margin + 3, yPos + 34);
    doc.text(`Suspended: ${stats.csrSuspended}`, margin + 3, yPos + 39);

    // PIN Users Box
    doc.setFillColor(249, 250, 251);
    doc.rect(margin + 95, yPos, 85, 45, "F");
    doc.setFontSize(10);
    setDocColor(secondaryColor);
    doc.text("Total PIN (Users)", margin + 98, yPos + 7);
    doc.setFontSize(20);
    setDocColor(textColor);
    doc.text(String(stats.totalPIN), margin + 98, yPos + 17);
    
    doc.setFontSize(9);
    setDocColor(secondaryColor);
    doc.text(`Account Created: ${stats.pinAccountsCreated}`, margin + 98, yPos + 27);
    doc.text(`Active: ${stats.pinActive}`, margin + 98, yPos + 34);
    doc.text(`Suspended: ${stats.pinSuspended}`, margin + 98, yPos + 39);

    yPos += 55;

    // === ALL REQUESTS SECTION ===
    ensureSpace(70);
    doc.setFontSize(16);
    setDocColor(primaryColor);
    doc.text("All Requests", margin, yPos);
    yPos += 10;

    doc.setFillColor(249, 250, 251);
    doc.rect(margin, yPos, 85, 55, "F");
    
    doc.setFontSize(10);
    setDocColor(textColor);
    doc.text("Total Requests:", margin + 3, yPos + 8);
    doc.setFont("helvetica", "bold");
    doc.text(String(stats.totalRequests), margin + 70, yPos + 8);
    
    doc.setFont("helvetica", "normal");
    doc.text("Unassigned:", margin + 3, yPos + 16);
    doc.setFont("helvetica", "bold");
    doc.text(String(stats.unassignedRequests), margin + 70, yPos + 16);
    
    doc.setFont("helvetica", "normal");
    doc.text("Pending:", margin + 3, yPos + 24);
    doc.setFont("helvetica", "bold");
    doc.text(String(stats.pendingRequests), margin + 70, yPos + 24);
    
    doc.setFont("helvetica", "normal");
    doc.text("Completed:", margin + 3, yPos + 32);
    doc.setFont("helvetica", "bold");
    doc.text(String(stats.completedRequests), margin + 70, yPos + 32);

    // Fulfillment Rate
    doc.setDrawColor(234, 88, 12);
    doc.setLineWidth(0.5);
    doc.line(margin + 3, yPos + 38, margin + 82, yPos + 38);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    setDocColor(textColor);
    doc.text("Fulfillment Rate:", margin + 3, yPos + 46);
    doc.setFontSize(14);
    setDocColor(primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(`${stats.fulfillmentRate}%`, margin + 62, yPos + 46);

    // === REQUEST BY CATEGORY SECTION ===
    const categories = Object.entries(stats.categoryBreakdown);
    const categoryBoxHeight = Math.max(55, 15 + (categories.length * 6));
    
    doc.setFillColor(249, 250, 251);
    doc.rect(margin + 95, yPos, 85, categoryBoxHeight, "F");
    
    doc.setFontSize(12);
    setDocColor(textColor);
    doc.setFont("helvetica", "bold");
    doc.text("Request by Category", margin + 98, yPos + 8);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    // Dynamically display all categories
    let categoryYPos = yPos + 16;
    categories.forEach(([categoryName, count]) => {
      doc.text(`${categoryName}: ${count}`, margin + 98, categoryYPos);
      categoryYPos += 6;
    });

    yPos += categoryBoxHeight + 10;

    // === KEY INSIGHTS SECTION ===
    ensureSpace(50);
    doc.setFontSize(16);
    setDocColor(primaryColor);
    doc.text("Key Insights", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    setDocColor(textColor);
    doc.setFont("helvetica", "normal");

    // Calculate insights
    const avgRequestsPerUser = stats.totalPIN > 0 ? (stats.totalRequests / stats.totalPIN).toFixed(2) : "0";
    const avgRequestsPerCSR = stats.totalCSRReps > 0 ? (stats.completedRequests / stats.totalCSRReps).toFixed(2) : "0";
    const mostPopularCategory = getMostPopularCategory(stats);

    doc.text(`• Average Requests per User: ${avgRequestsPerUser}`, margin + 3, yPos);
    yPos += 7;
    doc.text(`• Average Completed Requests per CSR: ${avgRequestsPerCSR}`, margin + 3, yPos);
    yPos += 7;
    doc.text(`• Most Popular Category: ${mostPopularCategory}`, margin + 3, yPos);
    yPos += 7;
    doc.text(`• Pending Approval Rate: ${((stats.pendingRequests / Math.max(stats.totalRequests, 1)) * 100).toFixed(1)}%`, margin + 3, yPos);

    // Footer
    doc.setFontSize(8);
    setDocColor(secondaryColor);
    doc.text(
      "Platform Manager Analytics Report - Confidential",
      margin,
      pageHeight - 10
    );

    // Save the PDF
    const timestamp = new Date().toISOString().split("T")[0];
    const filterSuffix = dateFilter === "all" ? "all-time" : dateFilter;
    doc.save(`platform-reports-${filterSuffix}-${timestamp}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  }
}

function getMostPopularCategory(stats: ReportStats): string {
  let maxCategory = "None";
  let maxCount = 0;

  Object.entries(stats.categoryBreakdown).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxCategory = name;
    }
  });

  return maxCount > 0 ? `${maxCategory} (${maxCount} requests)` : "None";
}

