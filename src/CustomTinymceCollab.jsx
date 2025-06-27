import { useEffect, useRef } from 'react';
import axios from 'axios';
import { convertHtmlToJson } from './convertions/HtmltoJson';
import { convertJsontoHtml } from './convertions/JsontoHtml';


const CustomTinyMceCollab = () => {
    const editorRef = useRef(null);
    const wsRef = useRef(null);
    const editorId = 'tiny-editor';

    useEffect(() => {
        const loadTinyMCEScript = () => {
            return new Promise((resolve) => {
                if (window.tinymce) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = 'tinymce/js/tinymce/tinymce.min.js';
                script.onload = () => resolve();
                document.body.appendChild(script);
            });
        };

        let editorInstance = null;

        const initEditor = (content) => {
            window.tinymce.init({
                selector: `#${editorId}`,
                height: 600,
                menubar: true,
                plugins: 'table lists advlist code image emoticons charmap insertdatetime media preview quickbars searchreplace',
                toolbar:
                    'undo redo | styleselect | bold italic | forecolor backcolor | alignleft aligncenter alignright | bullist numlist | table | print emoticons charmap insertdatetime image media preview save searchreplace',
                setup: (editor) => {
                    editorInstance = editor;
                    editorRef.current = editor;

                    editor.on('init', () => {
                        editor.setContent(content);
                    });

                    editor.on('Change KeyUp', () => {
                        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                            const htmlContent = editor.getContent();
                            const jsonContent = convertHtmlToJson(htmlContent, true);
                            const bookmark = editor.selection.getBookmark(2, true);

                            const message = {
                                type: 'content_update',
                                content: jsonContent,
                                cursor: bookmark,
                                timestamp: Date.now().toString(),
                            };

                            wsRef.current.send(JSON.stringify(message));
                        }
                    });
                },
            });
        };

        const fetchAndInit = async () => {
            await loadTinyMCEScript();

            try {
                // const res = await axios.get('https://8f89c53c-7e8c-458b-8561-33386c680c73-00-yg7ctkxthwa6.picard.replit.dev/document');
                const res = await axios.get('https://3ed10fa9-5099-4221-a618-744c43047476-00-n8mnnnl2ojn9.riker.replit.dev:5000/document');
                // const res = await axios.get('http://127.0.0.1:8099/document');
                console.log(res.data,'res.data')
                const htmlContent = convertJsontoHtml(res.data);
                initEditor(htmlContent);
            } catch (err) {
                console.error('Failed to fetch document or initialize editor', err);
                initEditor('');
            }
        };

        fetchAndInit();
        // const ws = new WebSocket('wss://8f89c53c-7e8c-458b-8561-33386c680c73-00-yg7ctkxthwa6.picard.replit.dev/ws');
        const ws = new WebSocket('wss://3ed10fa9-5099-4221-a618-744c43047476-00-n8mnnnl2ojn9.riker.replit.dev:5000/ws');
        // const ws = new WebSocket('ws://127.0.0.1:8099/ws');
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'content_update') {
                    const jsonContent = message.content;
                    const html = convertJsontoHtml(jsonContent);

                    if (editorRef.current) {
                        const editor = editorRef.current;
                        const bookmark = editor.selection.getBookmark(2, true);

                        const currentContent = editor.getContent();
                        if (currentContent !== html) {
                            editor.setContent(html);
                            editor.focus();
                            editor.selection.moveToBookmark(bookmark);
                        }
                    }
                }
            } catch (err) {
                console.error('Invalid WebSocket message:', event.data, err);
            }
        };

        return () => {
            ws.close();
            if (window.tinymce && editorInstance) {
                window.tinymce.remove(editorInstance);
            }
        };
    }, [editorId]);

    return (
        <div style={{width:"100%"}}>
            <h2>Collaborative TinyMCE Editor</h2>
            <textarea style={{width:"100%"}} id={editorId}></textarea>
        </div>
    );
};

export default CustomTinyMceCollab;
