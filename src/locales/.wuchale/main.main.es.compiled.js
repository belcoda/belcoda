
            export let c = ["Informacion basico","Dia y tiempo","Idioma","Idiomas","Update your preferred language:","This will update your language for all the pages in the application.","Settings","Email from signatures are the names and email addresses that are used to send emails on behalf\nof the organization. You can add as many as you want, but they must be attached to a\nnon-public email address that you control.","Email from signatures"]
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
        