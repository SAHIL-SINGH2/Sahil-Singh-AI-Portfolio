import { jsPDF } from 'jspdf';
import { sahilProfile } from '../data/candidateData';

export function generateResumePDF(customProfile?: any): void {
  const p = customProfile || sahilProfile;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 40;
  const leftMargin = 45;
  const rightMargin = pageWidth - 45;
  const contentWidth = rightMargin - leftMargin;

  // Header - Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(20, 30, 55); // Dark Slate
  doc.text(p.name, leftMargin, y);

  y += 18;

  // Title / Headline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(14, 116, 144); // Cyan Accent
  doc.text(p.title, leftMargin, y);

  y += 16;

  // Contact Info Line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 80, 95);
  const contactText = `${p.email}  •  ${p.phone}  •  ${p.location}`;
  doc.text(contactText, leftMargin, y);

  y += 12;
  const linksText = `GitHub: ${p.github || 'github.com'}  •  LinkedIn: ${p.linkedin || 'linkedin.com'}`;
  doc.text(linksText, leftMargin, y);

  y += 16;

  // Divider Line
  doc.setDrawColor(200, 210, 225);
  doc.setLineWidth(1);
  doc.line(leftMargin, y, rightMargin, y);

  y += 20;

  // Helper function for Section Headings
  const addSectionHeading = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20, 30, 55);
    doc.text(title.toUpperCase(), leftMargin, y);
    y += 4;
    doc.setDrawColor(14, 116, 144);
    doc.setLineWidth(1.5);
    doc.line(leftMargin, y, leftMargin + 120, y);
    y += 16;
  };

  // 1. PROFESSIONAL SUMMARY
  if (p.bio) {
    addSectionHeading('Professional Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 50, 65);
    const summaryLines = doc.splitTextToSize(p.bio, contentWidth);
    doc.text(summaryLines, leftMargin, y);
    y += summaryLines.length * 13 + 12;
  }

  // 2. TECHNICAL SKILLS
  if (p.skills) {
    addSectionHeading('Technical Skills');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 40, 60);

    const skillsData = [
      { label: 'Languages', val: (p.skills.languages || []).join(', ') },
      { label: 'Frameworks & Web', val: (p.skills.frameworks || []).join(', ') },
      { label: 'AI / ML & LLMs', val: (p.skills.aiMl || []).join(', ') },
      { label: 'Databases', val: (p.skills.databases || []).join(', ') },
      { label: 'Tools & DevOps', val: (p.skills.tools || []).join(', ') },
    ];

    skillsData.forEach((s) => {
      if (!s.val) return;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(14, 116, 144);
      doc.text(`• ${s.label}:`, leftMargin, y);

      const labelWidth = doc.getTextWidth(`• ${s.label}: `);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 50, 65);

      const valLines = doc.splitTextToSize(s.val, contentWidth - labelWidth);
      doc.text(valLines[0], leftMargin + labelWidth, y);

      if (valLines.length > 1) {
        for (let i = 1; i < valLines.length; i++) {
          y += 12;
          doc.text(valLines[i], leftMargin + labelWidth, y);
        }
      }
      y += 14;
    });

    y += 8;
  }

  // 3. WORK EXPERIENCE (Only render if experiences exist and are not empty)
  if (Array.isArray(p.experiences) && p.experiences.length > 0) {
    addSectionHeading('Work Experience');
    p.experiences.forEach((exp: any) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(20, 30, 55);
      doc.text(`${exp.role || 'Role'}  —  ${exp.company || 'Company'}`, leftMargin, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 110, 125);
      doc.text(`${exp.duration || ''} | ${exp.location || ''}`, rightMargin, y, { align: 'right' });

      y += 13;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 60, 75);
      const expLines = doc.splitTextToSize(exp.description || '', contentWidth);
      doc.text(expLines, leftMargin, y);
      y += expLines.length * 12 + 4;

      if (Array.isArray(exp.skillsUsed) && exp.skillsUsed.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(14, 116, 144);
        doc.text(`Key Technologies: ${exp.skillsUsed.join(', ')}`, leftMargin, y);
        y += 16;
      }
    });

    y += 4;
  }

  // 4. FEATURED PROJECTS
  if (Array.isArray(p.projects) && p.projects.length > 0) {
    addSectionHeading('Featured AI & Full-Stack Projects');
    p.projects.forEach((proj: any) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(20, 30, 55);
      doc.text(proj.title || 'Project', leftMargin, y);

      y += 13;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 60, 75);
      const projDescLines = doc.splitTextToSize(proj.description || '', contentWidth);
      doc.text(projDescLines, leftMargin, y);
      y += projDescLines.length * 12 + 3;

      if (Array.isArray(proj.techStack) && proj.techStack.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(14, 116, 144);
        doc.text(`Tech Stack: ${proj.techStack.join(', ')}`, leftMargin, y);
        y += 15;
      }
    });

    y += 4;
  }

  // 5. EDUCATION (Only render if education exists and is not empty)
  if (Array.isArray(p.education) && p.education.length > 0) {
    addSectionHeading('Education');
    p.education.forEach((edu: any) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(20, 30, 55);
      doc.text(`${edu.degree || 'Degree'}${edu.field ? ` in ${edu.field}` : ''}`, leftMargin, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 110, 125);
      doc.text(`${edu.duration || ''} ${edu.cgpa ? `| CGPA ${edu.cgpa}` : ''}`, rightMargin, y, { align: 'right' });

      y += 13;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 60, 75);
      doc.text(edu.institution || '', leftMargin, y);
      y += 14;
    });
  }

  // Save the PDF document directly to user's browser with candidate name
  const fileName = `${(p.name || 'Candidate').replace(/\s+/g, '_')}_Resume.pdf`;
  doc.save(fileName);
}
