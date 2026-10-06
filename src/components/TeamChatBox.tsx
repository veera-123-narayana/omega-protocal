import React, { useState, useRef, useEffect } from 'react';
import { TeamState, OperativeRole, ChatMessage } from '../types';
import { teamManager } from '../services/teamService';
import { soundFx } from '../utils/audio';
import { MessageSquare, Send, Minimize2, Maximize2, AlertCircle, Shield, Sparkles, ChevronDown } from 'lucide-react';

interface TeamChatBoxProps {
  teamState: TeamState;
  currentRole: OperativeRole;
}

export const TeamChatBox: React.FC<TeamChatBoxProps> = ({ teamState, currentRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(teamState.chatMessages?.length || 0);

  const messages = teamState.chatMessages || [];

  // Track unread messages when minimized
  useEffect(() => {
    if (!isOpen && messages.length > prevCountRef.current) {
      setUnreadCount((prev) => prev + (messages.length - prevCountRef.current));
      soundFx.playKeyTick();
    }
    prevCountRef.current = messages.length;
  }, [messages.length, isOpen]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [messages.length, isOpen]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    soundFx.playKeyTick();
    teamManager.sendChatMessage(inputText.trim(), false);
    setInputText('');
  };

  const sendQuickTactical = (text: string) => {
    soundFx.playKeyTick();
    teamManager.sendChatMessage(text, true);
  };

  const quickAlerts = [
    '🎯 Found clue for active sector!',
    '⚡ Check the Audio Spectrogram!',
    '🔥 Cracking the Algorithm Boss now',
    '⚠️ Watch for -10 XP penalty',
    '🧩 Need assistance on layer 3',
  ];

  return (
    <div className="fixed bottom-4 right-4 z-40 font-mono text-xs select-none">
      {/* Minimized Floating Button */}
      {!isOpen && (
        <button
          onClick={() => {
            soundFx.playKeyTick();
            setIsOpen(true);
            setUnreadCount(0);
          }}
          className="relative group p-3 bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 text-white rounded-full shadow-[0_0_25px_rgba(6,182,212,0.5)] border border-cyan-300/40 hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
          title="Open Operative Comms Channel"
        >
          <MessageSquare className="w-5 h-5 text-white" />
          <span className="font-orbitron font-bold text-[11px] tracking-wider hidden sm:inline">
            OPERATIVE COMMS
          </span>

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-950 animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-slate-950/95 border border-cyan-500/40 rounded-lg shadow-[0_0_40px_rgba(6,182,212,0.25)] backdrop-blur-xl flex flex-col h-[460px] overflow-hidden animate-fade-in">
          {/* Header with Cyber Gradient */}
          <div className="p-3 bg-gradient-to-r from-slate-900 via-cyan-950/80 to-slate-900 border-b border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="font-orbitron font-bold text-xs text-white tracking-wider flex items-center gap-1.5">
                  <span>TACTICAL COMMS</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                    {teamState.teamId}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Operative A &amp; Operative B Sync Link
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playKeyTick();
                setIsOpen(false);
              }}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Tactical Preset Chips */}
          <div className="p-2 bg-black/40 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px]">
            {quickAlerts.map((alert, i) => (
              <button
                key={i}
                onClick={() => sendQuickTactical(alert)}
                className="whitespace-nowrap px-2 py-0.5 rounded bg-slate-900 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-200 border border-slate-800 hover:border-cyan-500/40 transition-colors cursor-pointer"
              >
                {alert}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 scrollbar-thin bg-black/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs px-4">
                <Shield className="w-8 h-8 text-slate-700 mb-2" />
                <span>Tactical channel online. Send a transmission to your teammate.</span>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderRole === currentRole;
                const isOpA = msg.senderRole === 'OPERATIVE_A';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mb-0.5 px-1">
                      <span className={`font-bold ${isOpA ? 'text-cyan-400' : 'text-emerald-400'}`}>
                        {msg.senderName} ({isOpA ? 'OP-A' : 'OP-B'})
                      </span>
                      <span>·</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[85%] p-2.5 rounded-lg text-xs leading-relaxed break-words shadow-sm ${
                        msg.isTacticalAlert
                          ? 'bg-gradient-to-r from-yellow-950/80 to-amber-950/80 border border-yellow-500/40 text-yellow-200'
                          : isMe
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border border-cyan-400/30 rounded-tr-none'
                          : 'bg-gradient-to-r from-slate-900 to-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Transmit as ${currentRole === 'OPERATIVE_A' ? 'Operative A' : 'Operative B'}...`}
              className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 px-3 py-1.5 rounded text-white text-xs outline-none placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-black rounded hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
