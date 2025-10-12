// ============================================================================
// FILE: backend/routes/chatbot.js
// Purpose: Chatbot API routes with RAG + Gemini
// ============================================================================

const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { Document } = require('langchain/document');

// ============================================================================
// CONFIGURATION
// ============================================================================

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let vectorStores = new Map(); // Per-user vector stores
let conversationHistories = new Map(); // Per-user chat histories

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create documents from user's placement data
 */
async function createPlacementDocuments(userId, User, OffCampusApplication, OnCampusApplication, CompanyDrive) {
  try {
    const user = await User.findById(userId);
    const offCampusApps = await OffCampusApplication.find({ userId });
    const onCampusApps = await OnCampusApplication.find({ userId });
    const drives = await CompanyDrive.find({});

    const documents = [];

    // User Profile Document
    if (user) {
      documents.push({
        pageContent: `User Profile:
Name: ${user.name}
College: ${user.college}
Branch: ${user.branch}
Year: ${user.year}
CGPA: ${user.cgpa}
Skills: ${user.skills.join(", ")}
Preferred Roles: ${user.preferredRoles?.join(", ") || "Not specified"}
Preferred Locations: ${user.preferredLocations?.join(", ") || "Not specified"}
LinkedIn: ${user.linkedIn || "Not provided"}
GitHub: ${user.github || "Not provided"}`,
        metadata: {
          type: "profile",
          userId: userId,
          timestamp: new Date(),
        },
      });
    }

    // Off-Campus Applications
    offCampusApps.forEach((app, idx) => {
      documents.push({
        pageContent: `Off-Campus Application #${idx + 1}:
Company: ${app.company}
Job Title: ${app.jobTitle}
Status: ${app.status}
Applied Date: ${new Date(app.appliedDate).toLocaleDateString()}
Salary: ${app.salary ? `${app.salary} ${app.currency}` : "Not specified"}
Job Link: ${app.jobLink}
Notes: ${app.notes || "None"}
Source: ${app.source}`,
        metadata: {
          type: "offcampus_app",
          company: app.company,
          status: app.status,
          appId: app._id.toString(),
        },
      });
    });

    // On-Campus Applications
    onCampusApps.forEach((app, idx) => {
      documents.push({
        pageContent: `On-Campus Application #${idx + 1}:
Company: ${app.companyName}
Role: ${app.role}
Status: ${app.status}
Applied Date: ${new Date(app.appliedDate).toLocaleDateString()}
Interview Rounds: ${app.interviewRounds || "Not scheduled"}
Offer Package: ${app.offerPackage ? `${app.offerPackage} LPA` : "Not received"}
Location: ${app.offerLocation || "Not specified"}`,
        metadata: {
          type: "oncampus_app",
          company: app.companyName,
          status: app.status,
        },
      });
    });

    // Company Drives
    drives.slice(0, 10).forEach((drive, idx) => {
      documents.push({
        pageContent: `Company Drive #${idx + 1}:
Company: ${drive.companyName}
Roles: ${drive.roles.join(", ")}
Cutoff CGPA: ${drive.cutoffCGPA}
Batch Date: ${new Date(drive.batchDate).toLocaleDateString()}
Results Date: ${new Date(drive.resultsDate).toLocaleDateString()}
Average Package: ${drive.averagePackage} LPA
Number Selected: ${drive.numberOfSelected}
Total Applied: ${drive.totalApplied}
Selection Rate: ${((drive.numberOfSelected / drive.totalApplied) * 100).toFixed(2)}%`,
        metadata: {
          type: "company_drive",
          company: drive.companyName,
        },
      });
    });

    // Analytics Summary
    const stats = calculateStats(offCampusApps, onCampusApps);
    documents.push({
      pageContent: `Placement Statistics Summary:
Total Applications: ${stats.totalApps}
Off-Campus: ${offCampusApps.length}
On-Campus: ${onCampusApps.length}
Response Rate: ${stats.responseRate.toFixed(2)}%
Interview Rate: ${stats.interviewRate.toFixed(2)}%
Offer Rate: ${stats.offerRate.toFixed(2)}%
Acceptance Rate: ${stats.acceptanceRate.toFixed(2)}%
Status Breakdown: Applied (${stats.applied}), Screening (${stats.screening}), Interview (${stats.interview}), Offers (${stats.offers}), Rejected (${stats.rejected})`,
      metadata: {
        type: "analytics",
        timestamp: new Date(),
      },
    });

    return documents;
  } catch (error) {
    console.error('❌ Error creating documents:', error);
    return [];
  }
}

/**
 * Calculate placement statistics
 */
