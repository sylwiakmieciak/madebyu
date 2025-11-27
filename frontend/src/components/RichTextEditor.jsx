import { useState, useRef } from 'react';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef(null);

  const handleTextChange = (e) => {
    // Przekaż event z name="description"
    onChange({ target: { name: 'description', value: e.target.value } });
  };

  const insertTag = (openTag, closeTag = null) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const before = value.substring(0, start);
    const after = value.substring(end);
    
    let newText;
    if (closeTag) {
      newText = `${before}${openTag}${selectedText}${closeTag}${after}`;
    } else {
      newText = `${before}${openTag}${after}`;
    }
    
    onChange({ target: { name: 'description', value: newText } });
    
    // Przywróć focus
    setTimeout(() => {
      textarea.focus();
      const newPos = closeTag ? start + openTag.length : start + openTag.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const buttons = [
    { label: 'B', title: 'Pogrubienie', action: () => insertTag('<strong>', '</strong>') },
    { label: 'I', title: 'Kursywa', action: () => insertTag('<em>', '</em>') },
    { label: 'U', title: 'Podkreślenie', action: () => insertTag('<u>', '</u>') },
    { label: 'H2', title: 'Nagłówek 2', action: () => insertTag('<h2>', '</h2>') },
    { label: 'H3', title: 'Nagłówek 3', action: () => insertTag('<h3>', '</h3>') },
    { label: 'P', title: 'Akapit', action: () => insertTag('<p>', '</p>') },
    { label: 'BR', title: 'Przejście do nowej linii', action: () => insertTag('<br>') },
    { label: 'UL', title: 'Lista nieuporządkowana', action: () => insertTag('<ul>\n  <li>', '</li>\n</ul>') },
    { label: 'OL', title: 'Lista numerowana', action: () => insertTag('<ol>\n  <li>', '</li>\n</ol>') },
    { label: 'Link', title: 'Link', action: () => insertTag('<a href="URL">', '</a>') },
  ];

  return (
    <div style={{ 
      border: '2px solid var(--border-color)', 
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: '0.25rem', 
        padding: '0.5rem',
        backgroundColor: '#f3f4f6',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {buttons.map((btn, idx) => (
          <button
            key={idx}
            type="button"
            title={btn.title}
            onClick={btn.action}
            style={{
              padding: '0.4rem 0.6rem',
              fontSize: '0.85rem',
              fontWeight: btn.label === 'B' ? '700' : btn.label === 'I' ? 'normal' : '500',
              fontStyle: btn.label === 'I' ? 'italic' : 'normal',
              textDecoration: btn.label === 'U' ? 'underline' : 'none',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--primary-color)';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.color = 'inherit';
            }}
          >
            {btn.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          style={{
            marginLeft: 'auto',
            padding: '0.4rem 0.8rem',
            fontSize: '0.85rem',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: showPreview ? 'var(--primary-color)' : 'white',
            color: showPreview ? 'white' : 'inherit',
            cursor: 'pointer'
          }}
        >
          {showPreview ? '📝 Edycja' : '👁 Podgląd'}
        </button>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div 
          style={{ 
            padding: '1rem',
            minHeight: '150px',
            backgroundColor: 'white',
            lineHeight: '1.6'
          }}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          rows="8"
          style={{
            width: '100%',
            padding: '1rem',
            border: 'none',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            fontFamily: 'inherit',
            resize: 'vertical',
            minHeight: '150px',
            outline: 'none'
          }}
        />
      )}
      
      {/* Helper text */}
      <div style={{ 
        padding: '0.5rem 1rem',
        fontSize: '0.75rem',
        color: 'var(--text-light)',
        backgroundColor: '#f9fafb',
        borderTop: '1px solid var(--border-color)'
      }}>
        Wspierane tagi HTML: &lt;strong&gt;, &lt;em&gt;, &lt;u&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;br&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;, &lt;a&gt;
      </div>
    </div>
  );
}
