export interface WikipediaSource {
  title: string;
  url: string;
  extract: string;
  language?: string;
}

export interface Script {
  id: string;
  topic: string;
  title: string;
  content: string;
  duration: number; // in seconds
  createdAt: string;
  updatedAt: string;
  imagePrompts?: string[]; // AI-generated image prompts for backgrounds
  wikipediaSources?: WikipediaSource[]; // Wikipedia sources used for generation
  wikipediaTopic?: string; // Main Wikipedia topic searched
}

export const mockScripts: Script[] = [
  {
    id: '1',
    topic: 'Sustainable Fashion',
    title: 'How to Build a Sustainable Wardrobe in 2025',
    content: `Are you tired of fast fashion trends that harm our planet? Let's talk about sustainable fashion in 2025.

First, invest in quality over quantity. High-quality pieces might cost more upfront, but they'll last much longer.

Second, research brands before you buy. Look for transparent companies that prioritize ethical manufacturing and eco-friendly materials.

Third, consider secondhand shopping. Thrift stores, vintage shops, and online resale platforms are treasure troves of unique fashion finds.

Fourth, learn basic mending skills. Small repairs can extend the life of your clothes significantly.

Finally, embrace a minimalist approach. A capsule wardrobe of versatile pieces reduces waste and simplifies your daily choices.

Remember, sustainable fashion isn't about perfection—it's about making better choices for our planet one step at a time.`,
    duration: 60,
    createdAt: '2025-05-11T10:30:00Z',
    updatedAt: '2025-05-11T10:30:00Z'
  },
  {
    id: '2',
    topic: 'AI in Healthcare',
    title: 'How AI is Revolutionizing Medical Diagnostics',
    content: `Artificial Intelligence is transforming healthcare in ways we never imagined, particularly in medical diagnostics.

AI algorithms can now analyze medical images like X-rays, MRIs, and CT scans with remarkable accuracy, often detecting subtle abnormalities that human eyes might miss.

In pathology, AI tools can rapidly examine tissue samples to identify cancer cells, saving critical time in diagnosis.

For rare diseases, machine learning models compare patient symptoms against vast databases, helping doctors identify conditions that might otherwise take years to diagnose.

Perhaps most impressively, AI-powered wearable devices continuously monitor vital signs, alerting users and healthcare providers to potential problems before they become emergencies.

While AI won't replace doctors, this collaboration between human expertise and artificial intelligence is creating a future with faster, more accurate, and more accessible healthcare for everyone.`,
    duration: 65,
    createdAt: '2025-05-10T14:15:00Z',
    updatedAt: '2025-05-10T15:20:00Z'
  },
  {
    id: '3',
    topic: 'Mental Health Awareness',
    title: '5 Daily Habits for Better Mental Health',
    content: `Taking care of your mental health is just as important as physical health. Here are five simple daily habits that can make a big difference.

First, start your day with mindfulness. Just five minutes of meditation or deep breathing can reduce stress levels throughout your day.

Second, move your body daily. Exercise releases endorphins that naturally boost your mood, even if it's just a short walk during lunch.

Third, prioritize quality sleep. Turn off screens an hour before bed and create a restful environment for better sleep quality.

Fourth, connect meaningfully with others. Even brief, positive social interactions can significantly improve your mental wellbeing.

Finally, practice gratitude. Taking time to acknowledge what you're thankful for can shift your perspective and increase overall happiness.

Remember, mental health varies for everyone, so find what works best for you and make it part of your daily routine.`,
    duration: 55,
    createdAt: '2025-05-09T09:45:00Z',
    updatedAt: '2025-05-09T10:30:00Z'
  }
];
