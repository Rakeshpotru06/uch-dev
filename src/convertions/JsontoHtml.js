export const convertJsontoHtml = (data, key = null) => {
    const isPlainObject = (val) =>
        val && typeof val === 'object' && !Array.isArray(val);

    const areObjectsWithSameKeys = (arr) => {
        if (!Array.isArray(arr) || arr.length < 2) return false;
        const keys = Object.keys(arr[0]).sort();
        return arr.every(
            (obj) =>
                isPlainObject(obj) &&
                JSON.stringify(Object.keys(obj).sort()) === JSON.stringify(keys)
        );
    };

    const areValuesObjectsWithSameKeys = (obj) => {
        const values = Object.values(obj);
        if (values.length < 2) return false;
        const allObjects = values.every((v) => isPlainObject(v));
        if (!allObjects) return false;
        const keys = Object.keys(values[0]).sort();
        return values.every(
            (v) =>
                JSON.stringify(Object.keys(v).sort()) === JSON.stringify(keys)
        );
    };

    const escapeHtml = (text) => {
        if (text === null || text === undefined) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    // ✅ CASE 1: Table with headers and rows
    if (
        isPlainObject(data) &&
        Array.isArray(data.headers) &&
        Array.isArray(data.rows)
    ) {
        return `
        <table border="1" cellpadding="4" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 16px;">
            <thead>
                <tr>${data.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${data.rows
                .map(
                    (row) =>
                        `<tr>${row
                            .map((cell) => {
                                if (typeof cell === 'boolean') {
                                    return `<td>
                                            <select>
                                                <option value="true" ${cell ? 'selected' : ''}>Yes</option>
                                                <option value="false" ${!cell ? 'selected' : ''}>No</option>
                                            </select>
                                        </td>`;
                                } else {
                                    return `<td>${escapeHtml(cell)}</td>`;
                                }
                            })
                            .join('')}</tr>`
                )
                .join('')}
            </tbody>
        </table>
        `;
    }

    // ✅ CASE 2: Array of objects ➝ table
    if (Array.isArray(data) && data.length > 0 && areObjectsWithSameKeys(data)) {
        const headers = Object.keys(data[0]);
        return `
            <table border="1" cellpadding="4" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 16px;">
                <thead>
                    <tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${data
                .map(
                    (row) =>
                        `<tr>${headers
                            .map((h) => `<td>${convertJsontoHtml(row[h], h)}</td>`)
                            .join('')}</tr>`
                )
                .join('')}
                </tbody>
            </table>
        `;
    }

    // ✅ CASE 3: Object of objects ➝ table
    if (isPlainObject(data) && areValuesObjectsWithSameKeys(data)) {
        const keys = Object.keys(Object.values(data)[0]);
        return `
            <table border="1" cellpadding="4" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 16px;">
                <thead>
                    <tr>
                        <th>${escapeHtml(key || '--')}</th>
                        ${keys.map((k) => `<th>${escapeHtml(k)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(data)
                .map(
                    ([k, v]) =>
                        `<tr><td>${escapeHtml(k)}</td>${keys
                            .map((innerKey) => `<td>${convertJsontoHtml(v[innerKey], innerKey)}</td>`)
                            .join('')}</tr>`
                )
                .join('')}
                </tbody>
            </table>
        `;
    }

    // ✅ CASE 4: Array ➝ List
    if (Array.isArray(data)) {
        return `<ul>${data
            .map((item) => `<li>${convertJsontoHtml(item)}</li>`)
            .join('')}</ul>`;
    }

    // ✅ CASE 5: Plain object ➝ labeled view
    if (isPlainObject(data)) {
        return `<div style="margin-bottom: 1em;">${Object.entries(data)
            .map(
                ([k, v]) =>
                    `<p style="margin: 0.2em 0;"><strong>${escapeHtml(k)}:</strong> ${convertJsontoHtml(v, k)}</p>`
            )
            .join('')}</div>`;
    }

    // ✅ CASE 6: Boolean ➝ Dropdown
    if (typeof data === 'boolean') {
        return `
            <select>
                <option value="true" ${data ? 'selected' : ''}>Yes</option>
                <option value="false" ${!data ? 'selected' : ''}>No</option>
            </select>
        `;
    }

    // ✅ Default: plain text (escaped)
    return escapeHtml(data);
};
