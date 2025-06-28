# Choice Craft - Interactive Story Adventure

## FBLA Introduction to Programming 2024-25

**Created by Pranav Behal from Cumberland Valley High School**

An interactive storytelling application where users engage with AI companions across unique missions, with their choices shaping the narrative.

### 📋 FBLA Prompt & Program Correlation

**Original Prompt:**
"Write an interactive story that occasionally asks the user what they'd like to do, and changes where the story goes based on user input. Allow the user to stop interacting with the story by saying 'stop.'"

**How Choice Craft Addresses & Exceeds the Prompt:**

1. **Core Requirement: Interactive Story**

   - ✓ Implemented an interactive storyline
   - ✓ Story adapts dynamically based on the user's decisions on what to do next
   - ✓ "Stop" command functionality to stop interacting with the story

2. **Going Above & Beyond:**

   - **AI Integration**

     - Advanced language model for dynamic responses
     - Voice synthesis for character dialogue
     - Real-time background generation matching story context

   - **Rich User Experience**

     - Implemented four unique storylines instead of just one
     - Users can freely interact using natural language, rather than just occasional choices
     - Visual character representations
     - Progress tracking and achievements
     - Comprehensive help system
     - Interactive tutorial

   - **Data & Progress**

     - Persistent progress tracking
     - Detailed statistics and visualization
     - Exportable mission data
     - Cross-mission continuity

   - **Technical Excellence**
     - Modern web technologies
     - Responsive design
     - Robust error handling
     - Secure authentication

While the basic prompt asked for a simple interactive story with a stop function, Choice Craft is a fully-functioning application that turned this concept into an immersive adventure platform with AI-powered interactions, visual and audio elements, and comprehensive progress tracking.

### 🌟 Core Features

- Four unique story contexts with distinct AI companions
- Dynamic dialogue system powered by OpenAI's GPT-4o-mini
- Real-time voice synthesis using ElevenLabs
- AI-generated scene backgrounds
- Progress tracking and data visualization
- Interactive help system and onboarding tutorial

### 🚀 Technical Requirements

- Runs standalone with no programming errors
- Virus/malware free
- Modern responsive design
- Comprehensive error handling
- Input validation with edge case protection

### 🛠️ Setup & Installation

