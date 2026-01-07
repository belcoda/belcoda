
            export let c = ["Informacion basico","Dia y tiempo","Idioma","Idiomas","Update your preferred language:","This will update your language for all the pages in the application."]
            // only during dev, for HMR
            let latestVersion = -1
            // @ts-ignore
            export function update({ version, data }) {
                if (latestVersion >= version) {
                    return
                }
                for (const [ index, item ] of data['es'] ?? []) {
                    c[index] = item
                }
                latestVersion = version
            }
        