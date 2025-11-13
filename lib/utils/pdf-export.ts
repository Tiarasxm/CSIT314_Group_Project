/**
 * Utility function to export request details as PDF
 */
async function fetchImageDataUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return null;

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read image data"));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Failed to load image for PDF export:", error);
    return null;
  }
}

function setDocColor(doc: any, color: number[]) {
  doc.setTextColor(color[0], color[1], color[2]);
}

function ensureSpace(doc: any, yPosRef: { value: number }, requiredSpace: number, margin: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPosRef.value + requiredSpace > pageHeight - margin) {
    doc.addPage();
    yPosRef.value = margin;
  }
}

function addSectionHeading(doc: any, text: string, yPosRef: { value: number }, margin: number, primaryColor: number[]) {
  ensureSpace(doc, yPosRef, 12, margin);
  doc.setFontSize(13);
  setDocColor(doc, primaryColor);
  doc.text(text, margin, yPosRef.value);
  yPosRef.value += 8;
}

function addParagraph(
  doc: any,
  text: string,
  yPosRef: { value: number },
  margin: number,
  contentWidth: number,
  fontSize = 11,
  lineHeight = 6,
  color: number[] = [0, 0, 0]
) {
  if (!text) return;
  const lines = doc.splitTextToSize(text, contentWidth);
  doc.setFontSize(fontSize);
  setDocColor(doc, color);
  lines.forEach((line: string) => {
    ensureSpace(doc, yPosRef, lineHeight, margin);
    doc.text(line, margin, yPosRef.value);
    yPosRef.value += lineHeight;
  });
}

async function addImage(
  doc: any,
  url: string | undefined,
  yPosRef: { value: number },
  margin: number,
  contentWidth: number,
  maxHeight: number
) {
  const dataUrl = await fetchImageDataUrl(url);
  if (!dataUrl) return;
  const formatMatch = dataUrl.match(/^data:image\/([a-zA-Z]+);/);
  if (!formatMatch) return;
  const format = formatMatch[1].toUpperCase() === "JPG" ? "JPEG" : formatMatch[1].toUpperCase();

  const properties = doc.getImageProperties(dataUrl);
  let { width, height } = properties;

  const maxWidth = contentWidth;
  if (width > maxWidth) {
    const scale = maxWidth / width;
    width = maxWidth;
    height *= scale;
  }
  if (height > maxHeight) {
    const scale = maxHeight / height;
    height = maxHeight;
    width *= scale;
  }

  ensureSpace(doc, yPosRef, height + 6, margin);
  doc.addImage(dataUrl, format, margin, yPosRef.value, width, height);
  yPosRef.value += height + 6;
}