You can either go to the deployed URL at [https://choice-craft.vercel.app/](https://choice-craft.vercel.app/), or locally run the program by doing the following:

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables in a .env file:

```bash
OPENAI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
REPLICATE_API_KEY=your_key_here
SUPABASE_URL=your_url_here
SUPABASE_ANON_KEY=your_key_here
```

4. Run the development server:

```bash
# I recommend you use npm:
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the web app locally running.

### 📚 Libraries Used

- **Framework**: Next.js 15 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Authentication**: Supabase Auth (with Google OAuth )
- **AI Integration**:
  - OpenAI GPT-4o-mini for dialogue and text generation
  - ElevenLabs for voice narration
  - Replicate for image generation (specifically the flux-schnell for the images generated in realtime, and flux-1.1-pro for the images generated and stored ahead of time, such as the avatars and backgrounds. Both of these models are from Black Forest Labs )
- **Data Visualization**: Recharts and shadcn/ui
- **Other Dependencies**:
  - Lucide React (icons)
  - Zod (Typescript validation)

### 📃 Templates Used

- Although no templates were used, documentation from the libraries that we used were referenced to create the codebase.

### 🎯 Mission Types

1. **The Lost City** (with Professor Blue)

   - Archaeological exploration
   - Historical mysteries
   - Ancient civilizations

2. **Space Odyssey** (with Captain Nova)

   - Space navigation
   - Asteroid field challenges
   - Sci-fi adventure

3. **Enchanted Forest** (with Fairy Lumi)

   - Magical quests
   - Creature interactions
   - Environmental challenges

4. **Cyber Heist** (with Sergeant Nexus)
   - Digital infiltration
   - Security systems
   - High-tech puzzles

### 🎨 Copyrighted Material & Attributions

- No copyrighted material was used (all material was open source)

### 🧑‍💻 Open Source Material & Attributions

- Next.js 15 (MIT License)
- Tailwind CSS (MIT License)
- Supabase (Apache 2.0 License)
- Recharts (MIT License)
- Zod (MIT License)
- Lucide React Icons (ISC License)
- shadcn/ui Components (MIT License)
- React (MIT License)
- TypeScript (Apache 2.0 License)
- Node.js (MIT License)
- Replicate AI and Black Forest Labs image models (all images generated allowed commercial use)
- UserWay ADA Compliant Accessibility Plugin

### 🔨 Development Process

1. **Planning Phase**

   - Analyzed FBLA requirements
   - Researched interactive storytelling mechanics
   - Designed user experience flow
   - Selected appropriate technologies

2. **Design Phase**

   - Created UI/UX wireframes
   - Designed database schema
   - Planned AI integration points
   - Developed story contexts and characters

3. **Implementation Phase**

   - Set up Next.js project structure
   - Implemented core features iteratively
   - Integrated AI services (OpenAI, ElevenLabs, Replicate)
   - Added real-time updates and animations

4. **Testing & Refinement**

   - Conducted user testing
   - Implemented feedback
   - Added error handling
   - Optimized performance

5. **Problem-Solving Approach**
   - Used modular development for maintainability
   - Implemented comprehensive error handling
   - Created fallback mechanisms for API failures
   - Ensured cross-browser compatibility

### 🔍 Features & Functionality

1. **Interactive Storytelling**

   - Natural language processing
   - Dynamic story adaptation
   - Multiple narrative paths
   - Contextual understanding and memory in the AI system that allows it to remember past messages to shape future ones

2. **User Experience**

   - Intuitive chat interface
   - Voice narration
   - Real-time background changes
   - Comprehensive help system
   - Interactive tutorial

3. **Progress Tracking**

   - Mission completion stats
   - Decision analysis
   - Exportable data
   - Visual progress charts

4. **Data Management**
   - Persistent progress storage with Supabase
   - User preferences
   - Achievement tracking
   - Error recovery

## ♿ Accessibility Features

I have implemented the UserWay ADA Compliant Accessibility Plugin, which provides a comprehensive set of accessibility tools to allow anyone to use the application:

- **Visual Adjustments**:

  - Contrast adjustments
  - Text size controls
  - Highlight links
  - Content scaling
  - Dyslexia-friendly font
  - Color adjustments

- **Reading Aids**:

  - Text spacing controls
  - Line height adjustments
  - Dyslexia-friendly formatting

- **Motion Control**:
  - Animation pause/play
  - Reduced motion options
  - Focus indicators

These accessibility features can be accessed through the UserWay Accessibility widget icon, located on the bottom-left corner of every page of the application.

### 🛡️ Error Handling & Validation

- Input length restrictions
- Content appropriateness checks
- Network error recovery
- API fallback mechanisms
- Data persistence safeguards

### 📱 Responsive Web Design

- Desktop optimization
- Mobile compatibility
- Tablet support
- Flexible UI components

### 🔒 Security Features

- Secure authentication
- Data encryption
- API key protection
- Input Validation (both syntatic and semantic)

### 👥 User Support

- Interactive help menu
- FAQ system
- Tutorial walkthrough
- Command reference
- Error recovery guides

### 🎮 Commands & Controls

- Type messages to interact
- Use "stop" to end missions
- Access help via ? button in the corner of all pages
- Customize settings in profile
- Export data from results page

### 🏆 Achievement System

- Mission completion badges
- Decision-type tracking
- Progress milestones
- Statistical analysis

### 📊 Data Visualization

- Mission progress charts
- Decision distribution
- Time tracking
- Success metrics

### 🔄 Version Control

- Version: 1.0.0
- Last Updated: December 2024
- Platform: Web Browser
- Framework: Next.js 15

### 📝 License

This project was created for the FBLA Introduction to Programming competition by Pranav Behal of Cumberland Valley High School.
All rights reserved.
