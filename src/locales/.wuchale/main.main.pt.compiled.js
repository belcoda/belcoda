
            export let c = ["Basic information","Date and time","Language","Languages"]
            // only during dev, for HMR
            let latestVersion = -1
            // @ts-ignore
            export function update({ version, data }) {
                if (latestVersion >= version) {
                    return
                }
                for (const [ index, item ] of data['pt'] ?? []) {
                    c[index] = item
                }
                latestVersion = version
            }
        