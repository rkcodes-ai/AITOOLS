export const chunkingService = {
  /**
   * Deterministically chunk extracted document pages with overlap and page preservation
   */
  chunkDocument({ pages, documentId, userId, targetChunkSize = 600, overlap = 100 }) {
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return [];
    }

    const chunks = [];
    let globalCharOffset = 0;
    let chunkIndex = 0;

    for (const page of pages) {
      const pageNum = page.pageNumber || 1;
      const pageText = (page.text || '').trim();

      if (!pageText) {
        continue;
      }

      // If page text is within target chunk size, create a single page chunk
      if (pageText.length <= targetChunkSize) {
        chunks.push({
          documentId,
          userId,
          chunkIndex: chunkIndex++,
          text: pageText,
          pageStart: pageNum,
          pageEnd: pageNum,
          characterStart: globalCharOffset,
          characterEnd: globalCharOffset + pageText.length,
          tokenEstimate: Math.max(1, Math.ceil(pageText.length / 4)),
          embeddingStatus: 'pending',
        });
        globalCharOffset += pageText.length + 1;
        continue;
      }

      // Sliding window chunking with boundary awareness
      let start = 0;
      while (start < pageText.length) {
        let end = start + targetChunkSize;

        // If not at the end of page, try to split at a sentence or newline boundary
        if (end < pageText.length) {
          const boundarySearch = pageText.slice(start + Math.floor(targetChunkSize * 0.7), end + 50);
          const sentenceBreak = boundarySearch.search(/[.\n!?]\s/);
          if (sentenceBreak !== -1) {
            end = start + Math.floor(targetChunkSize * 0.7) + sentenceBreak + 1;
          }
        } else {
          end = pageText.length;
        }

        const chunkText = pageText.slice(start, end).trim();

        if (chunkText.length > 20) {
          chunks.push({
            documentId,
            userId,
            chunkIndex: chunkIndex++,
            text: chunkText,
            pageStart: pageNum,
            pageEnd: pageNum,
            characterStart: globalCharOffset + start,
            characterEnd: globalCharOffset + end,
            tokenEstimate: Math.max(1, Math.ceil(chunkText.length / 4)),
            embeddingStatus: 'pending',
          });
        }

        if (end >= pageText.length) {
          break;
        }

        start = Math.max(start + 1, end - overlap);
      }

      globalCharOffset += pageText.length + 1;
    }

    return chunks;
  },
};
