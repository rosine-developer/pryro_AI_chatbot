# 🤖 AI Training & Machine Learning Guide

## Overview

Your AI chatbot now has **intelligent learning capabilities** that combine:
- ✅ **Company-specific knowledge** (trained on your data)
- ✅ **External general knowledge** (when appropriate)
- ✅ **Continuous learning** (improves over time)

---

## 🎯 How It Works

### **3-Tier Response System**

```
User Question
     ↓
┌────────────────────────────────────┐
│ 1. Company Knowledge Base (First) │
│    - Accounts, policies, services  │
│    - Fast, accurate, company-only  │
└────────────────────────────────────┘
     ↓ (if no match)
┌────────────────────────────────────┐
│ 2. AI with External Knowledge      │
│    - Work-related general help     │
│    - "How do I use Excel?"         │
│    - "Project management tips"     │
└────────────────────────────────────┘
     ↓ (if inappropriate)
┌────────────────────────────────────┐
│ 3. Polite Decline                  │
│    - Personal/entertainment        │
│    - Redirect to support           │
└────────────────────────────────────┘
```

---

## 📚 What the AI Can Do

### ✅ **WILL Answer:**

#### **Company-Specific (Priority 1)**
- "How do I reset my password?"
- "What are your office hours?"
- "What services do you offer?"
- "Company policies on X"

#### **Work-Related General Knowledge (Priority 2)**
- "How do I create a pivot table in Excel?"
- "What's a good project management methodology?"
- "How do I write a professional email?"
- "Tips for effective presentations"

### ❌ **Will Politely Decline:**
- Personal advice (health, relationships, finance)
- Entertainment (jokes, games, stories)
- Off-topic questions (weather, news, sports)
- Non-work-related topics

---

## 🧠 Machine Learning Features

### **1. Automatic Response Logging**

Every AI response is logged with:
- Question asked
- Response given
- Confidence score (0-1)
- Source (KEYWORD, AI_API, FALLBACK)
- Timestamp

**Purpose:** Build training dataset over time

---

### **2. Admin Feedback System**

Admins can rate responses:
- ⭐⭐⭐ **Excellent** - Perfect answer, add to knowledge base
- ⭐⭐ **Good** - Acceptable answer
- ⭐ **Bad** - Incorrect or inappropriate

**API Endpoint:**
```bash
POST /api/admin/training/feedback
{
  "messageId": "uuid",
  "sessionId": "uuid",
  "userQuestion": "How do I...",
  "aiResponse": "To do that...",
  "rating": "excellent",
  "feedback": "Optional notes"
}
```

---

### **3. Training Analytics**

View AI performance metrics:

**API Endpoint:**
```bash
GET /api/admin/training/analytics?days=30
```

**Returns:**
```json
{
  "totalResponses": 1250,
  "averageConfidence": 0.78,
  "sourceBreakdown": {
    "KEYWORD": 450,
    "AI_API": 650,
    "FALLBACK": 150
  },
  "topQuestions": [
    { "question": "How do I reset password", "count": 45 },
    { "question": "What are office hours", "count": 32 }
  ],
  "feedbackSummary": {
    "excellent": 120,
    "good": 85,
    "bad": 15
  }
}
```

---

### **4. Response Review Queue**

Get low-confidence responses that need review:

**API Endpoint:**
```bash
GET /api/admin/training/review?limit=50
```

**Returns:**
```json
{
  "responses": [
    {
      "messageId": "uuid",
      "question": "User question",
      "response": "AI response",
      "confidence": 0.45,
      "source": "AI_API",
      "timestamp": "2026-05-07T..."
    }
  ]
}
```

**Use Case:** Review and improve low-confidence responses

---

### **5. Knowledge Base Suggestions**

AI suggests new knowledge base entries based on successful responses:

**API Endpoint:**
```bash
GET /api/admin/training/suggestions?minRating=excellent
```

**Returns:**
```json
{
  "suggestions": [
    {
      "question": "How do I submit expense reports?",
      "response": "To submit expense reports...",
      "frequency": 15,
      "avgConfidence": 0.85
    }
  ]
}
```

**Use Case:** Automatically discover common questions to add to knowledge base

---

### **6. Export Training Data**

Export all responses for external ML training:

**API Endpoint:**
```bash
GET /api/admin/training/export?startDate=2026-01-01&endDate=2026-12-31
```

**Returns:** JSON file with all training data

**Use Case:** 
- Train custom ML models
- Analyze conversation patterns
- Improve AI prompts
- Fine-tune company-specific models