function calculateStats(offCampusApps, onCampusApps) {
  const applied = offCampusApps.filter(a => a.status === 'applied').length;
  const screening = offCampusApps.filter(a => a.status === 'screening').length;
  const interview = offCampusApps.filter(a => a.status === 'interview').length;
  const offers = offCampusApps.filter(a => a.status === 'offer').length;
  const accepted = offCampusApps.filter(a => a.status === 'accepted').length;
  const rejected = offCampusApps.filter(a => a.status === 'rejected').length;

  const totalApps = offCampusApps.length;
  const responses = screening + interview + offers + accepted;

  return {
    totalApps,
    applied,
    screening,
    interview,
    offers,
    accepted,
    rejected,
    responseRate: totalApps > 0 ? (responses / totalApps) * 100 : 0,
    interviewRate: totalApps > 0 ? (interview + offers + accepted) / totalApps * 100 : 0,
    offerRate: totalApps > 0 ? (offers + accepted) / totalApps * 100 : 0,
    acceptanceRate: totalApps > 0 ? accepted / totalApps * 100 : 0,
  };
}

/**
 * Initialize vector store for user
 */
async function initializeVectorStore(userId, documents) {
  try {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: "models/embedding-001",
    });

    const docs = documents.map(
      doc => new Document({
        pageContent: doc.pageContent,
        metadata: doc.metadata,
      })
    );

    const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
    vectorStores.set(userId, vectorStore);

    console.log(`✅ Vector store initialized for user ${userId} with ${docs.length} documents`);
    return vectorStore;
  } catch (error) {
    console.error('❌ Error initializing vector store:', error);
    return null;
  }
}

/**
 * Search similar documents
 */
async function searchSimilar(userId, query, k = 5) {
  try {
    const vectorStore = vectorStores.get(userId);
    if (!vectorStore) {
      console.warn('⚠️ Vector store not found for user');
      return [];
    }

    const results = await vectorStore.similaritySearch(query, k);
    return results.map(doc => doc.pageContent).join('\n\n---\n\n');
  } catch (error) {
    console.error('❌ Error searching:', error);
    return '';
  }
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/chatbot/initialize
 * Initialize chatbot for authenticated user
 */
router.post('/initialize', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required'
      });
    }

    // Get models from database
    const User = require('../models/User');
    const OffCampusApplication = require('../models/OffCampusApplication');
    const OnCampusApplication = require('../models/OnCampusApplication');
    const CompanyDrive = require('../models/CompanyDrive');

    // Create documents from user data
    const documents = await createPlacementDocuments(
      userId,
      User,
      OffCampusApplication,
      OnCampusApplication,
      CompanyDrive
    );

    if (documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data found to initialize chatbot'
      });
    }

    // Initialize vector store
    const vectorStore = await initializeVectorStore(userId, documents);

    if (!vectorStore) {
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize vector store'
      });
    }

    // Initialize conversation history
    conversationHistories.set(userId, []);

    res.json({
      success: true,
      message: 'Chatbot initialized successfully',
      documentsCount: documents.length
    });
  } catch (error) {
    console.error('❌ Initialization error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/chatbot/message
 * Send message and get response with RAG
 */
router.post('/message', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'User ID and message required'
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message cannot be empty'
      });
    }

    // Get similar documents from RAG
    const context = await searchSimilar(userId, message, 5);

    // Get conversation history
    let history = conversationHistories.get(userId) || [];

    // Build chat history string
    const historyStr = history
      .slice(-8) // Last 4 exchanges
      .map(h => `${h.role}: ${h.content}`)
      .join('\n');

    // Create prompt
    const prompt = `You are JobFlow AI Assistant, an expert placement advisor helping students with job applications.

User's Placement Data:
${context || 'No specific data available'}

Recent Conversation:
${historyStr}

User: ${message}

Instructions:
1. Use the provided user data to give personalized advice
2. Reference specific applications, companies, or statistics when relevant
3. Be encouraging, professional, and helpful
4. If asked about placements, use the provided data
5. Provide actionable advice
6. Keep responses concise (2-3 sentences max)

Response:`;

    // Generate response using Gemini
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Add to conversation history
    history.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });
    history.push({
      role: 'assistant',
      content: responseText,
      timestamp: new Date(),
    });

    // Keep only last 20 messages (10 exchanges)
    if (history.length > 20) {
      history = history.slice(-20);
    }

    conversationHistories.set(userId, history);

    res.json({
      success: true,
      message: responseText,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error generating response',
    });
  }
});

/**
 * POST /api/chatbot/clear
 * Clear conversation history
 */
router.post('/clear', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required'
      });
    }

    conversationHistories.delete(userId);

    res.json({
      success: true,
      message: 'Conversation cleared'
    });
  } catch (error) {
    console.error('❌ Clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/chatbot/status
 * Get chatbot status
 */
router.get('/status', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required'
      });
    }

    const isInitialized = vectorStores.has(userId);
    const historyLength = conversationHistories.get(userId)?.length || 0;

    res.json({
      success: true,
      initialized: isInitialized,
      messagesCount: historyLength,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;