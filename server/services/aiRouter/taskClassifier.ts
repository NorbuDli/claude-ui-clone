import { IncomingMessage, TaskType } from './types';

export class TaskClassifier {
  /**
   * Deterministically classifies the user request into a specialized task type.
   */
  public static classify(messages: IncomingMessage[], systemPrompt?: string): TaskType {
    // 1. VISION: Check if any message contains image attachments
    for (const msg of messages) {
      if (msg.attachments && msg.attachments.length > 0) {
        const hasImage = msg.attachments.some(
          (att) =>
            (att.dataUrl && att.dataUrl.startsWith('data:image/')) ||
            (att.type && att.type.startsWith('image/')) ||
            /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(att.name || '')
        );
        if (hasImage) {
          return 'VISION';
        }
      }
    }

    // Extract the latest user query
    const userMessages = messages.filter((m) => m.role === 'user');
    const lastUserMsg = userMessages[userMessages.length - 1];
    const text = (lastUserMsg?.content || '').toLowerCase().trim();
    const fullPrompt = `${systemPrompt || ''}\n${text}`.toLowerCase();

    if (!text) {
      return 'GENERAL_CHAT';
    }

    // 2. IMAGE GENERATION
    const imageGenPatterns = [
      /\b(generate|create|render|draw|make)\b.*\b(image|picture|photo|illustration|drawing|artwork|logo)\b/i,
      /\b(text-to-image|image of a|picture of a|drawing of)\b/i
    ];
    if (imageGenPatterns.some((pattern) => pattern.test(text))) {
      return 'IMAGE_GENERATION';
    }

    // 3. SPEECH / AUDIO
    if (/\b(transcribe|speech to text|stt|voice recording)\b/i.test(text)) {
      return 'SPEECH_TO_TEXT';
    }
    if (/\b(text to speech|tts|read this aloud|speak this)\b/i.test(text)) {
      return 'TEXT_TO_SPEECH';
    }

    // 4. SUMMARIZATION
    if (
      /\b(summarize|summarise|summary|tl;?dr|brief overview|bullet points of)\b/i.test(text) &&
      text.length < 200 &&
      messages.length > 2
    ) {
      return 'SUMMARIZATION';
    }

    // 5. CODING: Check code workspace context, code fences, or programming patterns
    const isCodeWorkspaceContext =
      fullPrompt.includes('code workspace') ||
      fullPrompt.includes('active file') ||
      fullPrompt.includes('project files:') ||
      fullPrompt.includes('claude coding assistant');

    const hasCodeFences = text.includes('```') || text.includes('`');

    const codingKeywords = [
      /\b(function|def|const|let|var|class|interface|type|import|export|from|return)\b/,
      /\b(react|typescript|javascript|python|html|css|tailwind|sql|postgres|mongodb|docker|git)\b/,
      /\b(bug|syntax error|runtime error|null pointer|undefined is not|exception|stack trace|fix this error)\b/,
      /\b(refactor|component|hook|endpoint|middleware|api route|npm|yarn|pnpm|cargo|pip)\b/,
      /\b(compile|build|test case|unit test|jest|vite|webpack)\b/
    ];

    const hasCodingKeywords = codingKeywords.some((regex) => regex.test(text));

    if (isCodeWorkspaceContext || (hasCodeFences && hasCodingKeywords) || hasCodingKeywords) {
      return 'CODING';
    }

    // 6. DEEP REASONING / MATHEMATICS
    const reasoningKeywords = [
      /\b(prove that|mathematical proof|theorem|lemma|calculus|derivative|integral)\b/,
      /\b(time complexity|space complexity|big o|algorithm analysis|dynamic programming)\b/,
      /\b(logic puzzle|formal logic|deductive reasoning|syllogism|step-by-step reasoning)\b/,
      /\b(solve equation|system of equations|matrix multiplication|eigenvalue)\b/
    ];

    if (reasoningKeywords.some((regex) => regex.test(text))) {
      return 'REASONING';
    }

    // 7. CREATIVE WRITING
    if (/\b(write a poem|write an essay|draft a story|blog post|copywriting|press release)\b/i.test(text)) {
      return 'WRITING';
    }

    // 8. Default
    return 'GENERAL_CHAT';
  }
}
