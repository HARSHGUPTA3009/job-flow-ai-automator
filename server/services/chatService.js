const {
  ChatGoogleGenerativeAI,
} = require("@langchain/google-genai");
const {
  PromptTemplate,
  MessagesPlaceholder,
} = require("@langchain/core/prompts");
const { RunnablePassthrough } = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const vectorStore = require("./vectorStore");
const placementRAG = require("./placementRAG");

class ChatService {
  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: "gemini-1.5-flash",
      temperature: 0.7,
      maxOutputTokens: 1024,
    });
    this.conversationHistories = new Map(); // Store per-user conversations
  }

  // Initialize chat for user
  async initializeUserChat(userId) {
    try {
      // Create documents from user's placement data
      const documents = await placementRAG.createUserDocuments(userId);

      if (documents.length === 0) {
        console.warn("⚠️ No documents found for user");
        return false;
      }

      // Initialize vector store with user's data
      await vectorStore.initializeVectorStore(documents);

      // Store empty conversation history
      this.conversationHistories.set(userId, []);

      console.log(`✅ Chat initialized for user ${userId}`);
      return true;
    } catch (error) {
      console.error("❌ Error initializing chat:", error);
      return false;
    }
  }

  // Get relevant context from RAG
  async getContext(query) {
    const results = await vectorStore.searchSimilar(query, 5);
    return results
      .map((doc) => `Context: ${doc.content}`)
      .join("\n\n---\n\n");
  }

  // Generate response with RAG
  async generateResponse(userId, userMessage) {
    try {
      // Get conversation history
      let history = this.conversationHistories.get(userId) || [];

      // Get relevant context from RAG
      const context = await this.getContext(userMessage);

      // Create prompt with context and history
      const prompt = PromptTemplate.fromTemplate(`You are JobFlow AI Assistant, an expert in helping students with placement preparation and job application tracking.

Your knowledge base includes the user's profile, applications, and placement statistics.

Context from user's data:
{context}

Conversation History:
{chat_history}

User Question: {question}

Instructions:
1. Use the provided context to answer questions about the user's applications and placements
2. Provide specific data when available
3. Be helpful, accurate, and professional
4. If asked about something not in the context, use general placement advice
5. Keep responses concise and actionable

Answer:`);

      // Format chat history
      const chatHistory = history
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      // Create chain
      const chain = prompt
        .pipe(this.model)
        .pipe(new StringOutputParser());

      // Generate response
      const response = await chain.invoke({
        context: context,
        chat_history: chatHistory,
        question: userMessage,
      });

      // Add to conversation history
      history.push({ role: "user", content: userMessage });
      history.push({ role: "assistant", content: response });

      // Keep only last 20 messages
      if (history.length > 40) {
        history = history.slice(-40);
      }

      this.conversationHistories.set(userId, history);

      return response;
    } catch (error) {
      console.error("❌ Error generating response:", error);
      return "Sorry, I encountered an error. Please try again.";
    }
  }

  // Clear conversation
  clearConversation(userId) {
    this.conversationHistories.delete(userId);
  }
}

module.exports = new ChatService();