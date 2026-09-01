export const config = {
  runtime: 'edge',
};

const CLIENT_MODELS = [
  {
    id: 'fable-5',
    displayName: 'Fable 5',
    description: 'For your toughest challenges',
    speed: 'Deep',
    reasoning: 'Maximum',
    isPro: true,
    isFable: true,
    requiresUpgrade: true,
    supportsThinking: true
  },
  {
    id: 'opus-5',
    displayName: 'Opus 5',
    description: 'For complex tasks',
    speed: 'Deep',
    reasoning: 'Advanced',
    isPro: true,
    requiresUpgrade: false,
    supportsThinking: true
  },
  {
    id: 'sonnet-5',
    displayName: 'Sonnet 5',
    description: 'Most efficient for everyday tasks',
    speed: 'Fast',
    reasoning: 'Balanced',
    supportsThinking: true
  },
  {
    id: 'haiku-4.5',
    displayName: 'Haiku 4.5',
    description: 'Fastest for quick answers',
    speed: 'Ultra-Fast',
    reasoning: 'Light',
    supportsThinking: false
  }
];

export default function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  return new Response(JSON.stringify({ profiles: CLIENT_MODELS }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
