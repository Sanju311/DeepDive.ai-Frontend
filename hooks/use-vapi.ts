import { useEffect, useRef, useState, useCallback } from 'react';
import Vapi from '@vapi-ai/web';

const ENV_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_CLIENT_API_KEY || "";

type UseVapiOptions = {
  assistantId?: string
  publicKey?: string
}

const useVapi = (options?: UseVapiOptions) => {
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversation, setConversation] = useState<
    { role: string; text: string; timestamp: string; isFinal: boolean; committedChars?: number }[]
  >([]);
  const vapiRef = useRef<any>(null);
  const assistantIdRef = useRef<string | undefined>(options?.assistantId);
  const publicKeyRef = useRef<string>(options?.publicKey || ENV_PUBLIC_KEY);
  // Tracks the stable, finalized text for the last utterance per role so we can
  // render partial updates without creating new conversation lines.
  const stableTextByRoleRef = useRef<Record<string, string>>({});

  // Index-based commit tracking and idle finalization per role
  const committedIndexByRoleRef = useRef<Record<string, number>>({});
  const finalizeTimersRef = useRef<Record<string, any>>({});

  const scheduleFinalize = useCallback((role: string) => {
    if (finalizeTimersRef.current[role]) {
      clearTimeout(finalizeTimersRef.current[role]);
    }
    finalizeTimersRef.current[role] = setTimeout(() => {
      setConversation((prev) => {
        if (prev.length === 0) return prev;
        const lastIdx = prev.length - 1;
        const last = prev[lastIdx];
        if (last && last.role === role && !last.isFinal) {
          const updated = [...prev];
          const len = (last.text ?? "").length;
          committedIndexByRoleRef.current[role] = len;
          updated[lastIdx] = { ...last, isFinal: true, committedChars: len };
          return updated;
        }
        return prev;
      });
    }, 2000);
  }, []);


  // Keep refs in sync when options change
  useEffect(() => {
    if (options?.assistantId) assistantIdRef.current = options.assistantId;
    if (options?.publicKey) publicKeyRef.current = options.publicKey;
  }, [options?.assistantId, options?.publicKey]);

  // useEffect(() => {
  //   //set a dummy conversation 
  //   setConversation([
  //     { role: "assistant", text: "Hello, how can I help you today?", timestamp: new Date().toLocaleTimeString(), isFinal: true },
  //     { role: "user", text: "I have a question about the product", timestamp: new Date().toLocaleTimeString(), isFinal: true },
  //     { role: "assistant", text: "I can help you with that. What is your question?", timestamp: new Date().toLocaleTimeString(), isFinal: true },
  //     { role: "user", text: "I want to know more about the features", timestamp: new Date().toLocaleTimeString(), isFinal: true },
  //     { role: "assistant", text: "The product has a feature that allows you to do X. Is that what you're looking for?", timestamp: new Date().toLocaleTimeString(), isFinal: true },
  //     { role: "user", text: "Yes, that's what I'm looking for. Thank you!", timestamp: new Date().toLocaleTimeString(), isFinal: true },
  //     { role: "assistant", text: "You're welcome! If you have any other questions, feel free to ask.", timestamp: new Date().toLocaleTimeString(), isFinal: true },
  //     { role: "user", text: "Thank you for your help!", timestamp: new Date().toLocaleTimeString(), isFinal: true },
  //     { role: "assistant", text: "You're welcome! If you have any other questions, feel free to ask.", timestamp: new Date().toLocaleTimeString(), isFinal: true },
  //     { role: "user", text: "Thank you for your help!", timestamp: new Date().toLocaleTimeString(), isFinal: true },
  //     { role: "assistant", text: "You're welcome! If you have any other questions, feel free to ask.", timestamp: new Date().toLocaleTimeString(), isFinal: true },
  //     { role: "user", text: "Thank you for your help!", timestamp: new Date().toLocaleTimeString(), isFinal: true },  
  //     { role: "assistant", text: "You're welcome! If you have any other questions, feel free to ask.", timestamp: new Date().toLocaleTimeString(), isFinal: true },
  //     { role: "user", text: "Thank you for your help!", timestamp: new Date().toLocaleTimeString(), isFinal: true },
  //     { role: "assistant", text: "You're welcome! If you have any other questions, feel free to ask.", timestamp: new Date().toLocaleTimeString(), isFinal: true },
  //   ]);
  // }, []);

  const initializeVapi = useCallback(() => {
    if (!vapiRef.current) {
      const vapiInstance = new Vapi(publicKeyRef.current);
      vapiRef.current = vapiInstance;

      vapiInstance.on('call-start', () => {
        setIsSessionActive(true);
      });

      vapiInstance.on('call-end', () => {
        setIsSessionActive(false);
        setConversation([]); // Reset conversation on call end
      });

      vapiInstance.on('volume-level', (volume: number) => {
        setVolumeLevel(volume);
      });

      vapiInstance.on('message', (message: any) => {
        if (message.type === 'transcript') {
          // Log raw webhook payload for analysis

          setConversation((prev) => {
            const timestamp = new Date().toLocaleTimeString();
            const role = message.role as string;
            const transcript: string = message.transcript ?? "";
            const isFinalIncoming = message.transcriptType === 'final';

            const updatedConversation = [...prev];
            const lastIdx = updatedConversation.length - 1;
            const last = lastIdx >= 0 ? updatedConversation[lastIdx] : null;

            // If the last message is from a different role (or no messages yet), start a new one.
            if (!last || last.role !== role) {
              // Finalize previous ongoing line if needed
              if (last && !last.isFinal) {
                updatedConversation[lastIdx] = { ...last, isFinal: true, committedChars: (last.text ?? "").length };
                // Commit the previous role's index to the current text length
                committedIndexByRoleRef.current[last.role] = (updatedConversation[lastIdx].text ?? "").length;
                stableTextByRoleRef.current[last.role] = updatedConversation[lastIdx].text ?? "";
              }
              updatedConversation.push({
                role,
                text: transcript,
                timestamp,
                isFinal: isFinalIncoming ? true : false,
                committedChars: (transcript ?? "").length,
              });
              // Initialize commit index for this role at current end, regardless of partial/final
              committedIndexByRoleRef.current[role] = (transcript ?? "").length;
              stableTextByRoleRef.current[role] = isFinalIncoming ? transcript : "";
              scheduleFinalize(role);
              return updatedConversation;
            }

            // Last message is from the same role → overwrite after committed index
            const baseIndex = committedIndexByRoleRef.current[role] ?? (last.text?.length || 0);
            const stableBase = (last.text ?? "").slice(0, baseIndex);
            const sep = stableBase && transcript ? (stableBase.endsWith(" ") ? "" : " ") : "";
            const merged = `${stableBase}${sep}${transcript}`.trim();

            if (isFinalIncoming) {
              updatedConversation[lastIdx] = { ...last, text: merged, isFinal: true, committedChars: merged.length };
              committedIndexByRoleRef.current[role] = merged.length; // move index to the end
              stableTextByRoleRef.current[role] = merged;
            } else {
              updatedConversation[lastIdx] = { ...last, text: merged, isFinal: false, committedChars: baseIndex };
              // do not change committed index
            }

            scheduleFinalize(role);

            return updatedConversation;
          });
        }

        if (message.type === 'function-call' && message.functionCall.name === 'changeUrl') {
          const command = message.functionCall.parameters.url.toLowerCase();
          console.log(command);
          // const newUrl = routes[command];
          if (command) {
            window.location.href = command;
          } else {
            console.error('Unknown route:', command);
          }
        }
      });

      vapiInstance.on('error', (e: Error) => {
        console.error('Vapi error:', e);
      });
    }
  }, []);

  useEffect(() => {
    initializeVapi();

    // Cleanup function to end call and dispose Vapi instance
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
      }
    };
  }, [initializeVapi]);

  const toggleCall = async (assistantIdOverride?: string) => {
    try {
      if (isSessionActive) {
        await vapiRef.current.stop();
      } else {
        const idToUse = assistantIdOverride || assistantIdRef.current;
        if (!idToUse) {
          throw new Error('No assistantId provided to useVapi or toggleCall.');
        }
        await vapiRef.current.start(idToUse);
      }
    } catch (err) {
      console.error('Error toggling Vapi session:', err);
    }
  };

  const sendMessage = (role: string, content: string) => {
    if (vapiRef.current) {
      vapiRef.current.send({
        type: 'add-message',
        message: { role, content },
      });
    }
  };

  const say = (message: string, endCallAfterSpoken = false) => {
    if (vapiRef.current) {
      vapiRef.current.say(message, endCallAfterSpoken);
    }
  };

  const toggleMute = () => {
    if (vapiRef.current) {
      const newMuteState = !isMuted;
      vapiRef.current.setMuted(newMuteState);
      setIsMuted(newMuteState);
    }
  };

  return { volumeLevel, isSessionActive, conversation, toggleCall, sendMessage, say, toggleMute, isMuted };
};

export default useVapi;