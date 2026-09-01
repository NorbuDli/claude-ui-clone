import React from 'react';
import { Check, X, FileCode, ArrowRight } from 'lucide-react';
import { DiffProposal } from './types';

interface DiffViewerProps {
  diff: DiffProposal;
  onAccept: (diff: DiffProposal) => void;
  onReject: (diff: DiffProposal) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff, onAccept, onReject }) => {
  return (
    <div className="my-3 rounded-2xl bg-[#1C1B19] border border-[#2E2D2A] overflow-hidden shadow-lg select-none text-xs font-mono">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#22211F] border-b border-[#2B2A27]">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[#DA7756]" />
          <span className="font-semibold text-[#ECEBE7]">{diff.filePath}</span>
          <span className="text-[10px] bg-[#2A2926] text-[#8C8A82] px-2 py-0.5 rounded border border-[#333]">
            Proposed Changes
          </span>
        </div>

        {diff.status === 'pending' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReject(diff)}
              className="px-3 py-1 rounded-xl bg-[#282724] hover:bg-[#32312D] text-[#ECEBE7] text-xs font-sans transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5 text-[#8C8A82]" />
              <span>Reject</span>
            </button>
            <button
              onClick={() => onAccept(diff)}
              className="px-3.5 py-1 rounded-xl bg-[#DA7756] hover:bg-[#C86545] text-white text-xs font-sans font-semibold shadow transition-all flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept</span>
            </button>
          </div>
        ) : (
          <span className={`text-[11px] font-sans font-medium px-2 py-0.5 rounded ${
            diff.status === 'accepted' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-red-950/60 text-red-400 border border-red-800/40'
          }`}>
            {diff.status === 'accepted' ? '✓ Accepted & Applied' : '✕ Rejected'}
          </span>
        )}
      </div>

      {/* Explanation banner if provided */}
      {diff.explanation && (
        <div className="px-4 py-2 bg-[#181715] border-b border-[#242320] text-xs font-sans text-[#A5A39C]">
          {diff.explanation}
        </div>
      )}

      {/* Diff Code Lines */}
      <div className="p-2 overflow-x-auto max-h-64 leading-5 text-[12px]">
        {diff.lines.map((line, idx) => {
          if (line.type === 'removed') {
            return (
              <div key={idx} className="flex items-center gap-3 px-2 py-0.5 bg-red-950/30 text-red-300 rounded">
                <span className="text-red-500 w-3 select-none font-bold">-</span>
                <span className="whitespace-pre">{line.content}</span>
              </div>
            );
          }
          if (line.type === 'added') {
            return (
              <div key={idx} className="flex items-center gap-3 px-2 py-0.5 bg-emerald-950/30 text-emerald-300 rounded">
                <span className="text-emerald-500 w-3 select-none font-bold">+</span>
                <span className="whitespace-pre">{line.content}</span>
              </div>
            );
          }
          return (
            <div key={idx} className="flex items-center gap-3 px-2 py-0.5 text-[#8C8A82]">
              <span className="text-[#555] w-3 select-none">&nbsp;</span>
              <span className="whitespace-pre">{line.content}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
