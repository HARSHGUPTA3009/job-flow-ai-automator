# Welcome to your Lovable project

## Project info

Full Stack Automated Cold Email System with n8n

Effortless outreach for job seekers, indie hackers, and founders — from raw leads & resumes to personalized cold emails.
✨ Overview

This project is a full-stack, intelligent automation system that:
✅ Converts messy job leads & resumes into structured data
✅ Scores resumes against job descriptions using AI
✅ Crafts personalized cold emails tailored to each company & role
✅ (Soon) Sends emails & tracks responses — all on autopilot.

Built using:

React + TailwindCSS for a sleek frontend
Node.js + Express + MongoDB for backend & data storage
Google OAuth2 for secure, passwordless login
n8n (self-hosted) for powerful automation workflows
OpenAI / Gemini for AI resume scoring & email generation
Google Sheets as a dynamic input data source
🧩 Features

🔐 Google OAuth2 Login + JWT Sessions
Secure Google login — no passwords needed
JWT-based session management
Fully ready for Gmail API authentication to send emails on behalf of users
📑 Google Sheets Integration
Upload or link a Google Sheet with your leads (Name, Role, Company, LinkedIn, etc.)
n8n pulls and cleans the data into structured JSON
🧠 Resume Scoring (ATS-Like)
Upload a resume (PDF/Docx parsed into text)
n8n + LLM process compares resume to target job roles:
Skill & keyword matching
Resume clarity & structure analysis
Relevance scoring
This is a solid workaround for early ATS screening — while exploring better free ATS APIs.
✉️ Personalized Cold Email Generator
Combines cleaned lead data + resume context + user-specified tone
Generates unique, high-converting cold emails for each role & company
Ensures high personalization without manual effort
🔜 Coming Soon
Automated sending via Gmail API
Response tracking + Google Sheet status updates
Outreach dashboard with insights (emails sent, scores, open rates, etc.)
⚙️ Tech Stack

Layer	Tech
Frontend	React (Vite) + TailwindCSS
Backend	Node.js + Express + MongoDB
Auth	Google OAuth2 + JWT
Workflows	n8n (self-hosted)
AI Models	OpenAI / Gemini via HTTP in n8n
Data Source	Google Sheets (read/write)
Resume Logic	Text extraction + prompt-based LLM scoring
🚀 How It Works

[Google Sheet of Leads]
          ⬇
       n8n Workflow
 - Cleans data
 - Prepares JSON
          ⬇
[Resume Upload]
          ⬇
       n8n Workflow
 - AI scoring vs roles
          ⬇
[Cold Email Generation]
 - Uses resume + lead data + tone
          ⬇
[Outputs tailored emails]
