import Anthropic from '@anthropic-ai/sdk'

type TaskType = 'Task 1 Academic' | 'Task 1 General' | 'Task 2'

type ScoreEssayRequest = {
  essay?: string
  topic?: string
  taskType?: TaskType
  level?: string
  timeSpent?: number
  wordCount?: number
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim()

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed
  }

  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')

  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.slice(start, end + 1)
  }

  throw new Error('Model did not return a valid JSON object')
}

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'Missing ANTHROPIC_API_KEY environment variable' },
        { status: 500 }
      )
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const body = (await req.json()) as ScoreEssayRequest

    const essay = body.essay?.trim()
    if (!essay) {
      return Response.json({ error: 'Essay is required' }, { status: 400 })
    }

    const topic = body.topic ?? 'General IELTS topic'
    const taskType = body.taskType ?? 'Task 2'
    const level = body.level ?? 'Intermediate'
    const timeSpentMinutes = body.timeSpent
      ? `${Math.round(body.timeSpent / 60)} minutes`
      : 'unknown'
    const wordCount = body.wordCount ?? essay.split(/\s+/).filter(Boolean).length

    const msg = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `You are a certified IELTS examiner. Score this essay strictly.
Level: ${level}
Task: ${taskType}
Time spent: ${timeSpentMinutes}
Word count: ${wordCount}
Topic: ${topic}

Essay:
"""
${essay}
"""

Return ONLY valid JSON, no markdown:
{
  "overallBand": 6.5,
  "taskAchievement": 6,
  "coherenceCohesion": 7,
  "lexicalResource": 6,
  "grammaticalRange": 6,
  "annotatedEssay": "full essay HTML - wrap each error exactly like this: <span style='color:#dc2626;text-decoration:underline wavy #dc2626;cursor:help' title='Fix: corrected version | Why: brief reason'>wrong text</span>",
  "errors": [
    {"type": "grammar", "original": "wrong phrase", "correction": "correct version", "explanation": "why it is wrong"}
  ],
  "vocabAlternatives": [
    {"original": "weak word", "level": "Band 5", "alternatives": [
      {"word": "better word", "level": "Band 6", "example": "example sentence using it"},
      {"word": "advanced word", "level": "Band 7", "example": "example sentence using it"}
    ]}
  ],
  "sentenceImprovements": [
    {"original": "original sentence", "improved": "better version", "technique": "e.g. relative clause", "reason": "why better"}
  ],
  "modelParagraph": "one model body paragraph at ${level} for this topic",
  "criteriaFeedback": {
    "taskAchievement": "2-3 specific sentences",
    "coherenceCohesion": "2-3 specific sentences",
    "lexicalResource": "2-3 specific sentences",
    "grammaticalRange": "2-3 specific sentences"
  },
  "strengths": ["strength 1", "strength 2"],
  "priorities": ["fix this first", "fix this second", "fix this third"],
  "generalTips": "3-4 sentences of personalised advice",
  "nextStepTopic": "one suggested follow-up practice"
}`,
        },
      ],
    })

    const firstTextBlock = msg.content.find((block) => block.type === 'text')
    if (!firstTextBlock || firstTextBlock.type !== 'text') {
      throw new Error('Model response did not contain text content')
    }

    const parsed = JSON.parse(extractJsonObject(firstTextBlock.text))
    return Response.json(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error'
    console.error(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
