import PDFDocument from 'pdfkit';
import { put } from '@vercel/blob';

export interface TravelLetterData {
  studentName: string;
  studentId: string;
  sport: string;
  travelDates: {
    start: string;
    end: string;
  };
  destination: string;
  event: string;
  courses: Array<{
    code: string;
    name: string;
    instructor: string;
    meetingTimes?: string;
  }>;
  advisor?: {
    name: string;
    title: string;
    phone?: string;
    email?: string;
  };
  generatedBy?: string;
}

export interface TravelLetterResult {
  success: boolean;
  url?: string;
  error?: string;
  pdfBuffer?: Buffer;
}

/**
 * Travel Letter Generator Service
 * Creates official travel letters for student-athletes
 */
export class TravelLetterGenerator {
  /**
   * Generate a travel letter PDF
   */
  async generateLetter(data: TravelLetterData): Promise<TravelLetterResult> {
    try {
      const pdfBuffer = await this.createPDF(data);

      // Upload to Vercel Blob storage
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const filename = `travel-letter-${data.studentId}-${Date.now()}.pdf`;
        const blob = await put(filename, pdfBuffer, {
          access: 'public',
          contentType: 'application/pdf',
        });

        return {
          success: true,
          url: blob.url,
          pdfBuffer,
        };
      }

      // If no blob storage, return buffer only
      return {
        success: true,
        pdfBuffer,
      };
    } catch (error) {
      console.error('Travel letter generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate travel letter',
      };
    }
  }

  /**
   * Create PDF document
   */
  private createPDF(data: TravelLetterData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: {
            top: 72,
            bottom: 72,
            left: 72,
            right: 72,
          },
        });

        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header - University letterhead
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('ACADEMIC ATHLETICS HUB', { align: 'center' });

        doc
          .fontSize(10)
          .font('Helvetica')
          .text('Student-Athlete Academic Services', { align: 'center' })
          .moveDown(0.5);

        doc
          .moveTo(72, doc.y)
          .lineTo(540, doc.y)
          .stroke()
          .moveDown(2);

        // Title
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .text('OFFICIAL TRAVEL LETTER', { align: 'center' })
          .moveDown(1.5);

        // Date
        const currentDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Date: ${currentDate}`, { align: 'right' })
          .moveDown(1.5);

        // Salutation
        doc
          .fontSize(12)
          .text('To Whom It May Concern:')
          .moveDown(1);

        // Body paragraph 1
        const startDate = new Date(data.travelDates.start).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const endDate = new Date(data.travelDates.end).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        doc
          .font('Helvetica')
          .text(
            `This letter is to inform you that ${data.studentName} (Student ID: ${data.studentId}) ` +
            `is a student-athlete competing in ${data.sport} and will be absent from class due to ` +
            `official athletic travel.`,
            { align: 'justify' }
          )
          .moveDown(1);

        // Travel details
        doc
          .font('Helvetica-Bold')
          .text('Travel Details:')
          .moveDown(0.5);

        doc
          .font('Helvetica')
          .text(`Event: ${data.event}`)
          .text(`Destination: ${data.destination}`)
          .text(`Departure: ${startDate}`)
          .text(`Return: ${endDate}`)
          .moveDown(1);

        // Affected courses
        doc
          .font('Helvetica-Bold')
          .text('Affected Courses:')
          .moveDown(0.5);

        data.courses.forEach((course) => {
          doc
            .font('Helvetica')
            .text(`• ${course.code} - ${course.name}`)
            .font('Helvetica')
            .text(`  Instructor: ${course.instructor}`, { indent: 20 });

          if (course.meetingTimes) {
            doc.text(`  Meeting Times: ${course.meetingTimes}`, { indent: 20 });
          }
          doc.moveDown(0.5);
        });

        doc.moveDown(0.5);

        // Body paragraph 2
        doc
          .font('Helvetica')
          .text(
            `${data.studentName} is expected to make arrangements with instructors to complete ` +
            `all missed coursework and examinations. The student-athlete is responsible for ` +
            `communicating with faculty prior to departure and upon return.`,
            { align: 'justify' }
          )
          .moveDown(1);

        // Body paragraph 3
        doc
          .text(
            'Please contact our office if you have any questions or concerns regarding this absence.',
            { align: 'justify' }
          )
          .moveDown(1.5);

        // Closing
        doc
          .text('Sincerely,')
          .moveDown(3);

        // Signature section
        if (data.advisor) {
          doc
            .moveTo(72, doc.y)
            .lineTo(300, doc.y)
            .stroke()
            .moveDown(0.3);

          doc
            .font('Helvetica-Bold')
            .text(data.advisor.name)
            .font('Helvetica')
            .text(data.advisor.title);

          if (data.advisor.phone) {
            doc.text(`Phone: ${data.advisor.phone}`);
          }

          if (data.advisor.email) {
            doc.text(`Email: ${data.advisor.email}`);
          }
        } else {
          doc
            .moveTo(72, doc.y)
            .lineTo(300, doc.y)
            .stroke()
            .moveDown(0.3);

          doc
            .font('Helvetica-Bold')
            .text('Academic Athletics Hub')
            .font('Helvetica')
            .text('Student-Athlete Academic Services');
        }

        // Footer
        const footerY = 720; // Near bottom of page
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(
            'This is an official document verifying athletic travel for NCAA compliance purposes.',
            72,
            footerY,
            { align: 'center', width: 468 }
          );

        if (data.generatedBy) {
          doc
            .fontSize(7)
            .text(
              `Generated by: ${data.generatedBy} on ${currentDate}`,
              72,
              footerY + 15,
              { align: 'center', width: 468 }
            );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate multiple travel letters
   */
  async generateBulkLetters(
    letters: TravelLetterData[]
  ): Promise<TravelLetterResult[]> {
    const results: TravelLetterResult[] = [];

    for (const letterData of letters) {
      const result = await this.generateLetter(letterData);
      results.push(result);

      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Generate preview (without saving to blob)
   */
  async generatePreview(data: TravelLetterData): Promise<TravelLetterResult> {
    try {
      const pdfBuffer = await this.createPDF(data);

      return {
        success: true,
        pdfBuffer,
      };
    } catch (error) {
      console.error('Travel letter preview error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate preview',
      };
    }
  }
}

export const travelLetterGenerator = new TravelLetterGenerator();
