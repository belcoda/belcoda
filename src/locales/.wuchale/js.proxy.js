
            /** @type {{[loadID: string]: {[locale: string]: () => Promise<import('wuchale/runtime').CatalogModule>}}} */
            const catalogs = {js: {en: () => import('./main.main.en.compiled.js'),es: () => import('./main.main.es.compiled.js'),pt: () => import('./main.main.pt.compiled.js')}}
            export const loadCatalog = (/** @type {string} */ loadID, /** @type {string} */ locale) => catalogs[loadID][locale]()
            export const loadIDs = ['js']
        