---

## 🔄 Continuous Learning Workflow

### **Step 1: Users Ask Questions**
- All questions and responses are logged
- Confidence scores are tracked

### **Step 2: Admins Review**
- Check low-confidence responses
- Rate responses (excellent/good/bad)
- Add feedback notes

### **Step 3: System Learns**
- Excellent responses → Suggested for knowledge base
- Bad responses → Flagged for improvement
- Patterns identified → Analytics dashboard

### **Step 4: Knowledge Base Updates**
- Add frequently asked questions
- Update existing entries
- Remove outdated information

### **Step 5: AI Improves**
- Better keyword matching
- More accurate responses
- Higher confidence scores

---

## 📊 Training Dashboard (Future Feature)

**Planned Admin UI:**
```
┌─────────────────────────────────────────┐
│  AI Training Dashboard                  │
├─────────────────────────────────────────┤
│  📈 Performance Metrics                 │
│  - 1,250 responses this month           │
│  - 78% average confidence               │
│  - 92% positive feedback                │
│                                         │
│  🔍 Review Queue (15 pending)           │
│  - Low confidence responses             │
│  - Rate and provide feedback            │
│                                         │
│  💡 Suggestions (8 new)                 │
│  - Add to knowledge base                │
│  - Auto-generated from patterns         │
│                                         │
│  📥 Export Data                         │
│  - Download training dataset            │
│  - For external ML training             │
└─────────────────────────────────────────┘
```

---

## 🎓 Training Best Practices

### **1. Regular Review**
- Review low-confidence responses weekly
- Rate at least 20-30 responses per week
- Look for patterns in user questions

### **2. Knowledge Base Maintenance**
- Add suggested entries monthly
- Update outdated information
- Remove duplicate entries

### **3. Monitor Analytics**
- Track confidence trends
- Identify knowledge gaps
- Measure improvement over time

### **4. User Feedback**
- Encourage users to report bad responses
- Ask for suggestions on missing topics
- Survey user satisfaction

---

## 🔧 Customization

### **Adjust AI Behavior**

Edit `packages/backend/src/services/groq-api.service.ts`:

```typescript
// Make AI more strict (company-only)
"Use ONLY company knowledge, decline all general questions"

// Make AI more helpful (current setting)
"Use company knowledge first, then general knowledge for work tasks"

// Make AI very open
"Answer all questions using company and general knowledge"
```

### **Change Confidence Threshold**

Edit `packages/backend/src/services/training.service.ts`:

```typescript
// Current: Review responses with confidence < 0.6
metricValue: { lt: 0.6 }

// More strict: Review < 0.8
metricValue: { lt: 0.8 }

// Less strict: Review < 0.4
metricValue: { lt: 0.4 }
```

---

## 📈 Success Metrics

Track these KPIs:

1. **Response Accuracy**
   - Target: >85% confidence
   - Measure: Average confidence score

2. **User Satisfaction**
   - Target: >90% positive feedback
   - Measure: Excellent + Good ratings

3. **Knowledge Coverage**
   - Target: <10% fallback responses
   - Measure: Source breakdown

4. **Learning Rate**
   - Target: +5% confidence per month
   - Measure: Trend analysis

---

## 🚀 Next Steps

1. **Start Using** - Let users interact with the AI
2. **Monitor** - Check analytics weekly
3. **Review** - Rate low-confidence responses
4. **Improve** - Add suggested knowledge entries
5. **Repeat** - Continuous improvement cycle

---

## 🔗 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/training/analytics` | GET | View performance metrics |
| `/api/admin/training/review` | GET | Get responses needing review |
| `/api/admin/training/feedback` | POST | Submit rating/feedback |
| `/api/admin/training/suggestions` | GET | Get KB suggestions |
| `/api/admin/training/export` | GET | Export training data |

---

## 💡 Example Use Cases

### **Use Case 1: New Employee Onboarding**
- AI learns common onboarding questions
- Suggests KB entries for HR policies
- Reduces support ticket volume

### **Use Case 2: Technical Support**
- AI helps with work-related tech questions
- Learns company-specific tools
- Escalates complex issues to humans

### **Use Case 3: Customer Service**
- AI answers product questions
- Uses company knowledge + general help
- Improves from customer feedback

---

## 📞 Support

For questions about the training system:
- Check analytics dashboard
- Review this guide
- Contact AI team at ai-support@company.com

---

**Your AI is now ready to learn and improve! 🎉**