export async function exportRequestToPDF(request: any) {
  try {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    const primaryColor = [255, 149, 0];
    const textColor = [0, 0, 0];
    const grayColor = [100, 100, 100];

    const yPosRef = { value: margin };

    // Header
    doc.setFontSize(20);
    setDocColor(doc, primaryColor);
    doc.text("Request Details", margin, yPosRef.value);
    yPosRef.value += 10;

    doc.setFontSize(12);
    setDocColor(doc, grayColor);
    doc.text(`Request ID: #${request.id.slice(0, 8)}`, margin, yPosRef.value);
    yPosRef.value += 8;

    doc.setFontSize(14);
    setDocColor(doc, textColor);
    doc.text(`Category: ${request.category || "Other"}`, margin, yPosRef.value);
    yPosRef.value += 10;

    // Requester
    const requestUser = request.users;
    const userName = getUserDisplayName(requestUser);

    addSectionHeading(doc, "Requester", yPosRef, margin, primaryColor);
    await addImage(doc, requestUser?.profile_image_url, yPosRef, margin, 40, 40);
    addParagraph(doc, `Name: ${userName}`, yPosRef, margin, contentWidth, 11, 6, textColor);
    if (requestUser?.email) {
      addParagraph(doc, `Email: ${requestUser.email}`, yPosRef, margin, contentWidth, 11, 6, textColor);
    }

    const preferredDate = request?.scheduled_at || request?.preferred_at;
    if (preferredDate) {
      const preferredObj = new Date(preferredDate);
      addParagraph(
        doc,
        `Preferred Date / Time: ${preferredObj.toLocaleDateString()} • ${preferredObj.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        yPosRef,
        margin,
        contentWidth,
        11,
        6,
        textColor
      );
    } else {
      addParagraph(doc, "Preferred Date / Time: Not specified", yPosRef, margin, contentWidth, 11, 6, textColor);
    }

    if (request.created_at) {
      const createdDate = new Date(request.created_at);
      addParagraph(doc, `Created On: ${createdDate.toLocaleString()}`, yPosRef, margin, contentWidth, 11, 6, textColor);
    }

    // Description
    addSectionHeading(doc, "Description", yPosRef, margin, primaryColor);
    addParagraph(doc, request.description || "No description provided.", yPosRef, margin, contentWidth);

    if (request.additional_notes) {
      addSectionHeading(doc, "Additional Notes", yPosRef, margin, primaryColor);
      addParagraph(doc, request.additional_notes, yPosRef, margin, contentWidth);
    }

    // Attachments
    const attachments: string[] = request.attachments || [];
    if (attachments.length > 0) {
      addSectionHeading(doc, "Attachments", yPosRef, margin, primaryColor);
      const imageAttachments = attachments.filter((url) => /\.(png|jpe?g|gif|webp|svg)$/i.test(url));
      const otherAttachments = attachments.filter((url) => !imageAttachments.includes(url));

      for (const imageUrl of imageAttachments) {
        await addImage(doc, imageUrl, yPosRef, margin, contentWidth, 80);
      }

      if (otherAttachments.length > 0) {
        addParagraph(doc, "Files:", yPosRef, margin, contentWidth, 11, 6, textColor);
        otherAttachments.forEach((url) => {
          addParagraph(doc, `- ${url}`, yPosRef, margin, contentWidth, 10, 5, grayColor);
        });
      }
    }

    // Status
    addSectionHeading(doc, "Status", yPosRef, margin, primaryColor);
    addParagraph(doc, request.status || "Unknown", yPosRef, margin, contentWidth);

    // Volunteer Information
    if (request.volunteer_name || request.volunteer_note || request.volunteer_image_url) {
      addSectionHeading(doc, "Assigned Volunteer", yPosRef, margin, primaryColor);
      await addImage(doc, request.volunteer_image_url, yPosRef, margin, contentWidth, 50);
      if (request.volunteer_name) {
        addParagraph(doc, `Name: ${request.volunteer_name}`, yPosRef, margin, contentWidth, 11, 6, textColor);
      }
      if (request.volunteer_mobile) {
        addParagraph(doc, `Mobile: ${request.volunteer_mobile}`, yPosRef, margin, contentWidth, 11, 6, textColor);
      }
      if (request.volunteer_note) {
        addParagraph(doc, `Note: ${request.volunteer_note}`, yPosRef, margin, contentWidth, 11, 6, textColor);
      }
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      setDocColor(doc, grayColor);
      doc.text(`Page ${i} of ${pageCount}`, margin, doc.internal.pageSize.getHeight() - margin / 2);
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        pageWidth - margin - 40,
        doc.internal.pageSize.getHeight() - margin / 2,
        { align: "right" }
      );
    }

    const fileName = `Request_${request.id.slice(0, 8)}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

/**
 * Helper function to get user display name
 */
export function getUserDisplayName(user: any): string {
  if (user?.first_name && user?.last_name) {
    return `${user.first_name} ${user.last_name}`.trim();
  }
  if (user?.first_name) return user.first_name;
  if (user?.last_name) return user.last_name;
  if (user?.name) return user.name;
  return "Unknown User";
}

