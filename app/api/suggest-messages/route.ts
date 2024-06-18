import { NextResponse } from 'next/server';

export async function GET(req: Request) {
     try {
          const questions = [
               "What's a new hobby you recently picked up?||If you could visit any city in the world, where would it be?||What's a movie you can watch over and over again?",
               "What's your favorite way to spend a Sunday afternoon?||If you could travel back in time, which era would you visit?||What's a fun fact about you?",
               "What's a book you couldn't put down?||If you could have a conversation with any fictional character, who would it be?||What's your favorite type of food?",
               "What's a project you're currently excited about?||If you could have any superpower, what would it be?||What's a piece of advice you live by?",
               "What's something you learned recently?||If you could meet any historical figure, who would it be?||What's a simple joy in your life?",
               "What's a memorable trip you've taken?||If you could instantly learn any language, which one would it be?||What's a TV show you recommend?",
               "What's an interesting skill you'd like to learn?||If you could live in any fictional world, which one would it be?||What's a goal you're working towards?",
               "What's your favorite way to relax?||If you could switch lives with someone for a day, who would it be?||What's a tradition you enjoy?",
               "What's your ideal way to spend a weekend?||If you could only eat one type of cuisine forever, what would it be?||What's a piece of art that inspires you?",
               "What's a fun fact you recently discovered?||If you could invite three people to dinner, who would they be?||What's a dream you still remember?",
               "What's your favorite season and why?||If you could have any animal as a pet, what would it be?||What's a book everyone should read?",
               "What's a place you'd love to visit?||If you could have any job for a day, what would it be?||What's a song that always makes you happy?",
               "What's something you're excited about this year?||If you could have any futuristic technology, what would it be?||What's a challenge you overcame?",
               "What's your favorite outdoor activity?||If you could instantly master a talent, what would it be?||What's a quote that motivates you?",
               "What's a surprising fact about you?||If you could redesign any part of the human body, what would you change?||What's your favorite holiday tradition?",
               "What's a food you can't live without?||If you could explore any planet, which one would you choose?||What's a custom from another culture you admire?",
               "What's something on your bucket list?||If you could have any view from your window, what would it be?||What's a memory that always makes you smile?",
               "What's your favorite way to stay fit?||If you could be an expert in any field, what would it be?||What's a fictional place you'd love to visit?",
               "What's an accomplishment you're proud of?||If you could trade places with any celebrity for a day, who would it be?||What's a lesson you learned from a mistake?",
               "What's your favorite holiday and why?||If you could invent a new holiday, what would it celebrate?||What's an invention you wish existed?"
          ];

          // Select a random set of questions
          const randomQuestions = questions[Math.floor(Math.random() * questions.length)];

          return NextResponse.json({ message: 'Messages generated successfully', success: true, questions: randomQuestions }, { status: 200 });
     }

     catch (error: any) {
          console.error('An unexpected error occurred:', error);
          return NextResponse.json({ message: 'Error in suggesting messages', success: false }, { status: 500 });
     }
}