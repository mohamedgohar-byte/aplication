import { GoogleGenerativeAI  } from "@google/generative-ai";
import { Article, Team } from "../types";
import { storageService } from "./storage";

let aiClient: GoogleGenerativeAI  | null = null;

const getClient = () => {
  if (!aiClient) {
    const apiKey = process.env.API_KEY || '';
    if (apiKey) {
      aiClient = new GoogleGenerativeAI ({ apiKey });
    }
  }
  return aiClient;
};

export const geminiService = {
  askAssistant: async (
    query: string,
    contextArticles: Article[],
    teams: Team[],
    history: { role: string; content: string }[] = []
  ): Promise<string> => {
    const ai = getClient();
    if (!ai) return "Error: API Key not configured.";

    // 1. Load AI Settings
    const aiSettings = storageService.getAISettings();
    
    // 2. Enforce Master Toggle
    if (!aiSettings.enabled) {
      return "AI assistance is currently disabled by the administrator.";
    }

    // 3. Filter Context by Allowed Teams
    const allowedTeamIds = new Set(aiSettings.allowedTeamIds);
    // Include articles where at least one of its assigned teams is allowed
    const allowedArticles = contextArticles.filter(a => 
      a.teamIds.some(tid => allowedTeamIds.has(tid))
    );

    // 4. Enforce Scope (Short Answer vs Full Content vs Attachments)
    const kbContext = allowedArticles
      .filter(a => a.isAvailableToAi && a.status === 'published')
      .map(a => {
        let content = `PROCESS: ${a.title}\n`;
        
        // Scope: Metadata/Summary
        if (aiSettings.scope.useFullContent) {
           content += `SUMMARY: ${a.summary}\n`;
           content += `TRIGGER: ${a.trigger}\n`;
        }

        // Scope: Short Answer
        if (aiSettings.scope.useShortAnswers) {
           content += `SHORT ANSWER: ${a.shortAnswer}\n`;
        }

        // Scope: Full Content (Steps & Outcomes)
        if (aiSettings.scope.useFullContent) {
           content += `STEPS:\n${a.processSteps.map((s, i) => `${i + 1}. ${s.title}: ${s.description}`).join('\n')}\n`;
           content += `OUTCOMES:\n${a.outcomes.map(o => `- ${o.label}: ${o.action}`).join('\n')}\n`;
           content += `TROUBLESHOOTING: ${a.troubleshooting || 'N/A'}\n`;
        }

        // Scope: Attachments Metadata
        if (aiSettings.scope.useAttachments && a.attachments.length > 0) {
           content += `ATTACHMENTS AVAILABLE: ${a.attachments.map(att => att.name).join(', ')}\n`;
        }
        
        return content + "---\n";
      })
      .slice(0, 15) // Safeguard context window
      .join('\n');

    // 5. Enforce Tone
    let toneInstruction = "Be operational and professional.";
    if (aiSettings.tone === 'direct') {
      toneInstruction = "Be extremely concise, direct, and short. Do not use filler words.";
    } else if (aiSettings.tone === 'coaching') {
      toneInstruction = "Adopt a coaching tone, explaining the 'why' behind procedures to help the agent learn.";
    }

    // 6. Enforce Strict Mode (No Hallucination)
    const strictInstruction = aiSettings.strictMode 
      ? "STRICT MODE ACTIVE: You must ONLY use the provided context. If the answer is not explicitly in the context, respond EXACTLY with: '> ⚠️ **Unknown Scenario**: This scenario is not documented. Please escalate.' Do NOT attempt to answer from general knowledge."
      : "Use the context as your primary source. You may use general professional knowledge to bridge gaps, but prioritize the SOPs.";

    const systemPrompt = `
You are the AI Assistant for Elmenus internal agents.
Your goal is to help agents resolve operational issues using the Knowledge Base.

RULES:
1. ${toneInstruction}
2. ${strictInstruction}
3. Reference the Process Name or Step Number when answering.

FORMATTING INSTRUCTIONS:
Always use Markdown formatting for structure and clarity.
Follow this template exactly:

### [Process Name or Title]
[Short context sentence summarizing the situation]

#### Steps
1. **[Step Title]**: [Step Description]
   - [Additional detail if needed]
2. **[Next Step]**...

> ⚠️ **Note**: [Any warnings or important checks]

> ✅ **Outcome**: [Final action or result]

CONTEXT (Knowledge Base):
${kbContext}

TEAMS INFO:
${teams.filter(t => allowedTeamIds.has(t.id)).map(t => `${t.name} (ID: ${t.id})`).join(', ')}
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
                { role: 'user', parts: [{ text: query }] }
            ],
            config: {
                systemInstruction: systemPrompt,
                temperature: aiSettings.strictMode ? 0.0 : 0.3, // Lower temp for strict mode
            }
        });

        // Track usage
        storageService.incrementAIUsage();

        return response.text || "I couldn't generate a response.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Sorry, I encountered an error connecting to the AI service.";
    }
  }
};