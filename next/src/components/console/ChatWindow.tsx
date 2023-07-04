import type { ReactNode } from "react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import FadeIn from "../motions/FadeIn";
import HideShow from "../motions/HideShow";
import clsx from "clsx";
import { ChatMessage } from "./ChatMessage";
import type { HeaderProps } from "./MacWindowHeader";
import { MacWindowHeader, messageListId } from "./MacWindowHeader";
import { ExampleAgentButton } from "./ExampleAgentButton";
import { FaArrowCircleDown } from "react-icons/fa";
import { useAgentStore } from "../../stores";
import { getTaskStatus, TASK_STATUS_EXECUTING } from "../../types/task";
import { MESSAGE_TYPE_SYSTEM } from "../../types/message";
import { ImSpinner2 } from "react-icons/im";
import Button from "../Button";
import { useTaskStore } from "../../stores/taskStore";

interface ChatWindowProps extends HeaderProps {
  children?: ReactNode;
  setAgentRun?: (name: string, goal: string) => void;
  visibleOnMobile?: boolean;
}

const ChatWindow = ({
  messages,
  children,
  title,
  setAgentRun,
  visibleOnMobile,
}: ChatWindowProps) => {
  const [t] = useTranslation();
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const isThinking = useAgentStore.use.isAgentThinking();
  const isStopped = useAgentStore.use.lifecycle() === "stopped";
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

    // Use has scrolled if we have scrolled up at all from the bottom
    const hasUserScrolled = scrollTop < scrollHeight - clientHeight - 10;
    setHasUserScrolled(hasUserScrolled);
  };

  const handleScrollToBottom = (behaviour: "instant" | "smooth") => {
    if (!scrollRef || !scrollRef.current) return;

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: behaviour,
    });
  };

  useEffect(() => {
    if (!hasUserScrolled) {
      handleScrollToBottom("instant");
    }
  });

  return (
    <div
      className={clsx(
        "border-translucent background-color-1 border-style-1 h-full max-w-[inherit] flex-1 flex-col overflow-auto text-white transition-all duration-500",
        visibleOnMobile ? "flex" : "hidden xl:flex"
      )}
    >
      <HideShow
        showComponent={hasUserScrolled}
        className="absolute bottom-2 right-6 cursor-pointer"
      >
        <FaArrowCircleDown
          onClick={() => handleScrollToBottom("smooth")}
          className="h-6 w-6 animate-bounce md:h-7 md:w-7"
        />
      </HideShow>

      <MacWindowHeader title={title} messages={messages} />
      <div
        className="mb-2 mr-2 flex-1 overflow-auto transition-all duration-500"
        ref={scrollRef}
        onScroll={handleScroll}
        id={messageListId}
      >
        {messages.map((message, index) => {
          if (getTaskStatus(message) === TASK_STATUS_EXECUTING) {
            return null;
          }
          return (
            <FadeIn key={`${index}-${message.type}`}>
              <ChatMessage message={message} />
            </FadeIn>
          );
        })}
        {children}

        {messages.length === 0 && (
          <>
            <FadeIn delay={0.8} duration={0.5}>
              <ChatMessage
                message={{
                  type: MESSAGE_TYPE_SYSTEM,
                  value:
                    "👉 Create an agent by adding a name / goal, and hitting deploy! Try our examples below!",
                }}
              />
            </FadeIn>
            <FadeIn delay={0.9} duration={0.5}>
              <div className="m-2 flex flex-col justify-between gap-2 sm:m-4 sm:flex-row">
                <ExampleAgentButton name="PlatformerGPT 🎮" setAgentRun={setAgentRun}>
                  Write some code to make a platformer game.
                </ExampleAgentButton>
                <ExampleAgentButton name="TravelGPT 🌴" setAgentRun={setAgentRun}>
                  Plan a detailed trip to Hawaii.
                </ExampleAgentButton>
                <ExampleAgentButton name="ResearchGPT 📜" setAgentRun={setAgentRun}>
                  Create a comprehensive report of the Nike company
                </ExampleAgentButton>
              </div>
            </FadeIn>
          </>
        )}
        <Summarize />
        <div
          className={clsx(
            isThinking && !isStopped ? "opacity-100" : "opacity-0",
            "border-color-1 mx-2 flex flex-row items-center gap-2 rounded-lg border p-2 font-mono transition duration-300 hover:border-shade-400-light sm:mx-4",
            "text-color-primary text-xs sm:text-base"
          )}
        >
          <p>🧠 Thinking</p>
          <ImSpinner2 className="animate-spin" />
        </div>
      </div>
    </div>
  );
};

const Summarize = () => {
  const agent = useAgentStore.use.agent();
  const lifecycle = useAgentStore.use.lifecycle();
  const tasksWithResults = useTaskStore.use
    .tasks()
    .filter((task) => task.status == "completed" && task.result !== "");
  const [summarized, setSummarized] = useState(false);

  // Reset the summarized state when the agent changes
  useEffect(() => {
    setSummarized(false);
  }, [agent]);

  if (!agent || lifecycle !== "stopped" || tasksWithResults.length < 1 || summarized) return null;

  return (
    <div
      className={clsx(
        "mx-2 flex flex-row items-center gap-2 rounded-lg border border-white/20 p-2 font-mono transition duration-300 sm:mx-4",
        "text-xs sm:text-base"
      )}
    >
      <span className="md:hidden">Test</span>
      <span className="hidden md:inline">Click here to summarize the conversation!</span>
      <Button
        className="ml-auto py-1  sm:py-1  md:py-1"
        onClick={async () => {
          setSummarized(true);
          await agent?.summarize();
        }}
      >
        Summarize
      </Button>
    </div>
  );
};

export default ChatWindow;
