const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { Document } = require("langchain/document");

class VectorStoreService {
  constructor() {
    this.vectorStore = null;
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: "models/embedding-001",
    });
  }

  // Initialize vector store from documents
  async initializeVectorStore(documents) {
    try {
      const docs = documents.map(
        (doc) =>
          new Document({
            pageContent: doc.content,
            metadata: doc.metadata || {},
          })
      );

      this.vectorStore = await MemoryVectorStore.fromDocuments(
        docs,
        this.embeddings
      );
      console.log(`✅ Vector store initialized with ${docs.length} documents`);
      return this.vectorStore;
    } catch (error) {
      console.error("❌ Error initializing vector store:", error);
      throw error;
    }
  }

  // Add new documents to vector store
  async addDocuments(newDocuments) {
    try {
      if (!this.vectorStore) {
        await this.initializeVectorStore(newDocuments);
      } else {
        const docs = newDocuments.map(
          (doc) =>
            new Document({
              pageContent: doc.content,
              metadata: doc.metadata || {},
            })
        );
        await this.vectorStore.addDocuments(docs);
      }
      console.log(`✅ Added ${newDocuments.length} documents to vector store`);
    } catch (error) {
      console.error("❌ Error adding documents:", error);
      throw error;
    }
  }

  // Search similar documents
  async searchSimilar(query, k = 5) {
    try {
      if (!this.vectorStore) {
        console.warn("⚠️ Vector store not initialized");
        return [];
      }

      const results = await this.vectorStore.similaritySearch(query, k);
      return results.map((doc) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        score: doc.similarity,
      }));
    } catch (error) {
      console.error("❌ Error searching vector store:", error);
      return [];
    }
  }

  // Clear vector store
  async clear() {
    this.vectorStore = null;
  }
}

module.exports = new VectorStoreService();