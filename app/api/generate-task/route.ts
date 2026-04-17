import Anthropic from '@anthropic-ai/sdk'

type Difficulty = 'easy' | 'medium' | 'hard'
type TaskType = 'Task 1 Academic' | 'Task 1 General' | 'Task 2'

type GenerateTaskRequest = {
  level?: string
  taskType?: TaskType
  difficulty?: Difficulty
  category?: string
}

const diffMap: Record<Difficulty, string> = {
  easy: 'Familiar everyday topics like family, hobbies, local community.',
  medium: 'Current social issues, technology, or education topics.',
  hard: 'Abstract topics: philosophy, global politics, advanced tech, economics.',
}

const structures: Record<TaskType, string[]> = {
  'Task 1 Academic': [
    'Introduction: Paraphrase what the graph shows',
    'Overview: 2 main trends (no data yet)',
    'Body 1: Key features with specific data',
    'Body 2: Compare or contrast secondary features',
  ],
  'Task 1 General': [
    'Opening: State purpose and relationship to recipient',
    'Para 1: First bullet point',
    'Para 2: Second bullet point',
    'Para 3: Third bullet point',
    'Closing: Appropriate sign-off',
  ],
  'Task 2': [
    'Introduction: Paraphrase + clear thesis',
    'Body 1: First argument + example',
    'Body 2: Second argument + example',
    'Body 3 (optional): Counter-argument',
    'Conclusion: Summarise, no new ideas',
  ],
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

    const body = (await req.json()) as GenerateTaskRequest

    const level = body.level ?? 'Intermediate'
    const task = body.taskType ?? 'Task 2'
    const diff = body.difficulty ?? 'medium'
    const cat = body.category ?? 'Technology'

    const msg = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 900,
      messages: [
        {
          role: 'user',
          content: `You are an IELTS examiner. Generate one writing task.
Level: ${level}
Task: ${task}
Category: ${cat}
Difficulty: ${diff} - ${diffMap[diff]}

Return ONLY valid JSON, no markdown, no extra text:
{
  "taskType": "${task}",
  "category": "${cat}",
  "difficulty": "${diff}",
  "question": "full question exactly as on IELTS exam",
  "visualDescription": ${task === 'Task 1 Academic' ? '"describe the hypothetical chart/graph"' : 'null'},
  "letterContext": ${task === 'Task 1 General' ? '"additional letter context"' : 'null'},
  "essayType": ${task === 'Task 2' ? '"opinion or discussion or problem-solution or advantages-disadvantages"' : 'null'},
  "structureGuide": ${JSON.stringify(structures[task])},
  "keyVocab": ["word1","word2","word3","word4","word5"],
  "tipForLevel": "one specific tip for ${level} candidate"
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
