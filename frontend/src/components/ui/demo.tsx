import { TeamShowcase, TeamMember } from "@/components/ui/team-showcase";

// Sample data for the demo
const developers: TeamMember[] = [
  {
    name: "ANNA DEAN",
    role: "React engineer",
    imageSrc: "https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-WATlBiOtoeOqYDWnDEPanriLAznjm1.png&w=320&q=75",
    themeColor: "bg-[#F9D4D5]", // Light Pink
  },
  {
    name: "CHRIS MEZY",
    role: "Data engineer",
    imageSrc: "https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-it2XL5AezhxG7WN3p4H9RCEHeT9QmS.png&w=320&q=75",
    themeColor: "bg-[#D1E5E6]", // Light Blue
  },
  {
    name: "LESLIE SCHNIDER",
    role: "Backend developer",
    imageSrc: "https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-LLs9Xsn1aI6Y3OrY1OM6jwrLzoHfgU.png&w=320&q=75",
    themeColor: "bg-[#EAE1DA]", // Beige
  },
  {
    name: "JIM BRICKTON",
    role: "AI specialist",
    imageSrc: "https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-wFE3oMCekBz2QDqsYZJoHqW80K9ruu.png&w=320&q=75",
    themeColor: "bg-[#FDEACC]", // Light Yellow
  },
];

export default function TeamShowcaseDemo() {
  return <TeamShowcase members={developers} />;
}

export { developers };
