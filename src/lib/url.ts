// Builds emit .html files but hosts serve clean URLs
export const cleanPath = (url: URL) => url.pathname.replace(/(\/index)?\.html$/, '') || '/';
