// Source - https://stackoverflow.com/a/79715169
// Posted by Theo, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-14, License - CC BY-SA 4.0

import { $getRoot, createEditor } from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';

export const htmlToJson = (htmlString: string) => {
	try {
		const tempEditor = createEditor({
			namespace: 'RichTextConverter'
		});

		let result = '';

		tempEditor.update(
			() => {
				const parser = new DOMParser();
				const dom = parser.parseFromString(htmlString, 'text/html');
				const nodes = $generateNodesFromDOM(tempEditor, dom);

				const root = $getRoot();
				root.append(...nodes);
			},
			{ discrete: true }
		);

		result = JSON.stringify(tempEditor.getEditorState().toJSON());
		return result;
	} catch (error) {
		console.error('Failed to stringify editor state from html:', error);
		return '';
	}
};

// for backwards compatibility
const hasRoot = (json: string) => {
	try {
		const parsed = JSON.parse(json);
		return parsed && parsed.root && parsed.root.children;
	} catch {
		return false;
	}
};

export const jsonToHtml = (json: string) => {
	if (hasRoot(json)) {
		const editor = createEditor({
			namespace: 'RichText'
		});

		let html = '';

		try {
			editor.update(
				() => {
					const editorState = editor.parseEditorState(json);

					editorState.read(() => {
						const htmlString = $generateHtmlFromNodes(editor, null);
						html = htmlString;
					});
				},
				{ discrete: true }
			);

			return html;
		} catch (error) {
			console.error('Failed to parse or set editor state from JSON:', error);
			return '';
		}
	}

	return json;
};
