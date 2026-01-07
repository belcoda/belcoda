
            export let c = ["Basic information","Date and time","Language","Languages","Update your preferred language:","This will update your language for all the pages in the application."]
            // only during dev, for HMR
            let latestVersion = -1
            // @ts-ignore
            export function update({ version, data }) {
                if (latestVersion >= version) {
                    return
                }
                for (const [ index, item ] of data['en'] ?? []) {
                    c[index] = item
                }
                latestVersion = version
            }
        