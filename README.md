# 🚀 AlgoChat: AI-Powered DSA Tutor

![AlgoChat Banner](./assets/banner.png)

AlgoChat is a state-of-the-art interactive platform designed to help students master **Data Structures and Algorithms (DSA)**. Combining a **Socratic tutoring approach** with real-time AI-driven feedback, AlgoChat transforms the way you learn problem-solving.

---

## ✨ Key Features

- **🧠 Socratic AI Tutor**: Instead of giving answers, our LangGraph-powered agent asks the right questions to guide you toward the solution.
- **🛠️ Interactive Lab**: Real-time code execution with a Monaco-based editor and instant diagnostics.
- **📊 Dynamic Visualizations**: Algorithm traces and data structure transitions powered by **D3.js** and **Mermaid**.
- **📚 Smart Content Retrieval**: RAG (Retrieval-Augmented Generation) pipeline using **FAISS** to pull relevant context from MIT OpenCourseWare and other high-quality sources.
- **📽️ Video Tutor**: Integrated YouTube processing with transcript analysis for deep learning.
- **📈 Progress Tracking**: Visual history of your learning journey and concept mastery.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS + Framer Motion (Animations)
- **Visuals**: D3.js, Recharts, Mermaid
- **Editor**: Monaco Editor

### Backend
- **Core**: Django 4.2
- **AI/ML**: LangChain, LangGraph (Multi-agent systems)
- **Models**: Groq (Llama-3), Sentence-Transformers (Embeddings)
- **Vector DB**: FAISS
- **Real-time**: Django Channels + Redis
- **Tasks**: Celery

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- Redis (for real-time features and Celery)

### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/vk460/AlgoChat-AI-DSA-Tutor-.git
   cd AlgoChat-AI-DSA-Tutor-
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   Create a `.env` file in the root with:
   ```env
   GEMINI_API_KEY=your_key
   GROQ_API_KEY=your_key
   SECRET_KEY=your_django_secret
   ```
5. Run migrations:
   ```bash
   python backend/manage.py migrate
   ```
6. Start the server:
   ```bash
   python backend/manage.py runserver
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🏗️ Architecture

AlgoChat uses a modular architecture to handle complex AI interactions:
- **RAG Pipeline**: Scrapes and chunks educational content, converts it into embeddings, and stores it in FAISS for context-aware tutoring.
- **Socratic Agent**: A stateful LangGraph agent that maintains conversation history and adapts its tutoring strategy based on student responses.
- **Visualization Engine**: Maps backend algorithm states to frontend SVG components for real-time visual feedback.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by the AlgoChat Team
</p>
