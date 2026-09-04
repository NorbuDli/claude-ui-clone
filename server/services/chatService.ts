import * as dotenv from 'dotenv';
import { RouterEngine, ChatRequestPayload, IncomingMessage } from './aiRouter';

dotenv.config();

export type { ChatRequestPayload, IncomingMessage };

export async function handleStreamingChat(
  payload: ChatRequestPayload,
  writeChunk: (event: string, data: any) => void
): Promise<void> {
  await RouterEngine.execute(payload, writeChunk);
}
