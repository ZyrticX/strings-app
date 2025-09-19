


export function createPageUrl(pageName: string) {
    // Split page name from query parameters
    const [page, queryString] = pageName.split('?');
    const lowercasePage = page.toLowerCase().replace(/ /g, '-');
    
    // Keep query parameters as-is (preserve case)
    return '/' + lowercasePage + (queryString ? '?' + queryString : '');
}