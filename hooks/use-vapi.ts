import { useEffect, useRef, useState, useCallback } from 'react';
import Vapi from '@vapi-ai/web';

const ENV_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_CLIENT_API_KEY || "";

type UseVapiOptions = {
  assistantId?: string
  publicKey?: string
  clarificationAssistantId?: string
  deepdiveAssistantId?: string
}

const useVapi = (options?: UseVapiOptions) => {
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const isSessionActiveRef = useRef(false);
  const pendingStartRef = useRef(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversation, setConversation] = useState<
    { role: string; text: string; timestamp: string; isFinal: boolean; committedChars?: number }[]
  >([]);
  const conversationRef = useRef<
    { role: string; text: string; timestamp: string; isFinal: boolean; committedChars?: number }[]
  >([]);
  // Deep-dive category-scoped conversation
  const [categoryConversation, setCategoryConversation] = useState<
    { role: string; text: string; timestamp: string; isFinal: boolean; committedChars?: number }[]
  >([]);
  const categoryConversationRef = useRef<
    { role: string; text: string; timestamp: string; isFinal: boolean; committedChars?: number }[]
  >([]);
  const vapiRef = useRef<any>(null);
  const assistantIdRef = useRef<string | undefined>(options?.assistantId);
  const publicKeyRef = useRef<string>(options?.publicKey || ENV_PUBLIC_KEY);
  const clarificationAssistantIdRef = useRef<string | undefined>(options?.clarificationAssistantId);
  const deepdiveAssistantIdRef = useRef<string | undefined>(options?.deepdiveAssistantId);
  // Tracks the stable, finalized text for the last utterance per role so we can
  // render partial updates without creating new conversation lines.
  const stableTextByRoleRef = useRef<Record<string, string>>({});

  // Index-based commit tracking and idle finalization per role
  const committedIndexByRoleRef = useRef<Record<string, number>>({});
  const finalizeTimersRef = useRef<Record<string, any>>({});

  // Separate trackers for category conversation during deep-dive
  const deepDiveActiveRef = useRef<boolean>(false);
  const rubricCategoryOrderRef = useRef<string[]>([]);
  const rubricIndexRef = useRef<number>(0);
  const sessionIdRef = useRef<string | null>(null);
  const stableTextByRoleCategoryRef = useRef<Record<string, string>>({});
  const committedIndexByRoleCategoryRef = useRef<Record<string, number>>({});
  const finalizeTimersCategoryRef = useRef<Record<string, any>>({});
  // Tracks where the last category boundary happened in the main conversation
  const mainBoundaryIndexRef = useRef<number>(0);
  // Track categories already posted to avoid duplicate submissions
  const postedCategoriesRef = useRef<Set<string>>(new Set());

  // Deep-dive section accumulation (per rubric category)
  const deepDiveSectionsRef = useRef<{ category: string; messages: { role: string; message: string }[] }[]>([]);
  const currentCategoryBufferRef = useRef<
    { role: string; text: string; timestamp: string; isFinal: boolean; committedChars?: number }[]
  >([]);
  // Track last transcript timing to optionally finalize segments if needed
  const lastTranscriptAtRef = useRef<number>(0);
  const lastTranscriptWasFinalRef = useRef<boolean>(false);
  // Debounce cutover when a tool completes (avoid truncating user speech)
  const sectionCutoverTimerRef = useRef<any>(null);
  const sectionCutoverScheduledAtRef = useRef<number>(0);
  const sectionCutoverPendingRef = useRef<boolean>(false);
  const sectionCutoverTargetCategoryRef = useRef<string | null>(null);
  const SECTION_CUTOVER_DEBOUNCE_MS = 800;
  const SECTION_SILENCE_MS = 1300;
  const SECTION_MAX_WAIT_MS = 3000;

  function cancelSectionCutover() {
    if (sectionCutoverTimerRef.current) {
      clearTimeout(sectionCutoverTimerRef.current);
      sectionCutoverTimerRef.current = null;
    }
    sectionCutoverScheduledAtRef.current = 0;
    sectionCutoverPendingRef.current = false;
    sectionCutoverTargetCategoryRef.current = null;
  }

  function performSectionCutover() {
    const targetCategory = sectionCutoverTargetCategoryRef.current;
    const section = finalizeCurrentCategorySection(targetCategory || undefined);
    if (section) {
      const last = deepDiveSectionsRef.current[deepDiveSectionsRef.current.length - 1];
      if (last && last.category === section.category) {
        // Duplicate category tool call: append to previous category transcript
        last.messages.push(...section.messages);
      } else {
        deepDiveSectionsRef.current.push(section);
        // Update rubric index to align with this category if present in order
        const order = rubricCategoryOrderRef.current || [];
        if (order.length > 0) {
          const idx = order.findIndex((c) => c === section.category);
          if (idx >= 0) {
            rubricIndexRef.current = Math.min(idx + 1, order.length - 1);
          } else {
            rubricIndexRef.current = Math.min(rubricIndexRef.current + 1, order.length - 1);
          }
        }
      }
    }
    resetCategoryConversationTracking();
    mainBoundaryIndexRef.current = conversation.length;
    cancelSectionCutover();
  }

  function scheduleSectionCutover(category?: string | null) {
    sectionCutoverTargetCategoryRef.current = category ?? null;
    sectionCutoverPendingRef.current = true;
    sectionCutoverScheduledAtRef.current = Date.now();
    if (sectionCutoverTimerRef.current) {
      clearTimeout(sectionCutoverTimerRef.current);
    }
    sectionCutoverTimerRef.current = setTimeout(function attempt() {
      const now = Date.now();
      const msSinceTranscript = now - (lastTranscriptAtRef.current || 0);
      const hitMax = now - (sectionCutoverScheduledAtRef.current || now) >= SECTION_MAX_WAIT_MS;
      const isSilent = msSinceTranscript >= SECTION_SILENCE_MS || lastTranscriptWasFinalRef.current;
      if (isSilent || hitMax) {
        performSectionCutover();
      } else {
        sectionCutoverTimerRef.current = setTimeout(attempt, SECTION_CUTOVER_DEBOUNCE_MS);
      }
    }, SECTION_CUTOVER_DEBOUNCE_MS);
  }

  // Public config setter for deep-dive metadata (session and rubric order)
  const configureDeepDive = useCallback((sessionId: string | null, categoryOrder: string[]) => {
    sessionIdRef.current = sessionId ?? null;
    rubricCategoryOrderRef.current = Array.isArray(categoryOrder) ? [...categoryOrder] : [];
    rubricIndexRef.current = 0;
  }, []);

  // Shared transcript merge helper, parameterized by per-store refs and scheduler
  const applyTranscriptUpdate = useCallback((
    prev: { role: string; text: string; timestamp: string; isFinal: boolean; committedChars?: number }[],
    role: string,
    transcript: string,
    isFinalIncoming: boolean,
    committedIndexByRoleStore: React.MutableRefObject<Record<string, number>>,
    stableTextByRoleStore: React.MutableRefObject<Record<string, string>>,
    schedule: (role: string) => void,
    timestamp: string,
  ) => {
    const updated = [...prev];
    const lastIdx = updated.length - 1;
    const last = lastIdx >= 0 ? updated[lastIdx] : null;

    // New role or first message → create a new entry
    if (!last || last.role !== role) {
      if (last && !last.isFinal) {
        updated[lastIdx] = { ...last, isFinal: true, committedChars: (last.text ?? "").length };
        committedIndexByRoleStore.current[last.role] = (updated[lastIdx].text ?? "").length;
        stableTextByRoleStore.current[last.role] = updated[lastIdx].text ?? "";
      }
      updated.push({
        role,
        text: transcript,
        timestamp,
        isFinal: isFinalIncoming ? true : false,
        committedChars: (transcript ?? "").length,
      });
      if (isFinalIncoming) {
        committedIndexByRoleStore.current[role] = (transcript ?? "").length;
        stableTextByRoleStore.current[role] = transcript;
      } else {
        committedIndexByRoleStore.current[role] = 0;
        stableTextByRoleStore.current[role] = "";
      }
      schedule(role);
      return updated;
    }

    // Same role → merge after committed index
    const baseIndex = committedIndexByRoleStore.current[role] ?? (last.text?.length || 0);
    const stableBase = (last.text ?? "").slice(0, baseIndex);
    const sep = stableBase && transcript ? (stableBase.endsWith(" ") ? "" : " ") : "";
    const merged = `${stableBase}${sep}${transcript}`.trim();

    if (isFinalIncoming) {
      updated[lastIdx] = { ...last, text: merged, isFinal: true, committedChars: merged.length };
      committedIndexByRoleStore.current[role] = merged.length;
      stableTextByRoleStore.current[role] = merged;
    } else {
      updated[lastIdx] = { ...last, text: merged, isFinal: false, committedChars: baseIndex };
    }
    schedule(role);
    return updated;
  }, []);

  // No-op finalize for main transcript; final messages will eventually arrive
  const scheduleNoop = useCallback((_role: string) => {}, []);

  const scheduleFinalizeCategory = useCallback((role: string) => {
    if (finalizeTimersCategoryRef.current[role]) {
      clearTimeout(finalizeTimersCategoryRef.current[role]);
    }
    finalizeTimersCategoryRef.current[role] = setTimeout(() => {
      const prev = currentCategoryBufferRef.current;
      if (prev.length === 0) return;
      const lastIdx = prev.length - 1;
      const last = prev[lastIdx];
      if (last && last.role === role && !last.isFinal) {
        const updated = [...prev];
        const len = (last.text ?? "").length;
        committedIndexByRoleCategoryRef.current[role] = len;
        updated[lastIdx] = { ...last, isFinal: true, committedChars: len };
        currentCategoryBufferRef.current = updated;
      }
    }, 2000);
  }, []);

  function resetCategoryConversationTracking() {
    currentCategoryBufferRef.current = [];
    stableTextByRoleCategoryRef.current = {};
    committedIndexByRoleCategoryRef.current = {};
    Object.values(finalizeTimersCategoryRef.current).forEach((t) => clearTimeout(t));
    finalizeTimersCategoryRef.current = {};
  }

  // Safely extract tool name from a Vapi tool.completed message
  function extractToolName(msg: any): string | null {
    if (typeof msg?.name === "string") return msg.name;
    const inner = msg?.messages;
    if (Array.isArray(inner) && inner.length > 0) {
      const found = inner.find((m: any) => typeof m?.name === "string");
      if (found?.name) return found.name;
      if (typeof inner[0]?.name === "string") return inner[0].name;
    }
    if (typeof msg?.tool?.name === "string") return msg.tool.name;
    return null;
  }

  function extractRubricCategory(msg: any): string | null {
    if (typeof msg?.rubric_category === "string") return msg.rubric_category;
    const inner = msg?.messages;
    if (Array.isArray(inner) && inner.length > 0) {
      const rb = inner.find((m: any) => m?.metadata?.responseBody?.rubric_category);
      if (typeof rb?.metadata?.responseBody?.rubric_category === "string") {
        return rb.metadata.responseBody.rubric_category;
      }
      const cand = inner[0]?.metadata?.responseBody?.rubric_category;
      if (typeof cand === "string") return cand;
    }
    const cand2 = msg?.metadata?.responseBody?.rubric_category;
    if (typeof cand2 === "string") return cand2;
    return null;
  }

  // Build section message array for the current category buffer
  function finalizeCurrentCategorySection(overrideCategory?: string): { category: string; messages: { role: string; message: string }[] } | null {
    const rubricOrder = rubricCategoryOrderRef.current || [];
    const safeIdx = Math.min(rubricIndexRef.current, Math.max(0, rubricOrder.length - 1));
    const rubricCategory = overrideCategory ?? (rubricOrder[safeIdx] ?? "unknown");
    const messages = currentCategoryBufferRef.current.map((m) => ({
      role: m.role,
      message: m.text,
    }));
    if (messages.length === 0) return null;
    return { category: rubricCategory, messages };
  }


  // Keep refs in sync when options change
  useEffect(() => {
    if (options?.assistantId) assistantIdRef.current = options.assistantId;
    if (options?.publicKey) publicKeyRef.current = options.publicKey;
    if (options?.clarificationAssistantId) clarificationAssistantIdRef.current = options.clarificationAssistantId;
    if (options?.deepdiveAssistantId) deepdiveAssistantIdRef.current = options.deepdiveAssistantId;
  }, [options?.assistantId, options?.publicKey]);

  // Persist debug logs to server (NDJSON). Fire-and-forget.
  const logDebug = useCallback((event: string, payload: Record<string, any>) => {
    try {
      fetch("/api/debug/vapi-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, ...payload }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore logging errors
    }
  }, []);
  // Clear the debug log file (best-effort)
  const clearDebugLog = useCallback(async () => {
    try {
      await fetch("/api/debug/vapi-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
    } catch {}
  }, []);
  
  const initializeVapi = useCallback(() => {
    if (!vapiRef.current) {
      const vapiInstance = new Vapi(publicKeyRef.current);
      vapiRef.current = vapiInstance;

      vapiInstance.on('call-start', () => {
        setIsSessionActive(true);
        isSessionActiveRef.current = true;
        logDebug("call-start", {});
        setConversation([]);
        conversationRef.current = [];
        // Reset category convo only when deep-dive is active
        if (deepDiveActiveRef.current) {
          resetCategoryConversationTracking();
          deepDiveSectionsRef.current = [];
        }
      });

      vapiInstance.on('call-end', () => {
        setIsSessionActive(false);
        isSessionActiveRef.current = false;
        pendingStartRef.current = false;
        logDebug("call-end", {});
        // On call end, finalize and send deep-dive session data once
        if (deepDiveActiveRef.current) {
          // If a cutover is pending, cancel and just include whatever is in the current buffer
          cancelSectionCutover();
          const lastSection = finalizeCurrentCategorySection(sectionCutoverTargetCategoryRef.current || undefined);
          if (lastSection) {
            const last = deepDiveSectionsRef.current[deepDiveSectionsRef.current.length - 1];
            if (last && last.category === lastSection.category) {
              last.messages.push(...lastSection.messages);
            } else {
              deepDiveSectionsRef.current.push(lastSection);
            }
          }
          const totalTranscript = conversationRef.current.map((m) => ({
            role: m.role,
            message: m.text,
          }));
          const sessionId = sessionIdRef.current;
          const payload = {
            session_id: sessionId,
            category_transcripts: deepDiveSectionsRef.current,
            total_transcript: totalTranscript,
          };
          console.log("call-end-flush", { sections: deepDiveSectionsRef.current.length, totalLen: totalTranscript.length });
          logDebug("call-end-flush", { sections: deepDiveSectionsRef.current.length, totalLen: totalTranscript.length });
          // Fire-and-forget final POST
          fetch("/api/interview/evaluate-deepdive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(() => {});
          // Reset deep-dive tracking
          resetCategoryConversationTracking();
          deepDiveSectionsRef.current = [];
          deepDiveActiveRef.current = false;
        }
        // Clear conversation AFTER building and sending the final payload
        setConversation([]);
        conversationRef.current = [];
      });

      vapiInstance.on('volume-level', (volume: number) => {
        setVolumeLevel(volume);
      });

      vapiInstance.on('message', (message: any) => {
        
        if (message.type === 'transcript') {
          // Log raw message to server for analysis
          setConversation((prev) => {
            const timestamp = new Date().toLocaleTimeString();
            const role = message.role as string;
            const transcript: string = message.transcript ?? "";
            const isFinalIncoming = message.transcriptType === 'final';

            const next = applyTranscriptUpdate(
              prev,
              role,
              transcript,
              isFinalIncoming,
              committedIndexByRoleRef,
              stableTextByRoleRef,
              scheduleNoop,
              timestamp
            );
            conversationRef.current = next;
            return next;
          });
          // Also track category-scoped conversation during deep-dive (buffer only, no per-category POSTs)
          if (deepDiveActiveRef.current) {
            lastTranscriptAtRef.current = Date.now();
            const role = message.role as string;
            const transcript: string = message.transcript ?? "";
            const isFinalIncoming = message.transcriptType === 'final';
            const timestamp = new Date().toLocaleTimeString();
            const next = applyTranscriptUpdate(
              currentCategoryBufferRef.current,
              role,
              transcript,
              isFinalIncoming,
              committedIndexByRoleCategoryRef,
              stableTextByRoleCategoryRef,
              scheduleFinalizeCategory,
              timestamp
            );
            currentCategoryBufferRef.current = next;
            lastTranscriptWasFinalRef.current = !!isFinalIncoming;
            // If a cutover is pending, react to speech activity:
            if (sectionCutoverPendingRef.current) {
              if (isFinalIncoming) {
                // Final segment → cutover immediately
                performSectionCutover();
              } else {
                // Partial speech → push back the cutover
                scheduleSectionCutover();
              }
            }
          }
        }else {
          logDebug("message", { message });
          console.log("tool call", message);
          // Detect tool completion boundaries for deep-dive
          if (deepDiveActiveRef.current && message.type === 'tool.completed') {
            const toolName = extractToolName(message);
            const rubricCategory = extractRubricCategory(message);
            // Ignore end-of-call tools; they shouldn't cause a category cutover
            if (toolName === "endCall") {
              logDebug("tool-completed-ignored", { toolName });
            } else {
              // Debounced cutover to avoid truncating user speech
              scheduleSectionCutover(rubricCategory);
            }
          }
        }
      });

      vapiInstance.on('error', (e: Error) => {
        console.error('Vapi error:', e);
        logDebug("error", { error: String(e?.message || e) });
      });
    }
  }, [logDebug]);

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

  const fetchAssistantIdForType = async (type: "clarification" | "deep-dive"): Promise<string> => {
    if (type === "clarification" && clarificationAssistantIdRef.current) return clarificationAssistantIdRef.current;
    if (type === "deep-dive" && deepdiveAssistantIdRef.current) return deepdiveAssistantIdRef.current;
    const res = await fetch(`/api/vapi/assistant-id?type=${encodeURIComponent(type)}`, { method: "GET" });
    if (!res.ok) {
      throw new Error(`Failed to fetch assistant id for ${type}: ${res.status}`);
    }
    const data = await res.json();
    if (!data?.id) {
      throw new Error(`Assistant id missing in response for ${type}`);
    }
    if (type === "clarification") clarificationAssistantIdRef.current = data.id;
    if (type === "deep-dive") deepdiveAssistantIdRef.current = data.id;
    return data.id;
  };

  const toggleCall = useCallback(async (assistantType?: "clarification" | "deep-dive", assistantOverrides?: Record<string, any>) => {
    try {
      return;
      console.log("toggleCall", assistantType, assistantOverrides);
      if (isSessionActiveRef.current) {
        console.log("stopping call");
        await vapiRef.current.stop();
        setIsSessionActive(false);
        isSessionActiveRef.current = false;
        logDebug("toggle-call", { action: "stop" });
        return;
      }
      if (pendingStartRef.current) {
        console.log("pendingStartRef.current", pendingStartRef.current);
        return;
      }
      if (!assistantType) {
        throw new Error('No assistantId provided to useVapi or toggleCall.');
      }
      const idToUse = await fetchAssistantIdForType(assistantType);
      console.log("idToUse", idToUse);
      pendingStartRef.current = true;
      if (assistantOverrides && Object.keys(assistantOverrides).length > 0) {
        console.log("starting call with overrides", assistantOverrides);
        logDebug("toggle-call", { action: "start", assistantType, withOverrides: true, assistantOverrides });
        console.log("using assistan id: ", idToUse);
        // If starting deep-dive, clear logs and duplicate-tracking first
        if (assistantType === "deep-dive") {
          await clearDebugLog();
          postedCategoriesRef.current.clear();
        }
        await vapiRef.current.start(idToUse, assistantOverrides );
      }
      setIsSessionActive(true);
      isSessionActiveRef.current = true;
      pendingStartRef.current = false;
      // Initialize deep-dive specific tracking/state
      if (assistantType === "deep-dive") {
        deepDiveActiveRef.current = true;
        // Use pre-configured session/category data (do not rely on overrides)
        rubricIndexRef.current = 0;
        resetCategoryConversationTracking();
        deepDiveSectionsRef.current = [];
        // Initialize main conversation boundary marker
        mainBoundaryIndexRef.current = conversation.length;
        
      } else {
        deepDiveActiveRef.current = false;
      }
    } catch (err) {
      console.error('Error toggling Vapi session:', err);
      logDebug("toggle-call-error", { error: String((err as any)?.message || err) });
      pendingStartRef.current = false;
    }
  }, [logDebug]);

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

  return { volumeLevel, isSessionActive, conversation, toggleCall, sendMessage, say, toggleMute, isMuted, configureDeepDive };
};

export default useVapi;