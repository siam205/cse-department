'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Eraser,
} from 'lucide-react';

// Lightweight contentEditable rich text editor — no external
// dependency. The toolbar only ever inserts tags from the
// sanitize-html allowlist (see src/lib/sanitize-html.ts), and the
// server re-sanitizes on save regardless, so this is a UX layer,
// not the security boundary.
//
// Two usage modes:
//  - Standalone: pass `name` + `initialValue` — renders its own
//    hidden input for plain <form action> submission.
//  - Controlled: pass `value` + `onChange` — parent (e.g.
//    ParagraphsEditor) owns the string and renders hidden inputs
//    itself. No internal hidden input in this mode.
type Props = {
  name?: string;
  initialValue?: string;
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
};

const HEADING_BLOCKS = [
  { command: '<h2>', label: 'H2', title: 'Heading 2' },
  { command: '<h3>', label: 'H3', title: 'Heading 3' },
  { command: '<h4>', label: 'H4', title: 'Heading 4' },
  { command: '<p>', label: '¶', title: 'Paragraph' },
];

export default function RichTextEditor({
  name,
  initialValue = '',
  value,
  onChange,
  placeholder,
  minHeight = '140px',
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isControlled = onChange !== undefined;
  const [html, setHtml] = useState(isControlled ? (value ?? '') : initialValue);

  // Seed the contentEditable DOM node once on mount. Deliberately
  // NOT synced on every value change — contentEditable + React
  // controlled re-renders fight over cursor position, so this
  // stays an "uncontrolled" DOM node whose content we read out
  // via onInput instead of writing into on every keystroke.
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = isControlled ? (value ?? '') : initialValue;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sync() {
    const next = editorRef.current?.innerHTML ?? '';
    setHtml(next);
    onChange?.(next);
  }

  function exec(command: string, arg?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    sync();
  }

  function insertLink() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      window.alert('Select some text first, then click Link.');
      return;
    }
    const url = window.prompt('Link URL (https://…)');
    if (!url) return;
    exec('createLink', url);
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-accent/50 focus-within:border-accent bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <ToolbarButton title="Bold" onClick={() => exec('bold')}>
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => exec('italic')}>
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton title="Underline" onClick={() => exec('underline')}>
          <Underline size={15} />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" onClick={() => exec('strikeThrough')}>
          <Strikethrough size={15} />
        </ToolbarButton>
        <Divider />
        {HEADING_BLOCKS.map((b) => (
          <ToolbarButton key={b.label} title={b.title} onClick={() => exec('formatBlock', b.command)}>
            <span className="text-[11px] font-bold w-[15px] text-center">{b.label}</span>
          </ToolbarButton>
        ))}
        <Divider />
        <ToolbarButton title="Bullet list" onClick={() => exec('insertUnorderedList')}>
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" onClick={() => exec('insertOrderedList')}>
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton title="Quote" onClick={() => exec('formatBlock', '<blockquote>')}>
          <Quote size={15} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Insert link (select text first)" onClick={insertLink}>
          <LinkIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Clear formatting" onClick={() => exec('removeFormat')}>
          <Eraser size={15} />
        </ToolbarButton>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="rte-content px-3 py-2.5 text-sm leading-relaxed focus:outline-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_h4]:text-sm [&_h4]:font-bold [&_h4]:mt-2 [&_h4]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_a]:text-accent [&_a]:underline [&_p]:my-1.5 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
      />

      {!isControlled && name && <input type="hidden" name={name} value={html} readOnly />}
    </div>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-gray-300 mx-1 self-center" aria-hidden="true" />;
}

function ToolbarButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      // Prevent the button from stealing focus off the editor
      // before the command runs (execCommand needs the editor
      // selection to still be active).
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="p-1.5 rounded text-gray-600 hover:bg-gray-200 hover:text-primary transition-colors flex items-center justify-center"
    >
      {children}
    </button>
  );
}
