const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"

const MODEL_FALLBACK_CHAIN = [
  OPENROUTER_MODEL,
  "openai/gpt-4o-mini",
  "google/gemini-2.0-flash-exp:free",
]

export interface SummaryResult {
  summary: string
  keyPoints: string[]
  actionItems: string[]
}

export async function summarizeText(
  transcript: string
): Promise<SummaryResult> {
  const prompt = `شما یک دستیار هوشمند برای خلاصه‌سازی جلسات هستید. متن زیر را تحلیل کرده و خروجی را دقیقاً به صورت JSON زیر برگردانید (بدون متن اضافی، فقط JSON):

{
  "summary": "خلاصه جلسه",
  "keyPoints": ["نکته ۱", "نکته ۲"],
  "actionItems": ["اقدام ۱", "اقدام ۲"]
}

متن جلسه:
${transcript}`

  let lastError: Error | null = null

  for (const model of MODEL_FALLBACK_CHAIN) {
    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://goftaan.app",
          "X-Title": "Goftaan",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 2048,
        }),
        signal: AbortSignal.timeout(180_000),
      })

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) throw new Error("Empty response from AI")

      return extractJson(content)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      continue
    }
  }

  throw lastError || new Error("All AI models failed")
}

function extractJson(content: string): SummaryResult {
  // Try direct parse
  try {
    return JSON.parse(content)
  } catch {
    // Continue
  }

  // Try removing markdown fences
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim())
    } catch {
      // Continue
    }
  }

  // Try finding JSON object
  const braceMatch = content.match(/\{[\s\S]*\}/)
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0])
    } catch {
      // Continue
    }
  }

  // Fallback: return raw content as summary
  return {
    summary: content,
    keyPoints: [],
    actionItems: [],
  }
}
