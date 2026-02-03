
            export let c = ["Informacion basico","Dia y tiempo","Idioma","Idiomas","Update your preferred language:","This will update your language for all the pages in the application.","Settings","Email from signatures are the names and email addresses that are used to send emails on behalf\nof the organization. You can add as many as you want, but they must be attached to a\nnon-public email address that you control.","Email from signatures","Display Settings","Customize how your workspace appears on public pages like event calendars and event signup pages.","Tab Icon URL","URL to an icon that will appear in browser tabs for public pages. Recommended size: 32x32px or 64x64px.","Primary Color","Main color for buttons, links, and primary accents on public pages.","Secondary Color","Accent color for success states and secondary elements on public pages.","Cancel","Save Changes","Failed to load organization settings.","Theme Settings","Are you sure you want to delete this email signature?",["System (",0,")"],"System send signature","This is the default send signature provided to every organization. You can customize the name and reply-to address.","Default send signature","Choose which email signature will be used by default when sending emails. You can override this for individual emails.","Select default signature","Updating...","Custom send signatures","Additional email signatures that you can use to send emails. These must be verified with Postmark.","Name & Email","Reply-to","Return path","The return path domain is used for bounce handling.","Status","Verification status from Postmark.","Actions","Verified","Not verified","Not set","Edit signature","Verify signature status","Delete signature","System","Loading...","New","Add Email from signature","Create a new email signature that will be verified with Postmark.","Display name","Email address","email@example.com","The email address must be verified with Postmark.","Reply-to address","reply@example.com","Optional. If not set, replies will go to the email address above.","Return path domain","bounce.example.com","Optional. The return path domain is used for bounce handling.","Create signature","This email address cannot be changed.","Edit Email from signature","Update the email signature details.","The email address cannot be changed.","Save changes"]
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
        