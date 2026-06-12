'use client';

import {
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiRefreshCw, FiSend } from 'react-icons/fi';
import { useEffect, useRef, useState } from 'react';
import { getToolById } from '@/lib/toolbox/registry';
import { streamToolboxChat } from '@/lib/toolbox/clientApi';
import { useToolbox } from './ToolboxProvider';
import { MessageContent } from './MessageContent';
import type { ChatMessage } from '@/lib/toolbox/types';

interface ToolboxChatShellProps {
  toolId: string;
}

export default function ToolboxChatShell({ toolId }: ToolboxChatShellProps) {
  const tool = getToolById(toolId);
  const { getMessages, setMessages } = useToolbox();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const messages = getMessages(toolId);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading || !tool?.promptKey) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(toolId, nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    let assistantContent = '';
    const withPlaceholder: ChatMessage[] = [...nextMessages, { role: 'assistant', content: '' }];
    setMessages(toolId, withPlaceholder);

    try {
      await streamToolboxChat(toolId, nextMessages, (chunk) => {
        assistantContent += chunk;
        setMessages(toolId, [...nextMessages, { role: 'assistant', content: assistantContent }]);
      });

      if (!assistantContent.trim()) {
        throw new Error('Assistant returned an empty response');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Assistant request failed';
      setError(message);
      setMessages(toolId, nextMessages);
    } finally {
      setLoading(false);
    }
  };

  if (!tool) return null;

  return (
    <VStack align="stretch" spacing={0} h="100%" minH={0}>
      <Box
        ref={logRef}
        flex="1"
        overflowY="auto"
        px={4}
        py={4}
        aria-live="polite"
        aria-label="Chat messages"
        data-testid="toolbox-chat-log"
      >
        {messages.length === 0 && !loading ? (
          <VStack align="stretch" spacing={3}>
            <Text color="text.muted" fontSize="sm">
              Ask about ISSF rules, medications, or anti-doping. Suggested questions:
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              {tool.suggestedQuestions.map((question) => (
                <Button
                  key={question}
                  size="sm"
                  variant="satrfOutline"
                  whiteSpace="normal"
                  textAlign="left"
                  h="auto"
                  py={2}
                  onClick={() => sendMessage(question)}
                >
                  {question}
                </Button>
              ))}
            </HStack>
          </VStack>
        ) : (
          <VStack align="stretch" spacing={3}>
            {messages.map((message, index) => (
              <Box
                key={`${message.role}-${index}`}
                alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
                maxW="92%"
                px={3}
                py={2}
                borderRadius="lg"
                bg={message.role === 'user' ? 'satrf.green.50' : 'bg.surface'}
                borderWidth={message.role === 'assistant' ? '1px' : 0}
                borderColor="gray.200"
                fontSize="sm"
                lineHeight="tall"
              >
                <MessageContent content={message.content || (loading && index === messages.length - 1 ? '…' : '')} role={message.role} />
              </Box>
            ))}
            {loading && (
              <HStack color="text.muted" fontSize="sm" spacing={2}>
                <Spinner size="sm" />
                <Text>Range Officer is thinking…</Text>
              </HStack>
            )}
          </VStack>
        )}
      </Box>

      {error && (
        <HStack px={4} py={2} bg="red.50" borderTopWidth="1px" borderColor="red.100" spacing={3}>
          <Text fontSize="sm" color="red.700" flex="1">
            {error}
          </Text>
          <IconButton
            aria-label="Retry last message"
            icon={<FiRefreshCw />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={() => {
              const lastUser = [...messages].reverse().find((m) => m.role === 'user');
              if (lastUser) {
                const prior = messages.slice(0, messages.lastIndexOf(lastUser));
                setMessages(toolId, prior);
                sendMessage(lastUser.content);
              }
            }}
          />
        </HStack>
      )}

      <HStack
        px={4}
        py={3}
        borderTopWidth="1px"
        borderColor="gray.200"
        bg="bg.surface"
        spacing={2}
        pb="calc(0.75rem + env(safe-area-inset-bottom))"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the Range Officer…"
          size="md"
          minH="44px"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          isDisabled={loading || !tool.promptKey}
          data-testid="toolbox-chat-input"
        />
        <IconButton
          aria-label="Send message"
          icon={<FiSend />}
          variant="satrf"
          size="md"
          minW="44px"
          minH="44px"
          onClick={() => sendMessage(input)}
          isLoading={loading}
          isDisabled={!input.trim() || !tool.promptKey}
        />
      </HStack>
    </VStack>
  );
}
