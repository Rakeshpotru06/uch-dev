export const convertHtmlToJson = (htmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const jsonData = {};

    // Extract simple key-value pairs from paragraphs
    doc.querySelectorAll('p').forEach((p) => {
        const keyElement = p.querySelector('strong');
        if (keyElement) {
            const key = keyElement.textContent.replace(':', '').trim();

            // Get text after <strong>
            let value = '';
            let foundStrong = false;
            p.childNodes.forEach((node) => {
                if (node === keyElement) {
                    foundStrong = true;
                } else if (foundStrong) {
                    value += node.textContent || '';
                }
            });

            value = value.trim();
            if (value.toLowerCase() === 'true') value = true;
            else if (value.toLowerCase() === 'false') value = false;

            jsonData[key] = value;
        }
    });

    // Extract nested divs (non-functional, interface requirements)
    doc.querySelectorAll('div').forEach((div) => {
        const prev = div.previousElementSibling;
        if (prev?.tagName === 'P' && prev.querySelector('strong')) {
            const key = prev.querySelector('strong').textContent.replace(':', '').trim();
            jsonData[key] = {};

            div.querySelectorAll('p').forEach((p) => {
                const label = p.querySelector('strong');
                if (label) {
                    const innerKey = label.textContent.replace(':', '').trim();
                    const value = p.textContent.replace(label.textContent, '').trim();
                    jsonData[key][innerKey] = value;
                }
            });
        }
    });

    // Extract tables
    doc.querySelectorAll('table').forEach((table) => {
        const headers = Array.from(table.querySelectorAll('thead th')).map((th) =>
            th.textContent.trim()
        );

        const rows = Array.from(table.querySelectorAll('tbody tr')).map((tr) => {
            return Array.from(tr.querySelectorAll('td')).map((td) => {
                const input = td.querySelector('input');
                const select = td.querySelector('select');

                if (input) return input.value.trim();
                if (select) {
                    const selected = select.options[select.selectedIndex];
                    const val = selected?.value?.toLowerCase();
                    return val === 'true' ? true : val === 'false' ? false : val;
                }

                return td.textContent.trim();
            });
        });

        // Attach to most recent empty string key
        const tableKey = Object.keys(jsonData).find((k) => jsonData[k] === '');
        if (tableKey) {
            jsonData[tableKey] = { headers, rows };
        }
    });

    return jsonData;
};
