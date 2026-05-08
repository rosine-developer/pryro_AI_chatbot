import { KnowledgeEntry, MatchResult } from '../models/types';
import { logger } from '../utils/logger';

export class KeywordMatcherService {
  /**
   * Normalize text for matching (lowercase, remove punctuation)
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .trim();
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return this.normalizeText(text)
      .split(/\s+/)
      .filter((word) => word.length > 0);
  }

  /**
   * Calculate match score for a knowledge entry
   */
  private calculateMatchScore(
    messageTokens: string[],
    entry: KnowledgeEntry
  ): { score: number; matchedKeywords: string[] } {
    const normalizedKeywords = entry.keywords.map((k) => this.normalizeText(k));
    const matchedKeywords: string[] = [];

    // Count how many keywords match
    for (const keyword of normalizedKeywords) {
      const keywordTokens = this.tokenize(keyword);
      const allTokensMatch = keywordTokens.every((token) => messageTokens.includes(token));

      if (allTokensMatch) {
        matchedKeywords.push(keyword);
      }
    }

    if (matchedKeywords.length === 0) {
      return { score: 0, matchedKeywords: [] };
    }

    // Calculate score: (matched keywords / total keywords) * priority
    const matchRatio = matchedKeywords.length / entry.keywords.length;
    const score = matchRatio * entry.priority;

    return { score, matchedKeywords };
  }

  /**
   * Match user message against knowledge base entries
   */
  match(message: string, knowledgeBase: KnowledgeEntry[]): MatchResult | null {
    try {
      const messageTokens = this.tokenize(message);

      if (messageTokens.length === 0) {
        return null;
      }

      let bestMatch: MatchResult | null = null;
      let bestScore = 0;

      // Find the best matching entry
      for (const entry of knowledgeBase) {
        if (!entry.isActive) continue;

        const { score, matchedKeywords } = this.calculateMatchScore(messageTokens, entry);

        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            entry,
            matchedKeywords,
            matchScore: score,
          };
        }
      }

      // Only return match if score is above threshold
      const MATCH_THRESHOLD = 0.3;
      if (bestMatch && bestScore >= MATCH_THRESHOLD) {
        logger.info('Keyword match found', {
          entryId: bestMatch.entry.id,
          matchScore: bestMatch.matchScore,
          matchedKeywords: bestMatch.matchedKeywords,
        });
        return bestMatch;
      }

      logger.debug('No keyword match found', {
        message: message.substring(0, 100),
        bestScore,
      });

      return null;
    } catch (error) {
      logger.error('Error in keyword matching', { error, message });
      return null;
    }
  }

  /**
   * Test keyword pattern against a message
   */
  testPattern(message: string, keywords: string[]): {
    matches: boolean;
    matchedKeywords: string[];
    score: number;
  } {
    const messageTokens = this.tokenize(message);
    const normalizedKeywords = keywords.map((k) => this.normalizeText(k));
    const matchedKeywords: string[] = [];

    for (const keyword of normalizedKeywords) {
      const keywordTokens = this.tokenize(keyword);
      const allTokensMatch = keywordTokens.every((token) => messageTokens.includes(token));

      if (allTokensMatch) {
        matchedKeywords.push(keyword);
      }
    }

    const matchRatio = matchedKeywords.length / keywords.length;

    return {
      matches: matchedKeywords.length > 0,
      matchedKeywords,
      score: matchRatio,
    };
  }

  /**
   * Get match explanation (for debugging/testing)
   */
  explainMatch(message: string, entry: KnowledgeEntry): string {
    const messageTokens = this.tokenize(message);
    const { score, matchedKeywords } = this.calculateMatchScore(messageTokens, entry);

    return `
Message tokens: ${messageTokens.join(', ')}
Entry keywords: ${entry.keywords.join(', ')}
Matched keywords: ${matchedKeywords.join(', ')}
Match score: ${score.toFixed(2)}
Priority: ${entry.priority}
    `.trim();
  }
}

export const keywordMatcherService = new KeywordMatcherService();
