import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Using Node.js runtime for production stability
export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { messages, tone = 'friendly' } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'AI capabilities are currently offline.' }, { status: 503 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Format the conversation history for context
    const conversationContext = messages.map((m: any) => `${m.sender}: ${m.text}`).join('\n');

    const prompt = `
      You are an AI Wingman for an anonymous chat app called InkHaven. 
      The users are chatting, but the conversation might have stalled or needs a spark.
      
      Here is the recent conversation history:
      ${conversationContext || '(No previous messages. This is the start of the chat.)'}
      
      Based on the history and a desired tone of "${tone}", generate 3 distinct, engaging, and highly conversational icebreakers or follow-up questions to keep the chat lively. 
      The suggestions should be short (1-2 sentences max), natural, and safe for a general audience.
      Do not include any pleasantries or conversational filler in your response, just the 3 suggestions itself.
      Return the suggestions as a JSON array of strings ONLY. For example: ["Question 1?", "Question 2?", "Question 3?"].
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse the JSON array from the response
    const jsonMatch = responseText.match(/\[.*\]/s);
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ suggestions });
    } else {
       throw new Error("Failed to parse AI response into JSON");
    }

  } catch (error) {
    console.error('Wingman Error:', error);
    return NextResponse.json({ error: 'Failed to generate wingman suggestions.' }, { status: 500 });
  }
}
