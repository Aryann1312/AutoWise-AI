import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// TypeScript interface for each team member
interface TeamMember {
  name: string;
  role: string;
  imageSrc: string;
  themeColor: string; // e.g., 'bg-[#F9D4D5]'
  imageClass?: string;
  imageStyle?: React.CSSProperties;
  hasCoinShine?: boolean;
}

// Props for the main component
interface TeamShowcaseProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: string;
  buttonText?: string;
  members: TeamMember[];
  onButtonClick?: () => void;
  redirectUrl?: string;
}

const TeamShowcase = React.forwardRef<HTMLDivElement, TeamShowcaseProps>(
  (
    {
      title = "THE MAGIC DEVS YOU'VE BEEN SEARCHING FOR",
      description = "Why wasting time on so many different platforms for searching, interviewing and find out that it’s not a good fit? We do all of these for you. No more back and forth. Get matched today.",
      buttonText = "LAUNCH",
      members,
      className,
      onButtonClick,
      redirectUrl = "http://localhost:8501",
      ...props
    },
    ref
  ) => {
    // Animation variants for the container to stagger children
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.2,
        },
      },
    };

    // Animation variants for each card
    const cardVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: {
        y: 0,
        opacity: 1,
        transition: {
          type: "spring",
          stiffness: 100,
          damping: 10,
        },
      },
    };

    const handleActionClick = () => {
      if (onButtonClick) {
        onButtonClick();
      } else if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    };

    return (
      <section
        ref={ref}
        className={cn("w-full bg-background text-foreground py-16 px-4 md:px-8", className)}
        {...props}
      >
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          {/* Header Section */}
          <div className="max-w-3xl mb-10">
            {typeof title === "string" ? (
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
                {title}
              </h1>
            ) : (
              title
            )}
            {description && <p className="text-muted-foreground mb-8">{description}</p>}
            <Button
              size="lg"
              onClick={handleActionClick}
              className="cursor-pointer font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 px-8 py-3 text-base"
            >
              {buttonText}
            </Button>
          </div>

          {/* Members Showcase Section */}
          <motion.div
            className="w-full flex justify-center items-end -space-x-8 md:space-x-4 px-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {members.map((member, index) => (
                <motion.div
                  key={member.name}
                  className="w-full max-w-[200px] md:max-w-[250px]"
                  variants={cardVariants}
                  whileHover={{ y: -10, scale: 1.05, zIndex: 40 }}
                  style={{ zIndex: members.length - index }}
                >
                  <div
                    className={cn(
                      "relative pt-8 pb-4 px-4 rounded-t-[50%] h-[280px] md:h-[350px] flex flex-col items-center justify-between text-center overflow-hidden shadow-md",
                      member.themeColor
                    )}
                  >
                    <div className="text-black z-10">
                      <h3 className="font-bold text-sm md:text-base tracking-wide">{member.name}</h3>
                      <p className="text-xs md:text-sm opacity-80">{member.role}</p>
                    </div>
                    {member.hasCoinShine ? (
                      <div
                        className={cn(
                          "absolute left-1/2 -translate-x-1/2 flex items-end justify-center pointer-events-none transition-transform duration-300 drop-shadow-md",
                          member.imageClass
                        )}
                        style={{
                          width: member.imageStyle?.width || "88%",
                          maxHeight: member.imageStyle?.maxHeight || "65%",
                          height: member.imageStyle?.maxHeight || "65%",
                          bottom: member.imageStyle?.bottom || "16px",
                          ...member.imageStyle,
                        }}
                      >
                        <div className="relative flex items-end justify-center w-full h-full max-h-full">
                          <img
                            src={member.imageSrc}
                            alt={member.name}
                            loading="lazy"
                            className="w-auto h-auto max-w-full max-h-full object-contain object-bottom pointer-events-none"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&auto=format&fit=crop&q=80`;
                            }}
                          />
                          {/* Premium Vertical Coin-Shine Reflection Overlay */}
                          <div
                            className="coin-shine-container"
                            style={{
                              WebkitMaskImage: `url(${member.imageSrc})`,
                              maskImage: `url(${member.imageSrc})`,
                              WebkitMaskSize: "contain",
                              maskSize: "contain",
                              WebkitMaskRepeat: "no-repeat",
                              maskRepeat: "no-repeat",
                              WebkitMaskPosition: "bottom center",
                              maskPosition: "bottom center",
                            }}
                            aria-hidden="true"
                          >
                            <div className="coin-shine-beam" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={member.imageSrc}
                        alt={member.name}
                        loading="lazy"
                        className={cn(
                          "absolute bottom-2 left-1/2 -translate-x-1/2 w-auto h-auto max-w-[90%] object-contain object-bottom transition-transform duration-300 pointer-events-none drop-shadow-md",
                          member.imageClass
                        )}
                        style={{ maxHeight: "64%", ...member.imageStyle }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&auto=format&fit=crop&q=80`;
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    );
  }
);

TeamShowcase.displayName = "TeamShowcase";

export { TeamShowcase };
export type { TeamMember, TeamShowcaseProps };
