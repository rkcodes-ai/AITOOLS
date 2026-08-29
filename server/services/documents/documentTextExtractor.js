import { createRequire } from 'module';
import { AppError } from '../../utils/errors.js';

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');

export class ExtractionError extends AppError {
  constructor(message, code = 'EXTRACTION_ERROR') {
    super(message, 422, code);
    this.name = 'ExtractionError';
  }
}

export const documentTextExtractor = {
  /**
   * Extract text and page structures from document buffer based on MIME type
   */
  async extract({ buffer, mimeType, originalFilename }) {
    if (!buffer || buffer.length === 0) {
      throw new ExtractionError('Cannot extract text from an empty file buffer.', 'EMPTY_DOCUMENT');
    }

    if (mimeType === 'text/plain') {
      return this._extractPlainText(buffer, originalFilename);
    }

    if (mimeType === 'application/pdf') {
      return this._extractPdf(buffer, originalFilename);
    }

    throw new ExtractionError(
      `Unsupported document MIME type '${mimeType}'. Only PDF and TXT documents are supported.`,
      'UNSUPPORTED_DOCUMENT_TYPE'
    );
  },

  _extractPlainText(buffer, originalFilename) {
    const rawText = buffer.toString('utf-8').replace(/\0/g, '').trim();

    if (!rawText || rawText.length === 0) {
      throw new ExtractionError('Text document is empty and contains no readable content.', 'EMPTY_DOCUMENT');
    }

    return {
      text: rawText,
      pageCount: 1,
      characterCount: rawText.length,
      pages: [
        {
          pageNumber: 1,
          text: rawText,
          characterCount: rawText.length,
        },
      ],
      metadata: {
        filename: originalFilename,
        format: 'text/plain',
      },
    };
  },

  async _extractPdf(buffer, originalFilename) {
    try {
      let fullText = '';
      let pageCount = 1;
      let pages = [];

      if (pdfParseModule.PDFParse) {
        const parser = new pdfParseModule.PDFParse({ data: buffer });
        try {
          const textResult = await parser.getText();
          pageCount = textResult.total || (textResult.pages ? textResult.pages.length : 1);
          fullText = (textResult.text || '').replace(/\0/g, '').trim();

          if (textResult.pages && textResult.pages.length > 0) {
            pages = textResult.pages.map((p) => {
              const pText = (p.text || '').replace(/\0/g, '').trim();
              return {
                pageNumber: p.num || 1,
                text: pText,
                characterCount: pText.length,
              };
            });
          }
        } finally {
          await parser.destroy().catch(() => {});
        }
      } else if (typeof pdfParseModule === 'function') {
        const data = await pdfParseModule(buffer);
        fullText = (data.text || '').replace(/\0/g, '').trim();
        pageCount = data.numpages || 1;
      } else if (typeof pdfParseModule.default === 'function') {
        const data = await pdfParseModule.default(buffer);
        fullText = (data.text || '').replace(/\0/g, '').trim();
        pageCount = data.numpages || 1;
      }

      if (!fullText || fullText.length < 5) {
        throw new ExtractionError(
          'Document contains no extractable text. Scanned PDFs without OCR are not supported.',
          'DOCUMENT_CONTAINS_NO_EXTRACTABLE_TEXT'
        );
      }

      if (pages.length === 0) {
        pages = [
          {
            pageNumber: 1,
            text: fullText,
            characterCount: fullText.length,
          },
        ];
      }

      return {
        text: fullText,
        pageCount,
        characterCount: fullText.length,
        pages,
        metadata: {
          filename: originalFilename,
          format: 'application/pdf',
        },
      };
    } catch (err) {
      if (err instanceof ExtractionError) throw err;
      throw new ExtractionError(
        `Failed to parse PDF document: ${err.message}`,
        'PDF_PARSE_ERROR'
      );
    }
  },
};
