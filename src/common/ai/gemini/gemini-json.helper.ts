export class GeminiJsonHelper {
  static parseJson<T>(value: string): T {
    const normalized = this.extractJsonCandidate(value);

    try {
      return JSON.parse(normalized) as T;
    } catch {
      throw new Error('Gemini returned invalid JSON');
    }
  }

  private static extractJsonCandidate(value: string): string {
    const trimmed = String(value || '').trim();

    if (!trimmed) {
      throw new Error('Gemini returned an empty response');
    }

    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fencedMatch?.[1]) {
      return fencedMatch[1].trim();
    }

    return trimmed;
  }
}
